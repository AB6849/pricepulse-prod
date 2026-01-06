import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/home/Home';
import Blinkit from './pages/Blinkit';
import Swiggy from './pages/Swiggy';
import Zepto from './pages/Zepto';
import Amazon from './pages/Amazon';
import Benchmarks from './pages/Benchmarks';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AdminUsers from './pages/AdminUsers';
import AcceptInvite from './pages/AcceptInvite';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blinkit"
        element={
          <ProtectedRoute>
            <Blinkit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/swiggy"
        element={
          <ProtectedRoute>
            <Swiggy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/zepto"
        element={
          <ProtectedRoute>
            <Zepto />
          </ProtectedRoute>
        }
      />
      <Route
        path="/amazon"
        element={
          <ProtectedRoute>
            <Amazon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/benchmarks"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Benchmarks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
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



