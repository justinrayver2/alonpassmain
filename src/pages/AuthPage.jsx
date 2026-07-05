import { useState } from 'react';
import { Ship, Waves } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthPage({ defaultRole = 'customer' }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (!/(?=.*[A-Z])/.test(password)) {
        setError('Password must contain at least one capital letter.');
        return;
      }
      if (!/(?=.*[0-9])/.test(password)) {
        setError('Password must contain at least one number.');
        return;
      }
      if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
        setError('Password must contain at least one special character (e.g., !, @).');
        return;
      }
      if (!age || isNaN(age) || age <= 0) {
        setError('Please enter a valid age.');
        return;
      }
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError(error.message);
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      
      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert([
          { 
            id: data.user.id, 
            full_name: fullName, 
            age: parseInt(age, 10),
            role: 'customer' // Enforce customer role on signup for security
          }
        ]);
        if (profileError) setError(profileError.message);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', color: 'rgba(0, 0, 0, 0.02)', zIndex: -1 }}>
        <Waves size={800} />
      </div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-5%', color: 'rgba(0, 0, 0, 0.03)', zIndex: -1 }}>
        <Ship size={600} />
      </div>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: isLogin ? '400px' : '650px', textAlign: 'center', transition: 'max-width 0.3s ease' }}>
        <div style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>
          <Ship size={48} style={{ margin: '0 auto' }} />
          <h1 style={{ marginTop: '1rem', textTransform: 'capitalize' }}>
            Alonpass {defaultRole !== 'customer' ? defaultRole : ''}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ferry Ticket Reservation</p>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(255, 75, 75, 0.1)', color: 'var(--error-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {!isLogin ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter your full name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Age</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder="Age" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {defaultRole === 'customer' && (
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
