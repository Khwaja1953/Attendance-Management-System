import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiCalendar, FiCheck, FiX, FiFilter } from 'react-icons/fi';

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    overall: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    weekly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    monthly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 },
    yearly: { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const [attRes, statsRes] = await Promise.all([
        api.get(`/attendance/my?${params}`),
        api.get('/attendance/stats'),
      ]);
      
      const data = attRes.data.data;
      setRecords(data?.attendance || []);
      setTotalPages(data?.pagination?.pages || 1);
      if (statsRes.data.data) setStats(statsRes.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const StatBox = ({ title, data }) => (
    <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
      <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{title}</h4>
      <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.presentPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{data.present} P</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.absentPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>{data.absent} A</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.holidayPercentage.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>{data.holiday} H</div>
        </div>
      </div>
    </div>
  );

  const handleFilter = () => {
    setPage(1);
    fetchData();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>My Attendance & Analytics</h1>
        <p>Complete record of your presence and performance</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '32px' }}>
        <StatBox title="Weekly" data={stats.weekly} />
        <StatBox title="Monthly" data={stats.monthly} />
        <StatBox title="Yearly" data={stats.yearly} />
        <StatBox title="Overall" data={stats.overall} />
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
                          {record.status === 'present' ? <FiCheck /> : (record.status === 'absent' ? <FiX /> : <FiCalendar />)}
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
