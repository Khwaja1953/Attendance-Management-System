import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiCheckCircle, FiClock, FiCalendar, FiMapPin, FiCheck, FiX } from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    overall: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    weekly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    monthly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    yearly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 }
  });
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState(null);

  const fetchData = async () => {
    try {
      const [attRes, statsRes] = await Promise.all([
        api.get('/attendance/my?page=1&limit=30'),
        api.get('/attendance/stats'),
      ]);
      
      const records = attRes.data.data?.attendance || [];
      setAttendance(records);
      if (statsRes.data.data) setStats(statsRes.data.data);

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
    fetchData();
  }, []);

  const handleMarkAttendance = async () => {
    setMarking(true);
    try {
      const res = await api.post('/attendance/mark');
      toast.success(res.data.message || 'Attendance marked successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
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

  const batch = user?.batch;
  
  return (
    <Layout>
      <div className="page-header">
        <h1>Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
        <p>Your Attendance & Analytics Dashboard</p>
      </div>

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

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatBox title="Weekly Stats" data={stats.weekly} />
        <StatBox title="Monthly Stats" data={stats.monthly} />
        <StatBox title="Yearly Stats" data={stats.yearly} />
        <StatBox title="Overall Stats" data={stats.overall} />
      </div>

      <div className="card text-center mb-3" style={{ padding: '32px 24px' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '1.1rem', color: '#374151' }}>
          Mark Your Attendance
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.9rem' }}>
          {todayStatus === 'present' ? 'You have successfully marked your attendance for today!' : 'Record your presence for today\'s session.'}
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
              <FiCheckCircle /> Attendance Marked
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
