import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginRegister from './components/LoginRegister';
import AdminDashboard from './components/AdminDashboard';
import CreateEditEvent from './components/CreateEditEvent';
import UserEventList from './components/UserEventList';
import RSVPPage from './components/RSVPPage';
import QRCodeTicket from './components/QRCodeTicket';
import UserDashboard from './components/UserDashboard';
import './index.css';

// Add this constant at the top of your App.js
const API_BASE_URL = 'http://192.168.164.1:5000'; // Use your backend server IP

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Define ProtectedRoute component inside App.js
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (loading) return <div>Loading...</div>;
    
    if (!user) return <Navigate to="/" replace />;
    
    if (adminOnly && user.role !== 'Admin') {
      return <Navigate to="/user-events" replace />;
    }
    
    return children;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                user.role === 'Admin' ? 
                <Navigate to="/admin-dashboard" replace /> : 
                <Navigate to="/user-events" replace />
              ) : (
                <LoginRegister setUser={handleLogin} />
              )
            } 
          />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-event" 
            element={
              <ProtectedRoute adminOnly>
                <CreateEditEvent user={user} apiBaseUrl={API_BASE_URL} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/edit-event/:id" 
            element={
              <ProtectedRoute adminOnly>
                <CreateEditEvent user={user} apiBaseUrl={API_BASE_URL} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/user-events" 
            element={
              <ProtectedRoute>
                <UserEventList user={user} onLogout={handleLogout} apiBaseUrl={API_BASE_URL} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/rsvp/:eventId" 
            element={
              <ProtectedRoute>
                <RSVPPage user={user} apiBaseUrl={API_BASE_URL} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ticket/:rsvpId" 
            element={
              <ProtectedRoute>
                <QRCodeTicket user={user} apiBaseUrl={API_BASE_URL} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/user-dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard user={user} onLogout={handleLogout} apiBaseUrl={API_BASE_URL} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;