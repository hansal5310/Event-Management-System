import { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

const CheckInScanner = ({ eventId }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    setError('');

    const scanner = new Html5QrcodeScanner('qr-reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(onScanSuccess, onScanError);

    function onScanSuccess(decodedText) {
      scanner.clear();
      verifyTicket(decodedText);
    }

    function onScanError(err) {
      console.warn(err);
    }
  };

  const verifyTicket = async (qrData) => {
    try {
      const data = JSON.parse(qrData);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:5000/api/checkin/verify',
        {
          ticketId: data.ticketId,
          eventId: eventId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult({
        success: true,
        attendee: response.data.attendee,
        message: response.data.message
      });
      setScanning(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid ticket');
      setResult({ success: false });
      setScanning(false);
    }
  };

  return (
    <div className="checkin-scanner">
      <div className="scanner-header">
        <h2>Event Check-In</h2>
        <p>Scan attendee QR codes to check them in</p>
      </div>

      {!scanning && !result && (
        <button onClick={startScanner} className="start-scan-btn">
          <span className="btn-icon">📷</span>
          Start Scanning
        </button>
      )}

      {scanning && (
        <div className="scanner-container">
          <div id="qr-reader"></div>
          <button 
            onClick={() => setScanning(false)} 
            className="stop-scan-btn"
          >
            Stop Scanning
          </button>
        </div>
      )}

      {result && (
        <div className={`scan-result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              <div className="success-icon">✅</div>
              <h3>Check-in Successful!</h3>
              <div className="attendee-info">
                <p><strong>Name:</strong> {result.attendee.name}</p>
                <p><strong>Email:</strong> {result.attendee.email}</p>
                <p><strong>Ticket Type:</strong> {result.attendee.ticketType}</p>
              </div>
              <button 
                onClick={() => {
                  setResult(null);
                  startScanner();
                }}
                className="scan-next-btn"
              >
                Scan Next
              </button>
            </>
          ) : (
            <>
              <div className="error-icon">❌</div>
              <h3>Check-in Failed</h3>
              <p className="error-message">{error}</p>
              <button 
                onClick={() => {
                  setResult(null);
                  setError('');
                  startScanner();
                }}
                className="try-again-btn"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckInScanner;