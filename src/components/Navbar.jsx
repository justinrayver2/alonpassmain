import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ship, LogOut, User, Menu, X, Home } from 'lucide-react';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container flex-between">
        <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'cashier' ? '/cashier' : '/dashboard'} className="logo">
          <Ship size={28} color="var(--primary-color)" />
          <span>Alonpass</span>
        </Link>
        
        {/* Center Navigation Links (Desktop) */}
        <div className="nav-links desktop-actions" style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontWeight: 500 }}>
          <Link to="/" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
          {!user && (
            <>
              <a href="/#features" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Features</a>
              <a href="/#how-it-works" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>How it Works</a>
            </>
          )}
          {user && user.role === 'customer' && (
            <>
              <Link to="/dashboard" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>My Tickets</Link>
              <Link to="/reservation" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Book Trip</Link>
            </>
          )}
          {user && user.role === 'cashier' && (
            <Link to="/cashier" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Cashier Desk</Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Admin Portal</Link>
          )}
        </div>

        {user ? (
          <>
            <div className="navbar-actions desktop-actions">
              <div className="user-profile-badge">
                <div className="user-avatar">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <div className="user-profile-text">
                  <span className="user-name">{user.fullName}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-outline logout-btn">
                <LogOut size={16} />
                <span className="logout-text">Logout</span>
              </button>
            </div>

            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        ) : (
          <div className="navbar-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/auth" className="btn btn-outline desktop-actions" style={{ borderRadius: '100px', padding: '0.5rem 1.5rem', background: 'transparent' }}>Sign In</Link>
            <Link to="/auth" className="btn btn-primary" style={{ borderRadius: '100px', padding: '0.5rem 1.5rem' }}>Get Started</Link>
            
            <button 
              className="mobile-menu-btn" 
              style={{ marginLeft: '1rem' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        )}
      </div>

      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Portal Target for Dashboard Tabs */}
        <div id="mobile-tabs-portal" className="mobile-tabs-container" onClick={() => setIsMobileMenuOpen(false)}></div>

        {!user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', padding: '0.5rem 0' }}>Home</Link>
            <a href="/#features" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', padding: '0.5rem 0' }}>Features</a>
            <a href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.2rem', padding: '0.5rem 0' }}>How it Works</a>
            <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ marginTop: '1rem', textAlign: 'center', padding: '1rem' }}>Get Started</Link>
          </div>
        )}

        {user && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', width: '100%', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <Home size={18} />
                <span style={{ fontWeight: 500 }}>Home</span>
              </Link>
              {user.role === 'customer' && (
                <>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5rem 0' }}>My Tickets</Link>
                  <Link to="/reservation" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5rem 0' }}>Book a Trip</Link>
                </>
              )}
              {user.role === 'cashier' && (
                <Link to="/cashier" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5rem 0' }}>Cashier Desk</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5rem 0' }}>Admin Portal</Link>
              )}
            </div>

            <div className="user-profile-badge mobile-badge">
              <div className="user-avatar">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={16} />}
              </div>
              <div className="user-profile-text" style={{ display: 'flex' }}>
                <span className="user-name">{user.fullName}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
            <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="btn btn-outline mobile-logout-btn">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
