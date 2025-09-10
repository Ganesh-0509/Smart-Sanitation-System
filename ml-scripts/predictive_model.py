import psycopg2
import pandas as pd
from sklearn.linear_model import LinearRegression
import json
import os

# --- Database Connection Details ---
DB_NAME = "sanitation_db"
DB_USER = "admin"
DB_PASS = "password"
DB_HOST = "localhost"
DB_PORT = "5432"

try:
    # Connect to the database
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    cursor = conn.cursor()

    # --- 1. Fetch Historical Data ---
    print("Fetching historical sensor data...")
    query = "SELECT fill_pct, timestamp FROM sensor_telemetry ORDER BY timestamp ASC"
    cursor.execute(query)
    data = cursor.fetchall()

    if len(data) < 2:
        print("Not enough data to make a prediction.")
    else:
        # --- 2. Prepare Data for the Model ---
        df = pd.DataFrame(data, columns=['fill_pct', 'timestamp'])
        df['fill_pct_prev'] = df['fill_pct'].shift(1)
        df.dropna(inplace=True)

        X = df[['fill_pct_prev']]
        y = df['fill_pct']

        # --- 3. Train the Model ---
        print("Training the predictive model...")
        model = LinearRegression()
        model.fit(X, y)

        # --- 4. Make a Prediction ---
        last_fill_pct = df['fill_pct'].iloc[-1]
        next_prediction = model.predict([[last_fill_pct]])[0]
        
        print("\n--- Prediction ---")
        print(f"The predicted next bin fill percentage is: {next_prediction:.2f}%")

        # --- 5. Save the Prediction to a JSON File ---
        output_file_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'prediction_data.json')
        prediction_data = {
            "predicted_fill_pct": f"{next_prediction:.2f}",
            # CONVERT THE PANDAS INT64 TO A STANDARD PYTHON INT
            "last_recorded_pct": int(last_fill_pct), 
            "timestamp": pd.Timestamp.now().isoformat()
        }
        with open(output_file_path, 'w') as f:
            json.dump(prediction_data, f, indent=4)
        print("Prediction saved to 'backend/prediction_data.json'")

except psycopg2.Error as e:
    print(f"Database connection error: {e}")
finally:
    if 'conn' in locals() and conn:
        cursor.close()
        conn.close()