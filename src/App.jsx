import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Blinkit from './pages/Blinkit';
import BlinkitAnalytics from './pages/BlinkitAnalytics';
import InstamartAnalytics from './pages/InstamartAnalytics';
import ZeptoAnalytics from './pages/ZeptoAnalytics';
import Swiggy from './pages/Swiggy';
import Zepto from './pages/Zepto';
import Amazon from './pages/Amazon';
import Benchmarks from './pages/Benchmarks';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AdminUsers from './pages/AdminUsers';
import AcceptInvite from './pages/AcceptInvite';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DashboardLayout from './components/DashboardLayout';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function DashboardRoutes() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blinkit" element={<Blinkit />} />
          <Route path="/blinkit/analytics" element={<BlinkitAnalytics />} />
          <Route path="/swiggy" element={<Swiggy />} />
          <Route path="/swiggy/analytics" element={<InstamartAnalytics />} />
          <Route path="/zepto" element={<Zepto />} />
          <Route path="/zepto/analytics" element={<ZeptoAnalytics />} />
          <Route path="/amazon" element={<Amazon />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route path="/privacypolicy" element={<PrivacyPolicy />} />
      <Route path="*" element={<DashboardRoutes />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;



