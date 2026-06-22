import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ship, LogOut, User, Menu, X } from 'lucide-react';

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
