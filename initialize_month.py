import pandas as pd

def initialize_fleet_status(base_file="fleet_data.csv", output_file="fleet_status.csv"):
    """
    Creates the starting CSV file for a new month from the master data.
    Resets all monthly tracking columns to their initial state.
    """
    try:
        base_df = pd.read_csv(base_file)
    except FileNotFoundError:
        print(f"Error: Base data file '{base_file}' not found. Please ensure it exists.")
        return

    # Add/reset columns for the start of the month
    base_df['health_score'] = 100
    base_df['current_km'] = 0
    base_df['current_hours'] = 0.0 # Use float for hours
    base_df['job_card_status'] = 'CLOSED'
    base_df['job_card_priority'] = 'NONE'
    base_df['bogie_last_service_km'] = 0
    base_df['consecutive_service_days'] = 0
    
    # Add summary statistic columns
    base_df['total_service_days_month'] = 0
    base_df['total_maintenance_days_month'] = 0
    
    # Fill NaN values in branding columns to prevent errors
    base_df[['target_hours', 'current_hours']] = base_df[['target_hours', 'current_hours']].fillna(0)

    final_df = base_df.copy()
    final_df.to_csv(output_file, index=False)
    print(f"Fleet status initialized with monthly stats tracking in '{output_file}'")

if __name__ == "__main__":
    initialize_fleet_status()

