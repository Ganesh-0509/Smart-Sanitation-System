const mqtt = require('mqtt');
const mqttServer = 'mqtt://test.mosquitto.org';
const mqttTopic = 'simhastha/sanitation/bin-fill';

const client = mqtt.connect(mqttServer);
let messageCount = 0;

// List of your 50 bin IDs
const binIds = [
    'BIN-1', 'BIN-2', 'BIN-3', 'BIN-4', 'BIN-5', 'BIN-6', 'BIN-7', 'BIN-8', 'BIN-9', 'BIN-10',
    'BIN-11', 'BIN-12', 'BIN-13', 'BIN-14', 'BIN-15', 'BIN-16', 'BIN-17', 'BIN-18', 'BIN-19', 'BIN-20',
    'BIN-21', 'BIN-22', 'BIN-23', 'BIN-24', 'BIN-25', 'BIN-26', 'BIN-27', 'BIN-28', 'BIN-29', 'BIN-30',
    'BIN-31', 'BIN-32', 'BIN-33', 'BIN-34', 'BIN-35', 'BIN-36', 'BIN-37', 'BIN-38', 'BIN-39', 'BIN-40',
    'BIN-41', 'BIN-42', 'BIN-43', 'BIN-44', 'BIN-45', 'BIN-46', 'BIN-47', 'BIN-48', 'BIN-49', 'BIN-50'
];

client.on('connect', () => {
    console.log('✅ Mock sensor connected to MQTT broker!');

    setInterval(() => {
        let fillPercentage;
        messageCount++;

        if (messageCount % 10 === 0) {
            fillPercentage = 90;
            console.log("--- Sending a 90% fill to test the rule! ---");
        } else {
            fillPercentage = Math.floor(Math.random() * 51) + 50;
        }

        const randomBinId = binIds[Math.floor(Math.random() * binIds.length)];

        const payload = {
            device_id: randomBinId,
            fill_pct: fillPercentage,
            timestamp: new Date().toISOString()
        };

        client.publish(mqttTopic, JSON.stringify(payload));
        console.log(`Published mock data: ${JSON.stringify(payload)}`);
    }, 5000);
});

client.on('error', (err) => {
    console.error("MQTT client error:", err);
});