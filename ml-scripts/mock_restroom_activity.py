import requests
import time
import random
import json
import pandas as pd

# List of your 50 restroom IDs from your database
restroom_ids = [
    'RST-1', 'RST-2', 'RST-3', 'RST-4', 'RST-5', 'RST-6', 'RST-7', 'RST-8', 'RST-9', 'RST-10',
    'RST-11', 'RST-12', 'RST-13', 'RST-14', 'RST-15', 'RST-16', 'RST-17', 'RST-18', 'RST-19', 'RST-20',
    'RST-21', 'RST-22', 'RST-23', 'RST-24', 'RST-25', 'RST-26', 'RST-27', 'RST-28', 'RST-29', 'RST-30',
    'RST-31', 'RST-32', 'RST-33', 'RST-34', 'RST-35', 'RST-36', 'RST-37', 'RST-38', 'RST-39', 'RST-40',
    'RST-41', 'RST-42', 'RST-43', 'RST-44', 'RST-45', 'RST-46', 'RST-47', 'RST-48', 'RST-49', 'RST-50'
]

# Simulate a QR scan for a random restroom every 20 seconds
while True:
    random_restroom = random.choice(restroom_ids)
    payload = {
        'asset_id': random_restroom,
        'cleaner_id': f'CLEANER-{random.randint(1, 10)}',
        'timestamp': pd.Timestamp.now().isoformat(),
        'gps': {'lat': 23.18, 'lng': 75.77},
        'photoDataUrl': 'data:image/jpeg;base64,mock_photo_data'
    }

    try:
        response = requests.post('http://localhost:3000/api/v1/qr-log', json=payload)
        print(f"Sent QR log for {random_restroom}: Status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending QR log: {e}")

    time.sleep(20) # Simulate a scan every 20 seconds