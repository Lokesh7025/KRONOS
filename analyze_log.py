import pandas as pd

LOG_FILE = "monthly_simulation_log.csv"

def show_final_status(df):
    """Displays the final status of the fleet on the last day."""
    print("\n--- FINAL FLEET STATUS (End of Day 30) ---")
    final_day = df['simulation_day'].max()
    final_df = df[df['simulation_day'] == final_day].copy()
    
    # Clean up for display
    final_df['health_score'] = final_df['health_score'].round(1)
    
    cols_to_show = [
        'train_id', 'status', 'health_score', 'current_km', 'current_hours', 
        'total_service_days_month', 'total_maintenance_days_month'
    ]
    print(final_df[cols_to_show].to_string(index=False))

def track_train_progress(df, train_id):
    """Filters the log to show the journey of a single train."""
    train_df = df[df['train_id'] == train_id].copy()
    
    if train_df.empty:
        print(f"\nError: Train ID '{train_id}' not found in the log.")
        return
        
    print(f"\n--- Monthly Journey for {train_id} ---")
    
    # Clean up for display
    train_df['health_score'] = train_df['health_score'].round(1)
    
    cols_to_show = [
        'simulation_day', 'status', 'health_score', 'current_km', 
        'consecutive_service_days'
    ]
    print(train_df[cols_to_show].to_string(index=False))

if __name__ == "__main__":
    try:
        log_df = pd.read_csv(LOG_FILE)
    except FileNotFoundError:
        print(f"Error: Log file '{LOG_FILE}' not found.")
        print("Please run the main simulation (run_simulation.py) first to generate the log.")
        exit()
        
    show_final_status(log_df)
    
    # Interactive part to track a specific train
    while True:
        print("\n" + "-"*50)
        train_input = input("Enter a Train ID to track its monthly journey (e.g., Rake-05), or type 'exit' to quit: ")
        if train_input.lower() == 'exit':
            break
        track_train_progress(log_df, train_input.strip())
