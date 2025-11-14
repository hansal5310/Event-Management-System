import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AnalyticsDashboard = ({ eventId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/analytics/event/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Analytics error:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="analytics-error">Failed to load analytics</div>;
  }

  // Prepare chart data
  const timelineData = Object.entries(analytics.timeline).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    registrations: count
  }));

  const ticketTypeData = Object.entries(analytics.ticketTypes).map(([type, count]) => ({
    name: type,
    value: count
  }));

  const COLORS = ['#0a400c', '#819067', '#b1ab86', '#fefae0'];

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Event Analytics</h2>
        <p>{analytics.event.title}</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total RSVPs</h3>
          <p className="metric-value">{analytics.rsvps.total}</p>
          <span className="metric-label">Confirmed: {analytics.rsvps.confirmed}</span>
        </div>

        <div className="metric-card">
          <h3>Check-in Rate</h3>
          <p className="metric-value">{analytics.rsvps.checkInRate}%</p>
          <span className="metric-label">
            {analytics.rsvps.checkedIn} / {analytics.rsvps.total} attended
          </span>
        </div>

        <div className="metric-card">
          <h3>Total Revenue</h3>
          <p className="metric-value">₹{analytics.revenue.total.toFixed(2)}</p>
          <span className="metric-label">
            Avg: ₹{analytics.revenue.averageTicketPrice}
          </span>
        </div>

        <div className="metric-card">
          <h3>Capacity</h3>
          <p className="metric-value">
            {((analytics.rsvps.total / analytics.event.maxTickets) * 100).toFixed(0)}%
          </p>
          <span className="metric-label">
            {analytics.rsvps.total} / {analytics.event.maxTickets} filled
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Registration Timeline */}
        <div className="chart-card">
          <h3>Registration Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="registrations" 
                stroke="#0a400c" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Types Distribution */}
        <div className="chart-card">
          <h3>Ticket Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Options */}
      <div className="export-section">
        <h3>Export Report</h3>
        <div className="export-buttons">
          <button className="export-btn">
            📄 Export as PDF
          </button>
          <button className="export-btn">
            📊 Export as Excel
          </button>
          <button className="export-btn">
            📧 Email Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;