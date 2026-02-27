import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiCalendar, FiCheck, FiX, FiFilter } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/attendance/my?${params}`);
      const data = res.data.data;
      setRecords(data?.attendance || []);
      setTotalPages(data?.pagination?.pages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Build monthly chart data
  const monthlyData = {};
  records.forEach((r) => {
    const d = new Date(r.date);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!monthlyData[key]) monthlyData[key] = { month: key, present: 0, absent: 0 };
    if (r.status === 'present') monthlyData[key].present++;
    else monthlyData[key].absent++;
  });
  const chartData = Object.values(monthlyData);

  const handleFilter = () => {
    setPage(1);
    fetchAttendance();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>My Attendance</h1>
        <p>View your complete attendance history</p>
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
        <button className="btn btn-primary btn-sm" onClick={handleFilter}>
          <FiFilter /> Filter
        </button>
        <button className="btn btn-outline btn-sm" onClick={handleClear}>
          Clear
        </button>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="chart-container">
          <h3>Monthly Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner spinner-lg"></div>
          <p>Loading records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FiCalendar />
            <h3>No Attendance Records</h3>
            <p>No records found for the selected period</p>
          </div>
        </div>
      ) : (
        <>
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
                      <td>{(page - 1) * 30 + i + 1}</td>
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

          {/* Pagination */}
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </Layout>
  );
};

export default StudentAttendance;
