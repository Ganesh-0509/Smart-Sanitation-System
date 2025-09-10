const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(cors());

const dbClient = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'sanitation_db',
    password: 'password',
    port: 5432,
});

dbClient.connect()
    .then(() => console.log('✅ Connected to PostgreSQL database!'))
    .catch(err => console.error('Connection error to DB', err.stack));

const mqttServer = 'mqtt://test.mosquitto.org';
const mqttTopic = 'simhastha/sanitation/bin-fill';
const mqttClient = mqtt.connect(mqttServer);

mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT broker!');
    mqttClient.subscribe(mqttTopic, (err) => {
        if (!err) {
            console.log(`Subscribed to MQTT topic: ${mqttTopic}`);
        }
    });
});

mqttClient.on('message', async (topic, message) => {
    const data = JSON.parse(message.toString());
    console.log('--- NEW SENSOR ALERT! ---');
    console.log('Received:', data);
    
    // --- Bin Fill Logic ---
    if (data.fill_pct >= 90) {
        try {
            await dbClient.query(`UPDATE assets SET status = 'urgent' WHERE asset_id = $1`, [data.device_id]);
            console.log(`BIN ${data.device_id} is now FULL (90%+) Status updated to 'urgent'.`);
        } catch (err) {
            console.error('Error updating bin status', err.stack);
        }
    } else {
        try {
            // Update to 'clean' only if it's not already marked as 'needs cleaning'
            await dbClient.query(`UPDATE assets SET status = 'clean' WHERE asset_id = $1 AND status != 'needs cleaning'`, [data.device_id]);
        } catch (err) {
            console.error('Error updating bin status', err.stack);
        }
    }

    // --- Save all telemetry data ---
    try {
        const insertQuery = `INSERT INTO sensor_telemetry (device_id, asset_id, fill_pct, timestamp) VALUES ($1, $2, $3, $4)`;
        const values = [data.device_id, data.device_id, data.fill_pct, data.timestamp];
        await dbClient.query(insertQuery, values);
        console.log('✔️ Sensor data saved to database!');
    } catch (err) {
        console.error('Error saving sensor data', err.stack);
    }
});

// --- Time-Based Restroom Check Logic (Corrected) ---
setInterval(async () => {
    try {
        const query = `
            SELECT asset_id FROM assets WHERE asset_type = 'restroom';
        `;
        const allRestrooms = await dbClient.query(query);

        for (const restroom of allRestrooms.rows) {
            const lastCleanedQuery = await dbClient.query(`
                SELECT MAX(timestamp) AS last_cleaned_time FROM qr_logs WHERE asset_id = $1;
            `, [restroom.asset_id]);

            const lastCleanedTime = lastCleanedQuery.rows[0].last_cleaned_time;

            if (lastCleanedTime) {
                const timeDiffMinutes = (new Date() - lastCleanedTime) / (1000 * 60);
                if (timeDiffMinutes > 90) {
                    await dbClient.query(`UPDATE assets SET status = 'needs cleaning' WHERE asset_id = $1`, [restroom.asset_id]);
                    console.log(`Restroom ${restroom.asset_id} status updated to 'needs cleaning'`);
                } else {
                     await dbClient.query(`UPDATE assets SET status = 'clean' WHERE asset_id = $1`, [restroom.asset_id]);
                }
            } else {
                // If a restroom has no QR logs, it needs to be cleaned
                await dbClient.query(`UPDATE assets SET status = 'needs cleaning' WHERE asset_id = $1`, [restroom.asset_id]);
                console.log(`Restroom ${restroom.asset_id} has no logs and needs cleaning.`);
            }
        }
    } catch (err) {
        console.log("Error during status update check:", err.stack);
    }
}, 30000); // Check every 30 seconds for demo purposes

// --- REST API Endpoint (for QR Scan Data & Photo Upload) ---
app.post('/api/v1/qr-log', async (req, res) => {
    const qrData = req.body;
    console.log('--- NEW QR SCAN LOG! ---');
    console.log('Received:', qrData.asset_id, 'with photo upload.');
    
    try {
        const insertQuery = `INSERT INTO qr_logs (asset_id, cleaner_id, timestamp, gps_lat, gps_lng, photo_url) VALUES ($1, $2, $3, $4, $5, $6)`;
        const values = [qrData.asset_id, 'CLEANER-001', qrData.timestamp, qrData.gps.lat, qrData.gps.lng, qrData.photoDataUrl];
        await dbClient.query(insertQuery, values);
        console.log('✔️ QR log and photo saved to database!');

        await dbClient.query(`UPDATE assets SET status = 'clean' WHERE asset_id = $1`, [qrData.asset_id]);

        res.status(200).json({ status: 'success', message: 'QR log and photo received and processed.' });
    } catch (err) {
        console.error('Error saving QR log', err.stack);
        res.status(500).json({ status: 'error', message: 'Failed to save QR log.' });
    }
});

// --- API ENDPOINTS FOR THE DASHBOARD ---
app.get('/api/v1/qr-logs', async (req, res) => {
    try {
        const result = await dbClient.query('SELECT * FROM qr_logs ORDER BY timestamp DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching QR logs', err.stack);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

app.get('/api/v1/sensor-data', async (req, res) => {
    try {
        const result = await dbClient.query('SELECT * FROM sensor_telemetry ORDER BY timestamp DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sensor data', err.stack);
        res.status(500).json({ error: 'Failed to fetch sensor data' });
    }
});

app.get('/api/v1/assets', async (req, res) => {
    try {
        const result = await dbClient.query('SELECT * FROM assets');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching assets', err.stack);
        res.status(500).json({ error: 'Failed to fetch asset data' });
    }
});

app.get('/api/v1/usage-trends', async (req, res) => {
    try {
        const query = `
            WITH all_events AS (
                SELECT asset_id FROM qr_logs
                UNION ALL
                SELECT asset_id FROM sensor_telemetry
            )
            SELECT asset_id, COUNT(asset_id) AS event_count
            FROM all_events
            GROUP BY asset_id
            ORDER BY event_count DESC
            LIMIT 10;
        `;
        const result = await dbClient.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching usage trends', err.stack);
        res.status(500).json({ error: 'Failed to fetch usage trends' });
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});