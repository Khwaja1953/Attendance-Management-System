import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { FiSettings, FiPlus, FiX, FiSave } from 'react-icons/fi';

const SettingsPage = () => {
  const [allowedIPs, setAllowedIPs] = useState([]);
  const [instituteName, setInstituteName] = useState('');
  const [newIP, setNewIP] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        const data = res.data.data || {};
        setAllowedIPs(data.allowedIPs || []);
        setInstituteName(data.instituteName || '');
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const addIP = () => {
    const ip = newIP.trim();
    if (!ip) {
      toast.error('Please enter an IP address');
      return;
    }
    if (allowedIPs.includes(ip)) {
      toast.error('IP already exists');
      return;
    }
    setAllowedIPs([...allowedIPs, ip]);
    setNewIP('');
  };

  const removeIP = (ip) => {
    setAllowedIPs(allowedIPs.filter((i) => i !== ip));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIP();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', { allowedIPs, instituteName });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-center">
          <div className="spinner spinner-lg"></div>
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your attendance management system</p>
      </div>

      <div style={{ maxWidth: '700px' }}>
        {/* Institute Name */}
        <div className="card mb-3">
          <div className="card-header">
            <h3>🏫 Institute Name</h3>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="instituteName">Institute / Organization Name</label>
            <input
              id="instituteName"
              type="text"
              className="form-control"
              placeholder="Enter institute name"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
            />
          </div>
        </div>

        {/* Allowed IPs */}
        <div className="card mb-3">
          <div className="card-header">
            <h3>🌐 Allowed IP Addresses</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '16px' }}>
            Students can only mark attendance from these IP addresses. Leave empty to allow all IPs.
          </p>

          {/* Add IP */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 192.168.1.1 or 10.0.0.0/24"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={addIP} type="button">
              <FiPlus /> Add
            </button>
          </div>

          {/* IP Tags */}
          {allowedIPs.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>
              No IP restrictions configured. All IPs are allowed.
            </p>
          ) : (
            <div className="tag-list">
              {allowedIPs.map((ip) => (
                <div key={ip} className="tag">
                  {ip}
                  <button onClick={() => removeIP(ip)} title="Remove IP">
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={saving}
          style={{ marginTop: '8px' }}
        >
          {saving ? (
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
          ) : (
            <>
              <FiSave /> Save Settings
            </>
          )}
        </button>
      </div>
    </Layout>
  );
};

export default SettingsPage;
