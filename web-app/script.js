const backendUrl = 'http://localhost:3000/api/v1/qr-log';

function onScanSuccess(decodedText) {
    document.getElementById('qr-value').innerText = decodedText;
    document.getElementById('qr-result').classList.remove('hidden');
    // Stop scanning once a QR code is detected
    html5QrcodeScanner.pause(true); 
}

function onScanFailure(error) {
    // console.warn(`QR Scan Error: ${error}`);
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", 
    { fps: 10, qrbox: { width: 250, height: 250 } }, 
    false
);

html5QrcodeScanner.render(onScanSuccess, onScanFailure);

async function sendData() {
    const qrValue = document.getElementById('qr-value').innerText;
    const payload = {
        asset_id: qrValue,
        cleaner_id: 'CLEANER-001',
        timestamp: new Date().toISOString(),
        gps: { lat: 21.1458, lng: 79.0882 } // Mock GPS data
    };

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        document.getElementById('message').innerText = 'Log submitted successfully!';
        console.log('Success:', data);
    } catch (error) {
        document.getElementById('message').innerText = 'Error submitting log.';
        console.error('Error:', error);
    }
}