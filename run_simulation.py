import pandas as pd
from datetime import datetime, timedelta
from ortools.sat.python import cp_model
import sys
import time
import joblib

# --- 1. SIMULATION CONFIGURATION ---
SIMULATION_START_DATE = datetime(2025, 9, 1)
SIMULATION_MONTH_DAYS = 30
DAILY_KM_PER_TRAIN = 200
DAILY_HOURS_PER_TRAIN = 16
CERTIFICATE_VALIDITY_DAYS = 365
# Note: Core strategy parameters like target mileage and health threshold are now predicted by the AI

# --- LOAD THE AI STRATEGIST MODEL ---
try:
    AI_STRATEGIST_MODEL = joblib.load("strategy_model.joblib")
    print("AI Strategist model loaded successfully.")
except FileNotFoundError:
    print("Error: 'strategy_model.joblib' not found. Please run train_strategy_model.py first.")
    AI_STRATEGIST_MODEL = None

# Scenario calendars
MANUAL_INPUTS_CALENDAR = {
    5: {"Rake-12": {"health_penalty": 40, "reason": "Visual inspection"}},
    15: {"Rake-19": {"force_maintenance": True, "reason": "Driver report"}}
}
MONTHLY_SCENARIOS = ['NORMAL'] * 30
MONTHLY_SCENARIOS[6] = MONTHLY_SCENARIOS[7] = 'FESTIVAL_SURGE'
MONTHLY_SCENARIOS[12] = MONTHLY_SCENARIOS[13] = 'HEAVY_MONSOON'
MONTHLY_SCENARIOS[21] = 'FESTIVAL_SURGE'

# --- 2. FIXED COSTS AND MODIFIERS ---
MAINTENANCE_SLOT_PENALTY = 1000000
SERVICE_SHORTFALL_PENALTY = 5000000
BASE_SHUNT_COST = 400
SCENARIO_MODIFIERS = {
    "NORMAL": {"MIN_SERVICE": 6, "MAX_SERVICE": 6, "MAINTENANCE_SLOTS": 2},
    "HEAVY_MONSOON": {"MIN_SERVICE": 6, "MAX_SERVICE": 6, "MAINTENANCE_SLOTS": 2, "WEATHER_PENALTY_OLD_BRAKES": 15000},
    "FESTIVAL_SURGE": {"MIN_SERVICE": 7, "MAX_SERVICE": 8, "MAINTENANCE_SLOTS": 1}
}

# --- 3. HELPER FUNCTIONS ---
def get_fleet_data(file_path="fleet_status.csv"):
    try: return pd.read_csv(file_path)
    except FileNotFoundError: print(f"Error: '{file_path}' not found. Please run initialize_month.py first."); return None

def preprocess_and_health_score(df, current_day, manual_inputs):
    df['cert_telecom_expiry'] = pd.to_datetime(df['cert_telecom_expiry'])
    today = SIMULATION_START_DATE + timedelta(days=current_day - 1)
    df['is_cert_expired'] = df['cert_telecom_expiry'] < today
    df['health_score'] = 100.0
    df['km_since_last_service'] = df['current_km'] - df['bogie_last_service_km']
    df['health_score'] -= (df['km_since_last_service'] / 200).astype(float)
    if 'consecutive_service_days' in df.columns:
        df['health_score'] -= df['consecutive_service_days']
    priority_penalties = {'LOW': 10, 'MEDIUM': 20, 'CRITICAL': 50}
    for p, penalty in priority_penalties.items():
        df.loc[(df['job_card_status'] == 'OPEN') & (df['job_card_priority'] == p), 'health_score'] -= penalty
    df['manual_force_maintenance'] = False
    for train_id, override in manual_inputs.items():
        if 'health_penalty' in override: df.loc[df['train_id'] == train_id, 'health_score'] -= override['health_penalty']
        if 'force_maintenance' in override: df.loc[df['train_id'] == train_id, 'manual_force_maintenance'] = True
    df['health_score'] = df['health_score'].clip(lower=0)
    return df

# --- 4. THE AI-DRIVEN OPTIMIZER ---
def solve_daily_optimization(fleet_df, current_day, scenario, dynamic_strategy={}):
    model = cp_model.CpModel()
    modifiers = SCENARIO_MODIFIERS[scenario]
    
    FATIGUE_PENALTY_FACTOR = dynamic_strategy.get('fatigue_factor', 500)
    PER_KM_DEVIATION_COST = dynamic_strategy.get('cost_per_km', 5)
    BRANDING_SLA_PENALTY = dynamic_strategy.get('branding_penalty', 50000)
    TARGET_MONTHLY_KM = dynamic_strategy.get('target_mileage', 1400)
    HEALTH_SCORE_MAINTENANCE_THRESHOLD = dynamic_strategy.get('maint_threshold', 50)
    
    is_in_service = {r['train_id']: model.NewBoolVar(f"s_{r['train_id']}") for _, r in fleet_df.iterrows()}
    is_in_maintenance = {r['train_id']: model.NewBoolVar(f"m_{r['train_id']}") for _, r in fleet_df.iterrows()}
    is_on_standby = {r['train_id']: model.NewBoolVar(f"b_{r['train_id']}") for _, r in fleet_df.iterrows()}
    
    for _, row in fleet_df.iterrows():
        tid = row['train_id']
        model.Add(is_in_service[tid] + is_in_maintenance[tid] + is_on_standby[tid] == 1)
        if row['is_cert_expired'] or row['job_card_priority'] == 'CRITICAL': model.Add(is_in_service[tid] == 0)
        
        # --- THIS IS THE CRITICAL CHANGE ---
        # A train MUST be maintained if health is low, it's manually flagged, OR its certificate is expired.
        if row['health_score'] < HEALTH_SCORE_MAINTENANCE_THRESHOLD or row['manual_force_maintenance'] or row['is_cert_expired']:
            model.Add(is_in_maintenance[tid] == 1)
            
    model.Add(sum(is_in_service.values()) <= modifiers['MAX_SERVICE'])
    
    total_objective = []
    num_in_service = sum(is_in_service.values())
    shortfall = model.NewIntVar(0, modifiers['MIN_SERVICE'], 'shortfall')
    model.Add(shortfall >= modifiers['MIN_SERVICE'] - num_in_service)
    total_objective.append(shortfall * SERVICE_SHORTFALL_PENALTY)
    num_in_maint = sum(is_in_maintenance.values())
    maint_dev = model.NewIntVar(-len(fleet_df), len(fleet_df), 'maint_dev')
    model.Add(maint_dev == num_in_maint - modifiers['MAINTENANCE_SLOTS'])
    abs_maint_dev = model.NewIntVar(0, len(fleet_df), 'abs_maint_dev')
    model.AddAbsEquality(abs_maint_dev, maint_dev)
    total_objective.append(abs_maint_dev * MAINTENANCE_SLOT_PENALTY)

    for _, row in fleet_df.iterrows():
        tid, service_var = row['train_id'], is_in_service[row['train_id']]
        
        consecutive_days = row.get('consecutive_service_days', 0)
        fatigue_cost = int((consecutive_days**2) * FATIGUE_PENALTY_FACTOR)
        service_cost = fatigue_cost
        
        ideal_km = (TARGET_MONTHLY_KM / SIMULATION_MONTH_DAYS) * current_day
        urgency_multiplier = current_day / SIMULATION_MONTH_DAYS
        mileage_cost = int(abs(row['current_km'] - ideal_km) * PER_KM_DEVIATION_COST * urgency_multiplier)
        service_cost += mileage_cost
        
        service_cost += int(row['stabling_shunt_moves'] * BASE_SHUNT_COST)
        if scenario == "HEAVY_MONSOON":
            if row['brake_model'] == 'HydroMech_v1': service_cost += modifiers['WEATHER_PENALTY_OLD_BRAKES']
        
        total_objective.append(service_cost * service_var)
        total_objective.append(int(row['health_score']) * is_in_maintenance[tid])
        
        if row['branding_sla_active']:
            hours_needed = row['target_hours'] - row['current_hours']
            if hours_needed > 0:
                run_rate = hours_needed / (SIMULATION_MONTH_DAYS - current_day + 1)
                urgency = run_rate / DAILY_HOURS_PER_TRAIN
                penalty = int(BRANDING_SLA_PENALTY * urgency)
                total_objective.append(penalty * (1 - service_var))

    model.Minimize(sum(total_objective))
    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        plan = {'SERVICE': [], 'MAINTENANCE': [], 'STANDBY': []}
        for _, r in fleet_df.iterrows():
            if solver.Value(is_in_service[r['train_id']]): plan['SERVICE'].append(r['train_id'])
            elif solver.Value(is_in_maintenance[r['train_id']]): plan['MAINTENANCE'].append(r['train_id'])
            else: plan['STANDBY'].append(r['train_id'])
        return plan, int(solver.ObjectiveValue())
    return None, None

# --- 5. SIMULATION ENGINE ---
def apply_daily_updates(df, plan, current_day):
    service_trains = plan['SERVICE']
    maintenance_trains = plan['MAINTENANCE']
    today = SIMULATION_START_DATE + timedelta(days=current_day - 1)
    if 'consecutive_service_days' not in df.columns: df['consecutive_service_days'] = 0
    df.loc[df['train_id'].isin(service_trains), 'consecutive_service_days'] += 1
    df.loc[~df['train_id'].isin(service_trains), 'consecutive_service_days'] = 0
    df.loc[df['train_id'].isin(service_trains), 'current_km'] += DAILY_KM_PER_TRAIN
    branded_service = df[(df['train_id'].isin(service_trains)) & (df['branding_sla_active'])]
    df.loc[df.index.isin(branded_service.index), 'current_hours'] += DAILY_HOURS_PER_TRAIN
    for train_id in maintenance_trains:
        train_index = df[df['train_id'] == train_id].index
        current_expiry = pd.to_datetime(df.loc[train_index, 'cert_telecom_expiry'].iloc[0])
        if current_expiry < today:
            new_expiry_date = today + timedelta(days=CERTIFICATE_VALIDITY_DAYS)
            df.loc[train_index, 'cert_telecom_expiry'] = new_expiry_date
            print(f"    INFO: Certificate for {train_id} renewed to {new_expiry_date.strftime('%Y-%m-%d')}")
    df.loc[df['train_id'].isin(maintenance_trains), 'health_score'] = 100
    df.loc[df['train_id'].isin(maintenance_trains), 'bogie_last_service_km'] = df.loc[df['train_id'].isin(maintenance_trains), 'current_km']
    if 'total_service_days_month' not in df.columns: df['total_service_days_month'] = 0
    if 'total_maintenance_days_month' not in df.columns: df['total_maintenance_days_month'] = 0
    df.loc[df['train_id'].isin(service_trains), 'total_service_days_month'] += 1
    df.loc[df['train_id'].isin(maintenance_trains), 'total_maintenance_days_month'] += 1
    return df

# --- 6. MAIN SIMULATION LOOP ---
if __name__ == "__main__":
    if AI_STRATEGIST_MODEL is None:
        sys.exit(1)

    for day in range(1, SIMULATION_MONTH_DAYS + 1):
        scenario = MONTHLY_SCENARIOS[day - 1]
        manual_inputs_today = MANUAL_INPUTS_CALENDAR.get(day, {})
        
        print(f"\n{'='*25} DAY {day} | SCENARIO: {scenario.replace('_', ' ')} {'='*25}")
        
        fleet_df = get_fleet_data()
        if fleet_df is None: break
            
        fleet_df = preprocess_and_health_score(fleet_df, day, manual_inputs_today)

        current_conditions = {
            'total_fleet_size': len(fleet_df),
            'target_service_trains': SCENARIO_MODIFIERS[scenario]['MIN_SERVICE'],
            'avg_fleet_health': fleet_df['health_score'].mean(),
            'is_monsoon': 1 if scenario == 'HEAVY_MONSOON' else 0,
            'is_surge': 1 if scenario == 'FESTIVAL_SURGE' else 0
        }
        conditions_df = pd.DataFrame([current_conditions])
        
        predicted_strategy = AI_STRATEGIST_MODEL.predict(conditions_df)[0]
        dynamic_strategy = {
            'cost_per_km': predicted_strategy[0],
            'fatigue_factor': predicted_strategy[1],
            'branding_penalty': predicted_strategy[2],
            'target_mileage': predicted_strategy[3],
            'maint_threshold': predicted_strategy[4]
        }
        print(f"AI Strategist recommends for today: Target KM={dynamic_strategy['target_mileage']:.0f}, Maint. Threshold={dynamic_strategy['maint_threshold']:.0f}")

        daily_plan, daily_cost = solve_daily_optimization(fleet_df, day, scenario, dynamic_strategy)
        
        if daily_plan:
            print("Optimal plan generated for tomorrow:")
            if daily_cost is not None:
                true_op_cost = daily_cost % MAINTENANCE_SLOT_PENALTY
                print(f"  - Projected Operational Cost for Day {day+1}: ₹{true_op_cost:,}")
            
            for category, trains in daily_plan.items():
                print(f"  - {category} ({len(trains)}): {sorted(trains)}")
            
            updated_df = apply_daily_updates(fleet_df, daily_plan, day)
            updated_df.to_csv("fleet_status.csv", index=False)
        else:
            print(f"CRITICAL FAILURE on Day {day}. Halting simulation.")
            break
        time.sleep(0.5)

    print(f"\n{'='*25} END OF MONTH SIMULATION COMPLETE {'='*25}")
    final_df = get_fleet_data()
    if final_df is not None:
        print("\n--- FINAL FLEET STATUS AT END OF MONTH ---")
        cols_to_show = ['train_id', 'health_score', 'current_km', 'current_hours', 'total_service_days_month', 'total_maintenance_days_month']
        print(final_df[cols_to_show].to_string(index=False))

