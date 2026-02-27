import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUserPlus } from 'react-icons/fi';
import api from '../services/api';

const SignupPage = () => {
  const [form, setForm] = useState({
    name: '',
    parentage: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    course: '',
    batch: '',
  });
  const [batches, setBatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/batch');
        setBatches(res.data.data || []);
      } catch {
        // Batches may not load if not authenticated yet
      }
    };
    fetchBatches();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, parentage, phone, email, password, address, course, batch } = form;
    if (!name || !parentage || !phone || !email || !password || !address || !course || !batch) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await signup(form);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <h1>Create Account</h1>
        <p className="subtitle">Fill in your details to get started</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="parentage">Parentage</label>
              <input
                id="parentage"
                name="parentage"
                type="text"
                className="form-control"
                placeholder="Father's / Guardian's name"
                value={form.parentage}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-control"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              className="form-control"
              placeholder="Enter your address"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="course">Course</label>
              <input
                id="course"
                name="course"
                type="text"
                className="form-control"
                placeholder="e.g. BCA, MCA, B.Tech"
                value={form.course}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="batch">Batch</label>
              <select
                id="batch"
                name="batch"
                className="form-control"
                value={form.batch}
                onChange={handleChange}
                required
              >
                <option value="">Select a batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} — {b.course}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="Create a password (min 6 chars)"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
          >
            {submitting ? (
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
            ) : (
              <>
                <FiUserPlus /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
