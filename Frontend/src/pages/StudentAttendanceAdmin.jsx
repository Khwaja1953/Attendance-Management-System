import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiCalendar, FiFilter, FiCheck, FiX, FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const StudentAttendanceAdmin = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    overall: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    weekly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    monthly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    yearly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // First get student to get batchId
      let currentStudent = student;
      if (!currentStudent) {
        const studentsRes = await api.get('/admin/students');
        const students = studentsRes.data.data || [];
        currentStudent = students.find((s) => s._id === studentId);
        if (currentStudent) setStudent(currentStudent);
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (currentStudent?.batch?._id) params.append('batchId', currentStudent.batch._id);
      const qs = params.toString() ? `?${params}` : '';

      const [attRes, statsRes] = await Promise.all([
        api.get(`/admin/attendance/student/${studentId}${qs}`),
        api.get(`/admin/stats/student/${studentId}${qs}`),
      ]);

      setRecords(attRes.data.data || []);
      setStats(statsRes.data.data || stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId, startDate, endDate, student]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (recordId, date, newStatus) => {
    if (!student?.batch?._id) return;
    setUpdating(recordId || date);
    try {
      await api.post('/admin/attendance/student', {
        studentId,
        batchId: student.batch._id,
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

  const initials = student?.name
    ? student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
  };

  const StatBox = ({ title, data }) => (
    <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
      <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{title}</h4>
      <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{data.presentPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{data.present} Present</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{data.absentPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>{data.absent} Absent</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{data.holidayPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>{data.holiday} Holiday</div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <Link to="/admin/students" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', marginBottom: '12px', color: '#6b7280' }}>
        <FiArrowLeft /> Back to Students
      </Link>

      <div className="page-header">
        <h1>Student Attendance & Analytics</h1>
        <p>Comprehensive attendance tracking and reporting</p>
      </div>

      {student && (
        <div className="student-info-header">
          <div className="student-avatar">{initials}</div>
          <div className="student-details">
            <h2>{student.name}</h2>
            <div className="student-meta">
              <span>📧 {student.email}</span>
              <span>📱 {student.phone}</span>
              <span>📚 {student.course}</span>
              {student.batch?.name && <span>🏷️ {student.batch.name}</span>}
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
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => {
                const date = new Date(record.date);
                const isUpdating = updating === (record._id || record.date);
                return (
                  <tr key={record._id || i} style={{ opacity: isUpdating ? 0.5 : 1 }}>
                    <td>{date.toLocaleDateString()}</td>
                    <td>{date.toLocaleDateString('en-US', { weekday: 'long' })}</td>
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
                        onChange={(e) => handleStatusChange(record._id, record.date, e.target.value)}
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

export default StudentAttendanceAdmin;
