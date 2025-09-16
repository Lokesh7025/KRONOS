import psycopg2
import pandas as pd
import os
# from dotenv import load_dotenv # We no longer need this

# --- DATABASE CONFIGURATION ---
# load_dotenv() # We no longer need this

# --- DIRECT DATABASE CONNECTION DETAILS ---
# !! IMPORTANT !!
# Replace 'your_postgres_user' with your PostgreSQL username (usually 'postgres')
# Replace 'your_postgres_password' with the password you set during installation.
DB_CONFIG = {
    "dbname": "kronos",
    "user": "your_postgres_user",
    "password": "your_postgres_password",
    "host": "localhost",
    "port": "5432",
}

# --- FILE PATHS ---
FLEET_DATA_CSV = 'fleet_data.csv'
HISTORICAL_DATA_CSV = 'historical_strategy_data.csv'

# --- TABLE CREATION SQL ---
SQL_CREATE_FLEET_TABLE = """
CREATE TABLE IF NOT EXISTS fleet_status (
    train_id VARCHAR(10) PRIMARY KEY,
    health_score REAL,
    current_km INTEGER,
    current_hours REAL,
    job_card_status VARCHAR(50),
    job_card_priority VARCHAR(50),
    cert_telecom_expiry DATE,
    branding_sla_active BOOLEAN,
    target_hours REAL,
    last_cleaned_date DATE,
    stabling_shunt_moves INTEGER,
    brake_model VARCHAR(50),
    bogie_last_service_km INTEGER,
    consecutive_service_days INTEGER,
    total_service_days_month INTEGER,
    total_maintenance_days_month INTEGER
);
"""

SQL_CREATE_HISTORICAL_TABLE = """
CREATE TABLE IF NOT EXISTS historical_strategy_data (
    id SERIAL PRIMARY KEY,
    total_fleet_size INTEGER,
    target_service_trains INTEGER,
    avg_fleet_health REAL,
    is_monsoon INTEGER,
    is_surge INTEGER,
    historical_cost_per_km REAL,
    historical_fatigue_factor REAL,
    historical_branding_penalty REAL,
    historical_target_mileage REAL,
    historical_maint_threshold REAL,
    success_score INTEGER
);
"""

def setup_database():
    """Connects to PostgreSQL, creates tables, and populates them from CSVs."""
    conn = None
    try:
        print("Connecting to the PostgreSQL database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("Creating 'fleet_status' table...")
        cur.execute(SQL_CREATE_FLEET_TABLE)

        print("Creating 'historical_strategy_data' table...")
        cur.execute(SQL_CREATE_HISTORICAL_TABLE)
        
        conn.commit()

        # --- Populate Tables ---
        print("\nPopulating database tables from CSV files...")
        
        # Populate fleet_status
        try:
            fleet_df = pd.read_csv(FLEET_DATA_CSV)
            # Add missing columns from the simulation state
            for col in ['health_score', 'current_km', 'current_hours', 'consecutive_service_days', 'total_service_days_month', 'total_maintenance_days_month']:
                if col not in fleet_df.columns:
                    fleet_df[col] = 0
            
            # Clear table before inserting
            cur.execute("TRUNCATE TABLE fleet_status RESTART IDENTITY;")
            for _, row in fleet_df.iterrows():
                # Handling potential NaN values for fields that might be empty in the CSV
                target_hours = row.get('target_hours') if pd.notna(row.get('target_hours')) else None
                
                cur.execute(
                    """
                    INSERT INTO fleet_status (train_id, health_score, current_km, current_hours, job_card_status, job_card_priority, cert_telecom_expiry, branding_sla_active, target_hours, last_cleaned_date, stabling_shunt_moves, brake_model, bogie_last_service_km, consecutive_service_days, total_service_days_month, total_maintenance_days_month)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (row['train_id'], row.get('health_score', 100), row.get('current_km', 0), row.get('current_hours', 0), row.get('job_card_status', 'CLOSED'), row.get('job_card_priority', 'NONE'), row['cert_telecom_expiry'], row['branding_sla_active'], target_hours, row['last_cleaned_date'], row['stabling_shunt_moves'], row['brake_model'], row['bogie_last_service_km'], row.get('consecutive_service_days', 0), row.get('total_service_days_month', 0), row.get('total_maintenance_days_month', 0))
                )
            print(f"Successfully loaded {len(fleet_df)} records into 'fleet_status'.")
        except FileNotFoundError:
            print(f"Warning: '{FLEET_DATA_CSV}' not found. 'fleet_status' table will be empty.")

        # Populate historical_strategy_data
        try:
            hist_df = pd.read_csv(HISTORICAL_DATA_CSV)
            cur.execute("TRUNCATE TABLE historical_strategy_data RESTART IDENTITY;")
            for _, row in hist_df.iterrows():
                cur.execute(
                    """
                    INSERT INTO historical_strategy_data (total_fleet_size, target_service_trains, avg_fleet_health, is_monsoon, is_surge, historical_cost_per_km, historical_fatigue_factor, historical_branding_penalty, historical_target_mileage, historical_maint_threshold, success_score)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    tuple(row)
                )
            print(f"Successfully loaded {len(hist_df)} records into 'historical_strategy_data'.")
        except FileNotFoundError:
            print(f"Warning: '{HISTORICAL_DATA_CSV}' not found. 'historical_strategy_data' table will be empty.")

        conn.commit()
        cur.close()
        print("\nDatabase setup and population complete!")

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
    finally:
        if conn is not None:
            conn.close()
            print("Database connection closed.")

if __name__ == '__main__':
    setup_database()

