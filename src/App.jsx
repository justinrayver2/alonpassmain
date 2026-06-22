import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CustomerDashboard from './pages/CustomerDashboard';
import ReservationPage from './pages/ReservationPage';
import CashierDashboard from './pages/CashierDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { supabase } from './lib/supabase';

// Simple route protection
const ProtectedRoute = ({ children, allowedRole, user }) => {
  if (allowedRole && user.role !== allowedRole) {
    let fallback = '/dashboard';
    if (user.role === 'cashier') fallback = '/cashier';
    if (user.role === 'admin') fallback = '/admin';
    return <Navigate to={fallback} replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (authUser) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (data) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          role: data.role,
          fullName: data.full_name,
          assigned_port: data.assigned_port
        });
      } else {
        setUser({ id: authUser.id, email: authUser.email, role: 'customer', fullName: authUser.email.split('@')[0] });
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <Router>
      {user && <Navbar user={user} setUser={setUser} />}
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage user={user} />} 
        />
        
        <Route 
          path="/auth" 
          element={
            user 
              ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'cashier' ? '/cashier' : '/dashboard'} replace /> 
              : <AuthPage setUser={setUser} defaultRole="customer" />
          } 
        />
        
        {/* Customer Routes */}
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <ProtectedRoute allowedRole="customer" user={user}>
                <CustomerDashboard user={user} />
              </ProtectedRoute>
            ) : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/reservation" 
          element={
            user ? (
              <ProtectedRoute allowedRole="customer" user={user}>
                <ReservationPage user={user} />
              </ProtectedRoute>
            ) : <Navigate to="/" replace />
          } 
        />

        {/* Cashier Routes */}
        <Route 
          path="/cashier" 
          element={
            user ? (
              <ProtectedRoute allowedRole="cashier" user={user}>
                <CashierDashboard user={user} />
              </ProtectedRoute>
            ) : <AuthPage setUser={setUser} defaultRole="cashier" />
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            user ? (
              <ProtectedRoute allowedRole="admin" user={user}>
                <AdminDashboard />
              </ProtectedRoute>
            ) : <AuthPage setUser={setUser} defaultRole="admin" />
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
