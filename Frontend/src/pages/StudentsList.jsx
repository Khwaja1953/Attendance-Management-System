import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { FiUsers, FiSearch, FiEye } from 'react-icons/fi';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/admin/students');
        setStudents(res.data.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.course?.toLowerCase().includes(q) ||
      (s.batch?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <div className="page-header">
        <h1>Students</h1>
        <p>View all registered students</p>
      </div>

      {/* Search */}
      <div className="search-box">
        <FiSearch />
        <input
          type="text"
          placeholder="Search by name, email, phone, course or batch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner spinner-lg"></div>
          <p>Loading students...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FiUsers />
            <h3>{search ? 'No Matching Students' : 'No Students Yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Students will appear here after they sign up'}</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, i) => (
                <tr
                  key={student._id}
                  className="clickable-row"
                  onClick={() => navigate(`/admin/attendance/student/${student._id}`)}
                >
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.phone}</td>
                  <td>{student.course}</td>
                  <td>
                    {student.batch?.name ? (
                      <span className="badge badge-active">{student.batch.name}</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/attendance/student/${student._id}`);
                      }}
                    >
                      <FiEye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '16px', fontSize: '0.82rem', color: '#9ca3af' }}>
        Showing {filtered.length} of {students.length} students
      </p>
    </Layout>
  );
};

export default StudentsList;
