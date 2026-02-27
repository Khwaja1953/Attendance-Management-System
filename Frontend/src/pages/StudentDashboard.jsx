import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiCheckCircle, FiClock, FiCalendar, FiMapPin, FiCheck, FiX } from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState(null);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance/my?page=1&limit=10');
      const records = res.data.data?.attendance || [];
      setAttendance(records);

      // Check today's status
      const today = new Date().toDateString();
      const todayRecord = records.find(
        (r) => new Date(r.date).toDateString() === today
      );
      setTodayStatus(todayRecord ? todayRecord.status : null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleMarkAttendance = async () => {
    setMarking(true);
    try {
      const res = await api.post('/attendance/mark');
      toast.success(res.data.message || 'Attendance marked successfully!');
      setTodayStatus('present');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  const batch = user?.batch;
  const totalPresent = attendance.filter((a) => a.status === 'present').length;

  return (
    <Layout>
      <div className="page-header">
        <h1>Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
        <p>Here&apos;s your attendance overview</p>
      </div>

      {/* Batch Info */}
      {batch && (
        <div className="batch-info-card">
          <h3>📚 {batch.name}</h3>
          <div className="batch-details">
            <div className="batch-detail">
              <FiClock /> {batch.startTime} - {batch.endTime}
            </div>
            <div className="batch-detail">
              <FiCalendar /> {batch.days?.join(', ')}
            </div>
            <div className="batch-detail">
              <FiMapPin /> {batch.course}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h4>Today&apos;s Status</h4>
            <div className="stat-value">
              {todayStatus === 'present' ? (
                <span className="badge badge-present"><FiCheck /> Present</span>
              ) : todayStatus === 'absent' ? (
                <span className="badge badge-absent"><FiX /> Absent</span>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Not Marked</span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h4>Present Days (Recent)</h4>
            <div className="stat-value">{totalPresent}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <FiClock />
          </div>
          <div className="stat-info">
            <h4>Total Records</h4>
            <div className="stat-value">{attendance.length}</div>
          </div>
        </div>
      </div>

      {/* Mark Attendance */}
      <div className="card text-center mb-3" style={{ padding: '40px 24px' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '1.1rem', color: '#374151' }}>
          Mark Your Attendance
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.9rem' }}>
          Tap the button below to record your attendance for today
        </p>
        <button
          className="mark-attendance-btn"
          onClick={handleMarkAttendance}
          disabled={marking || todayStatus === 'present'}
        >
          {marking ? (
            <span className="spinner" style={{ width: 22, height: 22, borderWidth: 2.5, borderTopColor: '#fff' }}></span>
          ) : todayStatus === 'present' ? (
            <>
              <FiCheckCircle /> Already Marked
            </>
          ) : (
            <>
              <FiCheckCircle /> Mark Attendance
            </>
          )}
        </button>
      </div>

      {/* Recent History */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Attendance</h3>
        </div>
        {loading ? (
          <div className="loading-center">
            <div className="spinner"></div>
          </div>
        ) : attendance.length === 0 ? (
          <div className="empty-state">
            <FiCalendar />
            <h3>No Records Yet</h3>
            <p>Your attendance records will appear here</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, i) => {
                  const date = new Date(record.date);
                  return (
                    <tr key={record._id || i}>
                      <td>{date.toLocaleDateString()}</td>
                      <td>{date.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                      <td>
                        <span className={`badge badge-${record.status}`}>
                          {record.status === 'present' ? <FiCheck /> : <FiX />}
                          {record.status}
                        </span>
                      </td>
                      <td>{record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;
