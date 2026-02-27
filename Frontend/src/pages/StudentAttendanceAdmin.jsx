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
        api.get(`/admin/attendance/student/${studentId}${qs}`),
        api.get(`/admin/stats/student/${studentId}${qs}`),
      ]);

      const attData = attRes.data.data || [];
      setRecords(attData);
      setStats(statsRes.data.data || []);

      // Get student info from first record or fetch students list
      if (attData.length > 0 && attData[0].student) {
        setStudent(attData[0].student);
      } else if (!student) {
        try {
          const studentsRes = await api.get('/admin/students');
          const students = studentsRes.data.data || [];
          const found = students.find((s) => s._id === studentId);
          if (found) setStudent(found);
        } catch {
          // silent
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [studentId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Line chart data
  const chartData = stats.map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: s.status === 'present' ? 1 : 0,
  }));

  // Summary stats
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === 'present').length;
  const absentDays = totalDays - presentDays;
  const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

  const initials = student?.name
    ? student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <Layout>
      <Link to="/admin/students" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', marginBottom: '12px', color: '#6b7280' }}>
        <FiArrowLeft /> Back to Students
      </Link>

      <div className="page-header">
        <h1>Student Attendance</h1>
        <p>Detailed attendance view for this student</p>
      </div>

      {/* Student Info */}
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

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon info">
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h4>Total Days</h4>
            <div className="stat-value">{totalDays}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h4>Present</h4>
            <div className="stat-value">{presentDays}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">
            <FiXCircle />
          </div>
          <div className="stat-info">
            <h4>Absent</h4>
            <div className="stat-value">{absentDays}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h4>Percentage</h4>
            <div className="stat-value">{percentage}%</div>
          </div>
        </div>
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
          {/* Line Chart */}
          {chartData.length > 0 && (
            <div className="chart-container">
              <h3>Attendance Pattern</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tickFormatter={(v) => (v === 1 ? 'Present' : 'Absent')}
                  />
                  <Tooltip
                    formatter={(value) => [value === 1 ? 'Present' : 'Absent', 'Status']}
                  />
                  <Legend />
                  <Line
                    type="stepAfter"
                    dataKey="status"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ fill: '#4f46e5', r: 4 }}
                    name="Attendance"
                  />
                </LineChart>
              </ResponsiveContainer>
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
                    <th>Date</th>
                    <th>Day</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, i) => {
                    const date = new Date(record.date);
                    return (
                      <tr key={record._id || i}>
                        <td>{i + 1}</td>
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
        </>
      )}
    </Layout>
  );
};

export default StudentAttendanceAdmin;
