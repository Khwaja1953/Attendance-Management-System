import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiCalendar, FiLayers } from 'react-icons/fi';

const DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyForm = {
  name: '',
  course: '',
  startTime: '',
  endTime: '',
  days: [],
  isActive: true,
};

const ManageBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batch');
      setBatches(res.data.data || []);
    } catch {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (batch) => {
    setForm({
      name: batch.name || '',
      course: batch.course || '',
      startTime: batch.startTime || '',
      endTime: batch.endTime || '',
      days: batch.days || [],
      isActive: batch.isActive ?? true,
    });
    setEditingId(batch._id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'isActive') {
      setForm({ ...form, isActive: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.course || !form.startTime || !form.endTime || form.days.length === 0) {
      toast.error('Please fill in all fields and select at least one day');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/batch/${editingId}`, form);
        toast.success('Batch updated successfully');
      } else {
        await api.post('/batch', form);
        toast.success('Batch created successfully');
      }
      setShowModal(false);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/batch/${deleteId}`);
      toast.success('Batch deleted successfully');
      setDeleteId(null);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Manage Batches</h1>
          <p>Create and manage student batches</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> New Batch
        </button>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner spinner-lg"></div>
          <p>Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FiLayers />
            <h3>No Batches Yet</h3>
            <p>Create your first batch to get started</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {batches.map((batch) => (
            <div key={batch._id} className="batch-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3>{batch.name}</h3>
                <span className={`badge ${batch.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {batch.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="batch-meta">
                <span><FiCalendar /> {batch.course}</span>
                <span><FiClock /> {batch.startTime} - {batch.endTime}</span>
                <span>
                  <div className="days-list">
                    {batch.days?.map((d) => (
                      <span key={d} className="day-pill">{d.slice(0, 3)}</span>
                    ))}
                  </div>
                </span>
              </div>
              <div className="batch-card-actions">
                <button className="btn btn-sm btn-outline" onClick={() => openEdit(batch)}>
                  <FiEdit2 /> Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(batch._id)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Batch' : 'Create New Batch'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Batch Name</label>
                  <input
                    name="name"
                    className="form-control"
                    placeholder="e.g. Morning Batch A"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Course</label>
                  <input
                    name="course"
                    className="form-control"
                    placeholder="e.g. BCA, MCA"
                    value={form.course}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    name="startTime"
                    type="time"
                    className="form-control"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    name="endTime"
                    type="time"
                    className="form-control"
                    value={form.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Days</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {DAYS_OPTIONS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: form.days.includes(day) ? '#4f46e5' : '#d1d5db',
                        background: form.days.includes(day) ? '#eef2ff' : '#fff',
                        color: form.days.includes(day) ? '#4f46e5' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Active Batch
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  ) : editingId ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="confirm-dialog">
              <h2>Delete Batch</h2>
              <p>Are you sure you want to delete this batch?</p>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>This action cannot be undone.</p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageBatches;
