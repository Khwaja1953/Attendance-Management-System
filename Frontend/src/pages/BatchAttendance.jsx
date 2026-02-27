import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiCalendar, FiFilter, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#22c55e', '#ef4444'];

const BatchAttendance = () => {
  const { batchId } = useParams();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const qs = params.toString() ? `?${params}` : '';

      const [attRes, statsRes] = await Promise.all([
        api.get(`/admin/attendance/batch/${batchId}${qs}`),
        api.get(`/admin/stats/batch/${batchId}${qs}`),
      ]);

      setRecords(attRes.data.data || []);
      setStats(statsRes.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [batchId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Bar chart data from stats
  const barData = stats.map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    present: s.presentCount,
    absent: s.absentCount,
  }));

  // Pie chart data (totals)
  const totalPresent = stats.reduce((sum, s) => sum + (s.presentCount || 0), 0);
  const totalAbsent = stats.reduce((sum, s) => sum + (s.absentCount || 0), 0);
  const pieData = [
    { name: 'Present', value: totalPresent },
    { name: 'Absent', value: totalAbsent },
  ].filter((d) => d.value > 0);

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <Layout>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', marginBottom: '12px', color: '#6b7280' }}>
        <FiArrowLeft /> Back to Dashboard
      </Link>

      <div className="page-header">
        <h1>Batch Attendance</h1>
        <p>View attendance records for this batch</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchData}>
          <FiFilter /> Filter
        </button>
        <button className="btn btn-outline btn-sm" onClick={handleClear}>
          Clear
        </button>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner spinner-lg"></div>
          <p>Loading attendance data...</p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          {stats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: pieData.length > 0 ? '2fr 1fr' : '1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="chart-container" style={{ marginBottom: 0 }}>
                <h3>Daily Attendance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {pieData.length > 0 && (
                <div className="chart-container" style={{ marginBottom: 0 }}>
                  <h3>Overall Ratio</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          {records.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <FiCalendar />
                <h3>No Attendance Records</h3>
                <p>No records found for the selected period</p>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, i) => (
                    <tr key={record._id || i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        {record.student?.name || 'Unknown'}
                      </td>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${record.status}`}>
                          {record.status === 'present' ? <FiCheck /> : <FiX />}
                          {record.status}
                        </span>
                      </td>
                      <td>{record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default BatchAttendance;
