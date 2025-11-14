import { useState } from 'react';
import axios from 'axios';

const PaymentGateway = ({ rsvpId, eventId, amount, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (paymentMethod) => {
    setLoading(true);
    setError('');

    try {
      // Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        setError('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // Create order
      const token = localStorage.getItem('token');
      const orderResponse = await axios.post(
        'http://localhost:5000/api/payments/create-order',
        { rsvpId, eventId, amount, paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, paymentId } = orderResponse.data;

      // Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: 'EventHub',
        description: 'Event Ticket Payment',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              'http://localhost:5000/api/payments/verify',
              {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              onSuccess(paymentId);
            } else {
              setError('Payment verification failed');
            }
          } catch (err) {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#0a400c'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            onCancel();
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      setLoading(false);
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="payment-gateway">
      <div className="payment-header">
        <h3>Complete Payment</h3>
        <p className="payment-amount">₹{amount.toFixed(2)}</p>
      </div>

      {error && (
        <div className="payment-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="payment-methods">
        <h4>Select Payment Method</h4>
        
        <button 
          className="payment-method-btn"
          onClick={() => handlePayment('Card')}
          disabled={loading}
        >
          <span className="method-icon">💳</span>
          <div className="method-info">
            <span className="method-name">Credit/Debit Card</span>
            <span className="method-desc">Visa, Mastercard, Amex</span>
          </div>
        </button>

        <button 
          className="payment-method-btn"
          onClick={() => handlePayment('UPI')}
          disabled={loading}
        >
          <span className="method-icon">📱</span>
          <div className="method-info">
            <span className="method-name">UPI</span>
            <span className="method-desc">Google Pay, PhonePe, Paytm</span>
          </div>
        </button>

        <button 
          className="payment-method-btn"
          onClick={() => handlePayment('Wallet')}
          disabled={loading}
        >
          <span className="method-icon">👛</span>
          <div className="method-info">
            <span className="method-name">Wallet</span>
            <span className="method-desc">Paytm, Amazon Pay</span>
          </div>
        </button>

        <button 
          className="payment-method-btn"
          onClick={() => handlePayment('NetBanking')}
          disabled={loading}
        >
          <span className="method-icon">🏦</span>
          <div className="method-info">
            <span className="method-name">Net Banking</span>
            <span className="method-desc">All major banks</span>
          </div>
        </button>
      </div>

      <div className="payment-footer">
        <p className="secure-payment">
          <span className="lock-icon">🔒</span>
          Secure payment powered by Razorpay
        </p>
        <button className="cancel-payment-btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PaymentGateway;