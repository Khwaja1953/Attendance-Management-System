import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentAttendance from './pages/StudentAttendance';
import AdminDashboard from './pages/AdminDashboard';
import ManageBatches from './pages/ManageBatches';
import StudentsList from './pages/StudentsList';
import BatchAttendance from './pages/BatchAttendance';
import StudentAttendanceAdmin from './pages/StudentAttendanceAdmin';
import SettingsPage from './pages/SettingsPage';

const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  return <StudentDashboard />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected: Dashboard (role-based) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <StudentAttendance />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/batches"
        element={
          <ProtectedRoute adminOnly>
            <ManageBatches />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute adminOnly>
            <StudentsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance/batch/:batchId"
        element={
          <ProtectedRoute adminOnly>
            <BatchAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance/student/:studentId"
        element={
          <ProtectedRoute adminOnly>
            <StudentAttendanceAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute adminOnly>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
