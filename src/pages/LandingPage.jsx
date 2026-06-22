import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Ship, Users, Shield, Zap, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ user }) {
  const container = useRef();
  const navigate = useNavigate();

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
      
      {/* Landing Page Navbar */}
      {!user && (
        <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ship size={24} /> Alonpass
          </div>
          <button onClick={() => navigate('/auth')} className="btn btn-outline" style={{ borderRadius: '100px', padding: '0.5rem 1.5rem' }}>
            Sign In
          </button>
        </nav>
      )}

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

        <div className="hero-cta" style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => window.location.href = 'mailto:sales@alonpass.com'} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '8px' }}>
            Request a Demo
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>Engineered for High-Traffic Ports</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Say goodbye to long queues and hand-written manifests. Alonpass automates the heavy lifting.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
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

      {/* Enterprise CTA Section */}
      <section className="enterprise-cta" style={{ padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'var(--background-color)', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>Ready to Modernize Your Port?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
            Join leading maritime operators in replacing manual ledgers with a secure, automated digital infrastructure. Improve efficiency and ensure complete regulatory compliance.
          </p>
          
          <button onClick={() => window.location.href = 'mailto:sales@alonpass.com'} className="btn btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', borderRadius: '8px' }}>
            Contact Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Ship size={20} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Alonpass</span>
        </div>
        <p>© 2026 Alonpass. All rights reserved.</p>
      </footer>
    </div>
  );
}
