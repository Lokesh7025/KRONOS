import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
from datetime import datetime, timedelta

# --- Configuration ---
load_dotenv()
LOG_FILE = "monthly_simulation_log.csv"
API_KEY = os.getenv("GEMINI_API_KEY")

# --- We need the simulation parameters to calculate pace ---
SIMULATION_START_DATE = datetime(2025, 9, 1)
SIMULATION_MONTH_DAYS = 30
DAILY_HOURS_PER_TRAIN = 16

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found. Please create a .env file with your key.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

app = Flask(__name__)
CORS(app)  # Allow requests from your React frontend

# --- Helper Function to get context ---
def get_context_for_query(log_df, day, train_ids):
    """
    Finds the relevant rows in the log file to provide as context.
    """
    context_df = log_df[(log_df['simulation_day'] == day) & (log_df['train_id'].isin(train_ids))]
    if context_df.empty:
        return "No data found for the specified trains on that day.", ""
    
    # Create a simple summary string for each train
    context_summary = ""
    for _, row in context_df.iterrows():
        if row['branding_sla_active']:
            context_summary += f"\n- {row['train_id']} has an active SLA. Target: {row['target_hours']} hours, Current: {row['current_hours']} hours."
        else:
            context_summary += f"\n- {row['train_id']} does not have an active SLA."

    return context_df.to_string(index=False), context_summary

# --- The Main API Endpoint ---
@app.route('/ask', methods=['POST'])
def ask_rake_assist():
    data = request.json
    user_question = data.get('question')
    simulation_day = data.get('day', 15) 

    if not user_question:
        return jsonify({"error": "No question provided."}), 400

    try:
        log_df = pd.read_csv(LOG_FILE)
    except FileNotFoundError:
        return jsonify({"error": f"Log file '{LOG_FILE}' not found."}), 500

    mentioned_train_ids = [word for word in user_question.replace(",", " ").split() if 'Rake-' in word]
    if not mentioned_train_ids:
        # If no specific train is mentioned, we can't get context yet.
        # A more advanced version could handle general questions.
        return jsonify({"answer": "Please mention a specific train ID (e.g., Rake-03) in your question."})

    
    context_data, context_summary = get_context_for_query(log_df, simulation_day, mentioned_train_ids)
    days_remaining = SIMULATION_MONTH_DAYS - simulation_day + 1

    # --- This is the new, much smarter prompt ---
    prompt = f"""
    You are RakeAssist, an expert AI co-pilot for the Kochi Metro operations supervisor. Your role is to answer questions concisely, accurately, and helpfully, using ONLY the data provided below as your context. Do not make up information.

    **Current Simulation Parameters:**
    - Today is Day {simulation_day} of a {SIMULATION_MONTH_DAYS}-day month.
    - There are {days_remaining} days remaining in the month.
    - A train in service runs for approximately {DAILY_HOURS_PER_TRAIN} hours per day.

    **Context Data for Day {simulation_day}:**
    ---
    {context_data}
    ---
    
    **Summary:**
    {context_summary}

    **Analysis Task:**
    Based on the supervisor's question, analyze the provided data. 
    To determine if a train is "on pace" for its branding SLA, calculate the required hours it needs to run on every remaining day.
    Required Run Rate = (target_hours - current_hours) / days_remaining.
    If the Required Run Rate is greater than {DAILY_HOURS_PER_TRAIN}, the train is behind schedule.
    If the user asks about a train with no SLA, state that clearly and politely.

    **Supervisor's Question:** "{user_question}"

    **Your Answer:**
    """

    try:
        print("--- Sending Prompt to Gemini ---")
        # print(prompt) # Uncomment for debugging
        print("---------------------------------")
        
        response = model.generate_content(prompt)
        ai_answer = response.text
        
        print(f"Gemini Response: {ai_answer}")
        
        return jsonify({"answer": ai_answer})
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": "An error occurred while contacting the AI model."}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)

