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
        
        {user && (
          <>
            <div className="navbar-actions desktop-actions">
              <Link to="/" className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <Home size={18} />
                <span style={{ fontWeight: 500 }}>Home</span>
              </Link>
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
        )}
      </div>

      {user && (
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          {/* Portal Target for Dashboard Tabs */}
          <div id="mobile-tabs-portal" className="mobile-tabs-container" onClick={() => setIsMobileMenuOpen(false)}></div>

          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', width: '100%', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
            <Home size={18} />
            <span style={{ fontWeight: 500 }}>Home</span>
          </Link>
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
        </div>
      )}
    </nav>
  );
}
