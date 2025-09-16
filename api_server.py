import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
from datetime import datetime, timedelta
import re # Import the regular expression module

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

# --- Helper Functions ---

def extract_day_from_question(question, default_day=15):
    """
    Parses a question to find a specific day number.
    e.g., "what happened on day 13" -> 13
    """
    match = re.search(r'day\s+(\d+)', question, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return default_day

def get_context_for_query(log_df, day, train_ids):
    """
    Finds the relevant rows and creates a rich summary for the AI.
    """
    context_df = log_df[(log_df['simulation_day'] == day) & (log_df['train_id'].isin(train_ids))]
    if context_df.empty:
        return "No data found for the specified trains on that day.", ""
    
    # Create a detailed summary string for each train to help the AI understand "why"
    context_summary = ""
    for _, row in context_df.iterrows():
        status = row.get('status', 'N/A')
        health = row.get('health_score', 'N/A')
        fatigue = row.get('consecutive_service_days', 0)
        
        context_summary += f"\n- On Day {day}, {row['train_id']} was assigned to: **{status}**."
        context_summary += f"  - Its health score was {health:.1f}."
        if status == 'SERVICE':
             context_summary += f" It had been in service for {fatigue} consecutive day(s)."
        if status == 'MAINTENANCE':
            context_summary += " It was likely sent for maintenance because its health was low or it was manually flagged."
        if status == 'STANDBY':
            context_summary += " It was likely on standby because it was not needed for service or was less optimal than other trains."

    return context_df.to_string(index=False), context_summary

# --- The Main API Endpoint ---
@app.route('/ask', methods=['POST'])
def ask_rake_assist():
    data = request.json
    user_question = data.get('question')

    if not user_question:
        return jsonify({"error": "No question provided."}), 400

    try:
        log_df = pd.read_csv(LOG_FILE)
    except FileNotFoundError:
        return jsonify({"error": f"Log file '{LOG_FILE}' not found."}), 500

    # NEW: Extract the day from the question
    simulation_day = extract_day_from_question(user_question)
    
    mentioned_train_ids = [word for word in user_question.replace(",", " ").split() if 'Rake-' in word]
    if not mentioned_train_ids:
        return jsonify({"answer": "Please mention a specific train ID (e.g., Rake-03) in your question."})

    context_data, context_summary = get_context_for_query(log_df, simulation_day, mentioned_train_ids)
    days_remaining = SIMULATION_MONTH_DAYS - simulation_day + 1

    # --- This is the new, much smarter prompt ---
    prompt = f"""
    You are RakeAssist, an expert AI co-pilot for the Kochi Metro operations supervisor. Your role is to answer questions concisely, accurately, and helpfully, using ONLY the data provided below as your context. Your primary task is to explain the "why" behind a decision.

    **Current Simulation Parameters:**
    - Today is Day {simulation_day} of a {SIMULATION_MONTH_DAYS}-day month.
    - A train in service runs for approximately {DAILY_HOURS_PER_TRAIN} hours per day.

    **Context Data for Day {simulation_day}:**
    ---
    {context_data}
    ---
    
    **Summary of Assignments:**
    {context_summary}

    **Analysis Task:**
    Based on the supervisor's question, analyze the provided data to explain WHY a train had a specific assignment.
    - If a train is in MAINTENANCE, it's because its health score was very low or it was manually flagged.
    - If a train is on STANDBY, it means it was a less optimal choice for service that day compared to other trains, likely due to higher fatigue, lower health, or other risk factors.
    - If a train is in SERVICE, it was one of the most cost-effective and healthy options available.
    Use the summary to state the assignment, then use the detailed context data to find the reason.

    **Supervisor's Question:** "{user_question}"

    **Your Answer:**
    """

    try:
        response = model.generate_content(prompt)
        ai_answer = response.text
        return jsonify({"answer": ai_answer})
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": "An error occurred while contacting the AI model."}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)

