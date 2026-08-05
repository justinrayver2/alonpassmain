import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Ship, Users, Shield, Zap, TrendingUp, X } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ user }) {
  const container = useRef();
  const navigate = useNavigate();
  const [legalModal, setLegalModal] = useState(null);

  useGSAP(() => {
    // Hero Animations
    const tl = gsap.timeline();
    tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4');

    // Features Scroll Animations
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: i * 0.1
      });
    });

    // Maker Section Animation -> replaced by Enterprise CTA
    gsap.from('.enterprise-cta', {
      scrollTrigger: {
        trigger: '.enterprise-cta',
        start: 'top 80%',
      },
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
  }, { scope: container });

  return (
    <div ref={container} style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
        }
        .footer-link {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: var(--primary-color);
        }
      `}</style>
      
      
      {/* Hero Section */}
      <section style={{ 
        minHeight: '90vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 2rem',
        position: 'relative'
      }}>
        
        <div className="hero-badge" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
          Enterprise Port Management
        </div>

        <h1 className="hero-title" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '1000px', letterSpacing: '-1px' }}>
          Streamline Maritime Operations with Alonpass.
        </h1>

        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', marginBottom: '3rem', lineHeight: 1.6 }}>
          A comprehensive digital infrastructure designed for modern ports. Automate ticketing, manage multi-terminal fleets, and generate real-time Coast Guard manifests with enterprise-grade reliability.
        </p>

      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>Engineered for High-Traffic Ports</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Say goodbye to long queues and hand-written manifests. Alonpass automates the heavy lifting.</p>
        </div>

        <div className="responsive-grid">
          
          <div className="feature-card glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(10,132,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Real-time Syncing</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Powered by Supabase Realtime, every ticket booked reflects instantly across Cashier and Admin dashboards. No refreshing required.</p>
          </div>

          <div className="feature-card glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--success-color)' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Coast Guard Compliant</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Automatically collect passenger names for group bookings. Generating accurate manifests for maritime compliance has never been easier.</p>
          </div>

          <div className="feature-card glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,149,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#FF9500' }}>
              <Users size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Multi-Terminal Control</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Assign cashiers to specific ports (e.g. Iloilo or Guimaras). The dashboard intelligently filters schedules so staff only see what matters to them.</p>
          </div>

          <div className="feature-card glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(10,132,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Admin Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Track revenue by route, total boarded passengers, and cashier collection rates using interactive, visually stunning charts.</p>
          </div>

        </div>
      </section>

      {/* Ready to start Section */}
      <section id="how-it-works" className="enterprise-cta" style={{ padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>Experience Seamless Maritime Travel</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
            Whether you're managing port operations or booking your next trip, Alonpass provides a unified platform to make maritime travel fast, secure, and hassle-free.
          </p>
          
          <button onClick={() => navigate(user ? (user.role === 'admin' ? '/admin' : user.role === 'cashier' ? '/cashier' : '/dashboard') : '/auth')} className="btn btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', borderRadius: '8px' }}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'var(--background-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', paddingBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Ship size={24} color="var(--primary-color)" />
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Alonpass</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>
              Next-generation maritime digital infrastructure for ports and passengers alike.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Navigation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="/" className="footer-link">Home</a>
              <a href="/#features" className="footer-link">Features</a>
              <a href="/#how-it-works" className="footer-link">How it Works</a>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal('privacy'); }} className="footer-link">Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal('terms'); }} className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <p>© 2026 Alonpass. All rights reserved.</p>
        </div>
      </footer>

      {/* Legal Modal */}
      {legalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setLegalModal(null)}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--card-bg)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLegalModal(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>
              {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h2>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
              {legalModal === 'privacy' ? (
                <>
                  <p style={{ marginBottom: '1.5rem' }}>We take your privacy seriously. Alonpass only collects information that is absolutely necessary to process your maritime bookings, verify identity, and ensure regulatory compliance with the Coast Guard.</p>
                  <p>Your data is encrypted in transit and at rest using enterprise-grade security protocols. We will never sell or share your personal information with unauthorized third parties.</p>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: '1.5rem' }}>Welcome to Alonpass. By using our digital infrastructure, you agree to comply with all local maritime laws and terminal regulations set forth by the port authorities.</p>
                  <p>Tickets booked through the platform are subject to the specific refund, cancellation, and boarding policies of the operating maritime company and terminal.</p>
                </>
              )}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setLegalModal(null)}>Understood</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
