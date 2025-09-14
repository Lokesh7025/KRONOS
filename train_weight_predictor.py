import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

# --- 1. Configuration ---
HISTORICAL_DATA_FILE = "historical_data_retrain.csv"
MODEL_OUTPUT_FILE = "weight_predictor_model.joblib"

# --- 2. Load and Prepare Data ---
print(f"Loading historical data from '{HISTORICAL_DATA_FILE}'...")
try:
    df = pd.read_csv(HISTORICAL_DATA_FILE)
except FileNotFoundError:
    print(f"Error: The historical data file '{HISTORICAL_DATA_FILE}' was not found.")
    print("Please ensure you have created this file with the correct data.")
    exit()

print("Data loaded successfully.")

# Define the features (inputs) and the target (output) for the model
features = [
    'health_score_start_of_day',
    'km_since_last_service',
    'consecutive_service_days',
    'was_heavy_rain',
    'was_high_demand',
    'brake_model_HydroMech_v1'
]
target = 'true_operational_risk_score'

X = df[features]
y = df[target]

# Split data into a training set (to teach the model) and a testing set ( to evaluate it)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Data split into {len(X_train)} training samples and {len(X_test)} testing samples.")

# --- 3. Train the AI Model ---
print("\nTraining the AI Weight Predictor model (RandomForestRegressor)...")

# We use a RandomForestRegressor because we are predicting a continuous value (the risk score)
# n_estimators=100 is a good starting point, random_state ensures we get the same result each time
model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)

# Teach the model the patterns in the training data
model.fit(X_train, y_train)

print("Model training complete.")

# --- 4. Evaluate Model Performance ---
print("\nEvaluating model performance on unseen test data...")
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)

print(f"Mean Absolute Error (MAE): {mae:.2f}")
print("  (This means, on average, the model's risk score prediction is off by this amount.)")
print("  (A lower MAE is better.)")


# --- 5. Save the Trained Model ---
print(f"\nSaving the trained model to '{MODEL_OUTPUT_FILE}'...")
joblib.dump(model, MODEL_OUTPUT_FILE)
print("Model saved successfully.")
print("\nYou can now run the main 'run_simulation.py' script, which will use this new AI model.")

