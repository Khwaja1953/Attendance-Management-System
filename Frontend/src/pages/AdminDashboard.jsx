import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiUsers, FiCalendar, FiSettings, FiLayers } from 'react-icons/fi';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studRes, batchRes] = await Promise.all([
          api.get('/admin/students'),
          api.get('/batch'),
        ]);
        setStudents(studRes.data.data || []);
        setBatches(batchRes.data.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="loading-center">
          <div className="spinner spinner-lg"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  const activeBatches = batches.filter((b) => b.isActive);

  return (
    <Layout>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your attendance management system</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FiUsers />
          </div>
          <div className="stat-info">
            <h4>Total Students</h4>
            <div className="stat-value">{students.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <FiLayers />
          </div>
          <div className="stat-info">
            <h4>Total Batches</h4>
            <div className="stat-value">{batches.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h4>Active Batches</h4>
            <div className="stat-value">{activeBatches.length}</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#374151' }}>
        Quick Actions
      </h2>
      <div className="cards-grid">
        <Link to="/admin/batches" className="quick-link-card">
          <div className="ql-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <FiLayers />
          </div>
          <div>
            <h3>Manage Batches</h3>
            <p>Create, edit and manage student batches</p>
          </div>
        </Link>

        <Link to="/admin/students" className="quick-link-card">
          <div className="ql-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}>
            <FiUsers />
          </div>
          <div>
            <h3>View Students</h3>
            <p>Browse students and their attendance</p>
          </div>
        </Link>

        <Link to="/admin/settings" className="quick-link-card">
          <div className="ql-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <FiSettings />
          </div>
          <div>
            <h3>Settings</h3>
            <p>Configure IP addresses and institute info</p>
          </div>
        </Link>
      </div>

      {/* Recent Batches */}
      {batches.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#374151' }}>
            Batches Overview
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Batch Name</th>
                  <th>Course</th>
                  <th>Timing</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td>{b.course}</td>
                    <td>{b.startTime} - {b.endTime}</td>
                    <td>
                      <div className="days-list">
                        {b.days?.map((d) => (
                          <span key={d} className="day-pill">{d.slice(0, 3)}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${b.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/attendance/batch/${b._id}`} className="btn btn-sm btn-outline">
                        View Attendance
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
