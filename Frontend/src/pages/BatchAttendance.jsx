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
  const [stats, setStats] = useState({
    overall: { totalRecords: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    weekly: { totalRecords: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    monthly: { totalRecords: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    yearly: { totalRecords: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [updating, setUpdating] = useState(null);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkStatus, setBulkStatus] = useState('present');

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
      setStats(statsRes.data.data || stats);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [batchId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (studentId, date, newStatus, recordId) => {
    setUpdating(recordId || `${studentId}-${date}`);
    try {
      await api.post('/admin/attendance/student', {
        studentId,
        batchId,
        date,
        status: newStatus
      });
      fetchData();
    } catch (err) {
      alert('Failed to update attendance');
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkUpdate = async () => {
    if (!window.confirm(`Update all students to ${bulkStatus} for ${bulkDate}?`)) return;
    setLoading(true);
    try {
      await api.post('/admin/attendance/batch', {
        batchId,
        date: bulkDate,
        status: bulkStatus
      });
      fetchData();
    } catch (err) {
      alert('Failed to update batch attendance');
    } finally {
      setLoading(false);
    }
  };

  const StatBox = ({ title, data }) => (
    <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
      <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{title}</h4>
      <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.presentPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{data.present} Present</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.absentPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>{data.absent} Absent</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.holidayPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>{data.holiday} Holiday</div>
        </div>
      </div>
    </div>
  );

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
        <h1>Batch Attendance & Analytics</h1>
        <p>Comprehensive batch-wide reporting and management</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '32px' }}>
        <StatBox title="Weekly Average" data={stats.weekly} />
        <StatBox title="Monthly Average" data={stats.monthly} />
        <StatBox title="Yearly Average" data={stats.yearly} />
        <StatBox title="Overall Average" data={stats.overall} />
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>Bulk Update Attendance</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="filter-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
          </div>
          <div className="filter-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleBulkUpdate}>Update Whole Batch</button>
        </div>
      </div>

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
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Date</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => {
                const isUpdating = updating === (record._id || `${record.student?._id}-${record.date}`);
                return (
                  <tr key={record._id || i} style={{ opacity: isUpdating ? 0.5 : 1 }}>
                    <td style={{ fontWeight: 600 }}>{record.student?.name || 'Unknown'}</td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${record.status}`}>
                        {record.status === 'present' ? <FiCheck /> : (record.status === 'absent' ? <FiX /> : <FiCalendar />)}
                        {record.status}
                      </span>
                    </td>
                    <td>{record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : '—'}</td>
                    <td>
                      <select 
                        className="btn-sm" 
                        value={record.status} 
                        onChange={(e) => handleStatusChange(record.student?._id, record.date, e.target.value, record._id)}
                        disabled={isUpdating}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="holiday">Holiday</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default BatchAttendance;
