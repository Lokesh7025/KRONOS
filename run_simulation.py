import pandas as pd
from datetime import datetime, timedelta
from ortools.sat.python import cp_model
import sys
import time
import joblib

# --- 1. SIMULATION CONFIGURATION ---
SIMULATION_START_DATE = datetime(2025, 9, 1)
SIMULATION_MONTH_DAYS = 30
HEALTH_SCORE_MAINTENANCE_THRESHOLD = 50
# --- FIX IS HERE: Re-added the missing constants ---
DAILY_KM_PER_TRAIN = 200
DAILY_HOURS_PER_TRAIN = 16
# --- END OF FIX ---

try:
    AI_WEIGHT_PREDICTOR = joblib.load("weight_predictor_model.joblib")
    print("AI Weight Predictor model loaded successfully.")
except FileNotFoundError:
    print("Error: 'weight_predictor_model.joblib' not found.")
    print("Please run train_weight_predictor.py first to create the model.")
    AI_WEIGHT_PREDICTOR = None

MANUAL_INPUTS_CALENDAR = {
    5: {"Rake-12": {"health_penalty": 40, "reason": "Visual inspection"}},
    15: {"Rake-19": {"force_maintenance": True, "reason": "Driver report"}}
}
MONTHLY_SCENARIOS = ['NORMAL'] * SIMULATION_MONTH_DAYS
MONTHLY_SCENARIOS[6] = MONTHLY_SCENARIOS[7] = 'FESTIVAL_SURGE'
MONTHLY_SCENARIOS[12] = MONTHLY_SCENARIOS[13] = 'HEAVY_MONSOON'
MONTHLY_SCENARIOS[21] = 'FESTIVAL_SURGE'

MAINTENANCE_SLOT_PENALTY = 1000000
SERVICE_SHORTFALL_PENALTY = 5000000
SCENARIO_MODIFIERS = {
    "NORMAL": {"MIN_SERVICE": 5, "MAX_SERVICE": 6, "MAINTENANCE_SLOTS": 2},
    "HEAVY_MONSOON": {"MIN_SERVICE": 5, "MAX_SERVICE": 6, "MAINTENANCE_SLOTS": 2},
    "FESTIVAL_SURGE": {"MIN_SERVICE": 6, "MAX_SERVICE": 7, "MAINTENANCE_SLOTS": 1}
}
AI_MODEL_FEATURES = [
    'health_score_start_of_day', 'km_since_last_service',
    'consecutive_service_days', 'was_heavy_rain', 'was_high_demand',
    'brake_model_HydroMech_v1'
]

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

def solve_daily_optimization(fleet_df, current_day, scenario="NORMAL"):
    model = cp_model.CpModel()
    modifiers = SCENARIO_MODIFIERS[scenario]
    is_in_service = {r['train_id']: model.NewBoolVar(f"s_{r['train_id']}") for _, r in fleet_df.iterrows()}
    is_in_maintenance = {r['train_id']: model.NewBoolVar(f"m_{r['train_id']}") for _, r in fleet_df.iterrows()}
    is_on_standby = {r['train_id']: model.NewBoolVar(f"b_{r['train_id']}") for _, r in fleet_df.iterrows()}
    
    for _, row in fleet_df.iterrows():
        tid = row['train_id']
        model.Add(is_in_service[tid] + is_in_maintenance[tid] + is_on_standby[tid] == 1)
        if row['is_cert_expired'] or row['job_card_priority'] == 'CRITICAL': model.Add(is_in_service[tid] == 0)
        if row['health_score'] < HEALTH_SCORE_MAINTENANCE_THRESHOLD or row['manual_force_maintenance']:
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
        
        features = {
            'health_score_start_of_day': row['health_score'],
            'km_since_last_service': row['km_since_last_service'],
            'consecutive_service_days': row.get('consecutive_service_days', 0),
            'was_heavy_rain': 1 if scenario == 'HEAVY_MONSOON' else 0,
            'was_high_demand': 1 if scenario == 'FESTIVAL_SURGE' else 0,
            'brake_model_HydroMech_v1': 1 if row['brake_model'] == 'HydroMech_v1' else 0
        }
        features_df = pd.DataFrame([features], columns=AI_MODEL_FEATURES)
        predicted_risk_score = AI_WEIGHT_PREDICTOR.predict(features_df)[0]
        service_cost = int(predicted_risk_score * 1000)
        
        total_objective.append(service_cost * service_var)
        total_objective.append(int(row['health_score']) * is_in_maintenance[tid])
        
        if row['branding_sla_active']:
            hours_needed = row['target_hours'] - row['current_hours']
            if hours_needed > 0:
                run_rate = hours_needed / (SIMULATION_MONTH_DAYS - current_day + 1)
                urgency = run_rate / DAILY_HOURS_PER_TRAIN
                penalty = int(50000 * urgency)
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

def apply_daily_updates(df, plan):
    service_trains = plan['SERVICE']
    if 'consecutive_service_days' not in df.columns:
        df['consecutive_service_days'] = 0
    df.loc[df['train_id'].isin(service_trains), 'consecutive_service_days'] += 1
    df.loc[~df['train_id'].isin(service_trains), 'consecutive_service_days'] = 0
    df.loc[df['train_id'].isin(service_trains), 'current_km'] += DAILY_KM_PER_TRAIN
    branded_service = df[(df['train_id'].isin(service_trains)) & (df['branding_sla_active'])]
    df.loc[df.index.isin(branded_service.index), 'current_hours'] += DAILY_HOURS_PER_TRAIN
    
    maintenance_trains = plan['MAINTENANCE']
    df.loc[df['train_id'].isin(maintenance_trains), 'health_score'] = 100
    df.loc[df['train_id'].isin(maintenance_trains), 'bogie_last_service_km'] = df.loc[df['train_id'].isin(maintenance_trains), 'current_km']
    
    if 'total_service_days_month' not in df.columns: df['total_service_days_month'] = 0
    if 'total_maintenance_days_month' not in df.columns: df['total_maintenance_days_month'] = 0
    df.loc[df['train_id'].isin(service_trains), 'total_service_days_month'] += 1
    df.loc[df['train_id'].isin(maintenance_trains), 'total_maintenance_days_month'] += 1
    return df

if __name__ == "__main__":
    if AI_WEIGHT_PREDICTOR is None:
        sys.exit(1)

    for day in range(1, SIMULATION_MONTH_DAYS + 1):
        scenario = MONTHLY_SCENARIOS[day - 1]
        manual_inputs_today = MANUAL_INPUTS_CALENDAR.get(day, {})
        
        print(f"\n{'='*25} DAY {day} | SCENARIO: {scenario.replace('_', ' ')} {'='*25}")
        if manual_inputs_today: print(f"MANUAL OVERRIDES FOR TODAY: {manual_inputs_today}")
        
        fleet_df = get_fleet_data()
        if fleet_df is None: break
            
        fleet_df = preprocess_and_health_score(fleet_df, day, manual_inputs_today)
        daily_plan, daily_cost = solve_daily_optimization(fleet_df, day, scenario)
        
        if daily_plan:
            print("Optimal plan generated for tomorrow:")
            if daily_cost is not None:
                true_operational_cost = daily_cost % MAINTENANCE_SLOT_PENALTY
                print(f"  - AI-Predicted Operational Cost for Day {day+1}: ₹{true_operational_cost:,}")
            
            for category, trains in daily_plan.items():
                print(f"  - {category} ({len(trains)}): {sorted(trains)}")
            
            updated_df = apply_daily_updates(fleet_df, daily_plan)
            updated_df.to_csv("fleet_status.csv", index=False)
        else:
            print(f"CRITICAL FAILURE on Day {day}. Halting simulation.")
            break
        
        time.sleep(0.5)
    
    print(f"\n{'='*25} END OF MONTH SIMULATION COMPLETE {'='*25}")
    final_df = get_fleet_data()
    if final_df is not None:
        print("\n--- FINAL FLEET STATUS AT END OF MONTH ---")
        columns_to_show = ['train_id', 'health_score', 'current_km', 'current_hours', 'consecutive_service_days', 'total_service_days_month', 'total_maintenance_days_month']
        print(final_df[columns_to_show].to_string(index=False))

