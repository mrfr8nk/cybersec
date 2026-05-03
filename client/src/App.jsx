import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const LoadingScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#020408] z-50">
    <div className="relative w-32 h-32 mb-8">
      <div className="absolute inset-0 rounded-full border-2 border-[rgba(0,245,255,0.1)] animate-spin" style={{ borderTopColor: '#00f5ff', animationDuration: '1s' }} />
      <div className="absolute inset-4 rounded-full border-2 border-[rgba(139,92,246,0.1)] animate-spin" style={{ borderTopColor: '#8b5cf6', animationDuration: '1.5s', animationDirection: 'reverse' }} />
      <div className="absolute inset-8 rounded-full border-2 border-[rgba(255,0,255,0.1)] animate-spin" style={{ borderTopColor: '#ff00ff', animationDuration: '2s' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <img src="https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg" alt="CSP" className="w-12 h-12 object-contain rounded" />
      </div>
    </div>
    <p className="font-display text-[#00f5ff] text-sm tracking-[4px] animate-pulse">INITIALIZING...</p>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(2,4,8,0.95)',
            border: '1px solid rgba(0,245,255,0.3)',
            color: '#e0f7fa',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.85rem',
          },
          success: { iconTheme: { primary: '#00ff88', secondary: '#020408' } },
          error: { iconTheme: { primary: '#ff4444', secondary: '#020408' } },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  );
}
