import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlusCircle, Ship, DollarSign, Ticket, Activity, Bell, AlertTriangle, CheckCircle, Info, Edit, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/formatTime';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');

  // Schedule State
  const [origin, setOrigin] = useState('Iloilo');
  const [destination, setDestination] = useState('Guimaras');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [vessel, setVessel] = useState('');
  const [basePrice, setBasePrice] = useState(50);
  const [discountedPrice, setDiscountedPrice] = useState(35);
  const [showModal, setShowModal] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [reservations, setReservations] = useState([]);

  // Announcement State
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState('info');
  const [editingAnn, setEditingAnn] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);

  const renderTabs = () => (
    <>
      <button 
        className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('analytics')}
      >
        <Activity size={20} /> Analytics & Metrics
      </button>
      <button 
        className={`sidebar-item ${activeTab === 'schedules' ? 'active' : ''}`}
        onClick={() => setActiveTab('schedules')}
      >
        <Ship size={20} /> Schedules
      </button>
      <button 
        className={`sidebar-item ${activeTab === 'announcements' ? 'active' : ''}`}
        onClick={() => setActiveTab('announcements')}
      >
        <Bell size={20} /> Announcements
      </button>
    </>
  );

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    setPortalTarget(document.getElementById('mobile-tabs-portal'));
  }, []);

  async function fetchData() {
    const [schedRes, annRes, resRes] = await Promise.all([
      supabase.from('schedules').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('reservations').select('*')
    ]);
    
    if (schedRes.data) setSchedules(schedRes.data.map(s => ({...s, departureTime: formatTime(s.departure_time), arrivalTime: formatTime(s.arrival_time), basePrice: s.base_price, discountedPrice: s.discounted_price})));
    if (annRes.data) setAnnouncements(annRes.data);
    if (resRes.data) {
      const now = new Date();
      setReservations(resRes.data.map(r => {
        let currentStatus = r.status;
        if ((currentStatus === 'pending' || currentStatus === 'paid') && schedRes.data) {
          const sched = schedRes.data.find(s => s.id === r.schedule_id);
          if (sched) {
            const scheduleDateTime = new Date(`${r.date}T${sched.departure_time}`);
            if (now > scheduleDateTime) {
              currentStatus = 'expired';
              if (r.status === 'pending') {
                supabase.from('reservations').update({ status: 'expired' }).eq('id', r.id).then();
              }
            }
          }
        }
        return {
          ...r, 
          scheduleId: r.schedule_id, 
          totalPrice: r.total_price, 
          totalPax: r.total_pax,
          status: currentStatus
        };
      }));
    }
  };

  // Calculate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalBookings = reservations.length;
    let totalPaxBoarded = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;
    
    const routeRevenue = {};

    reservations.forEach(res => {
      if (res.status === 'paid') {
        paidCount++;
        totalRevenue += Number(res.totalPrice) || 0;
        totalPaxBoarded += (Number(res.totalPax) || 1);
        
        const schedule = schedules.find(s => s.id === res.scheduleId);
        if (schedule) {
          const routeName = `${schedule.origin}-${schedule.destination}`;
          if (!routeRevenue[routeName]) routeRevenue[routeName] = 0;
          routeRevenue[routeName] += Number(res.totalPrice) || 0;
        }
      } else if (res.status === 'pending') {
        pendingCount++;
      } else if (res.status === 'expired') {
        expiredCount++;
      }
    });

    const routeData = Object.keys(routeRevenue).map(key => ({
      name: key,
      revenue: routeRevenue[key]
    }));

    const statusData = [
      { name: 'Paid', value: paidCount },
      { name: 'Pending', value: pendingCount },
      { name: 'Expired', value: expiredCount }
    ].filter(d => d.value > 0);

    return { totalRevenue, totalBookings, totalPaxBoarded, paidCount, pendingCount, expiredCount, routeData, statusData };
  }, [schedules, reservations]);

  const COLORS = ['var(--success-color)', 'var(--text-secondary)', '#ff9500'];

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!departureTime || !arrivalTime || !vessel) return;

    const depHour = parseInt(departureTime.split(':')[0], 10);
    const arrHour = parseInt(arrivalTime.split(':')[0], 10);

    if (depHour >= 21 || arrHour >= 21) {
      setShowModal(true);
      return;
    }

    const { error } = await supabase.from('schedules').insert([{
      origin,
      destination,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      base_price: Number(basePrice),
      discounted_price: Number(discountedPrice),
      vessel
    }]);

    if (!error) {
      fetchData();
      setDepartureTime('');
      setArrivalTime('');
      setVessel('');
    } else {
      alert(error.message);
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annMessage) return;

    if (editingAnn) {
      await supabase.from('announcements').update({
        title: annTitle, message: annMessage, type: annType
      }).eq('id', editingAnn.id);
      setEditingAnn(null);
    } else {
      await supabase.from('announcements').insert([{
        title: annTitle,
        message: annMessage,
        type: annType,
        date: new Date().toISOString().split('T')[0]
      }]);
    }

    fetchData();
    setAnnTitle('');
    setAnnMessage('');
    setAnnType('info');
  };

  const handleEditAnn = (ann) => {
    setEditingAnn(ann);
    setAnnTitle(ann.title);
    setAnnMessage(ann.message);
    setAnnType(ann.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAnn = async (id) => {
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage ferry schedules, announcements, and system settings.</p>
      </header>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>Operation Hours Exceeded</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>The port operations stop at 9:00 PM. You cannot add a route that departs or arrives at or after 9:00 PM.</p>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-primary">Understood</button>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {renderTabs()}
        </aside>

        {portalTarget && createPortal(renderTabs(), portalTarget)}

        {/* Main Content Area */}
        <main className="dashboard-content">
          
          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</p>
                    <h2 style={{ margin: 0 }}>₱{metrics.totalRevenue.toLocaleString()}</h2>
                  </div>
                </div>
                
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                    <Ticket size={24} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Bookings</p>
                    <h2 style={{ margin: 0 }}>{metrics.totalBookings}</h2>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Pax Boarded</p>
                    <h2 style={{ margin: 0 }}>{metrics.totalPaxBoarded}</h2>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="glass-panel">
                  <h3 style={{ marginBottom: '1.5rem' }}>Revenue by Route</h3>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.routeData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fff" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#fff" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            backgroundColor: 'rgba(15,15,17,0.8)', 
                            backdropFilter: 'blur(10px)',
                            color: '#fff',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)' 
                          }} 
                          itemStyle={{ color: '#fff', fontWeight: 600 }}
                        />
                        <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} barSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Ticket Status (Cashier Progress)</h3>
                  <div style={{ height: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {metrics.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></div>
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>Paid ({metrics.paidCount})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }}></div>
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>Pending ({metrics.pendingCount})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SCHEDULES */}
          {activeTab === 'schedules' && (
            <div className="grid-2 animate-fade-in">
              <div className="glass-panel">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <PlusCircle size={24} /> Add New Schedule
                </h2>
                <form onSubmit={handleAddSchedule}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Origin</label>
                      <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                        <option value="Iloilo">Iloilo</option>
                        <option value="Guimaras">Guimaras</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Destination</label>
                      <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                        <option value="Guimaras">Guimaras</option>
                        <option value="Iloilo">Iloilo</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Vessel Name</label>
                    <input type="text" required placeholder="e.g. Alon Express 2" value={vessel} onChange={(e) => setVessel(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Departure Time</label>
                      <input type="time" required value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Arrival Time</label>
                      <input type="time" required value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Base Price (₱)</label>
                      <input type="number" required min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Discounted Price (₱)</label>
                      <input type="number" required min="0" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Schedule</button>
                </form>
              </div>

              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Ship size={24} /> Active Schedules
                </h2>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                  {schedules.map((sch) => (
                    <div key={sch.id} style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{sch.origin} &rarr; {sch.destination}</span>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{sch.vessel}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {sch.departureTime} - {sch.arrivalTime}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--success-color)', fontWeight: 600 }}>
                        Regular: ₱{sch.basePrice} | Discounted: ₱{sch.discountedPrice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="grid-2 animate-fade-in">
              <div className="glass-panel">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {editingAnn ? <Edit size={24} /> : <PlusCircle size={24} />} 
                  {editingAnn ? 'Edit Announcement' : 'New Announcement'}
                </h2>
                <form onSubmit={handleAddAnnouncement}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Announcement Type</label>
                    <select value={annType} onChange={(e) => setAnnType(e.target.value)}>
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Warning (Orange)</option>
                      <option value="success">Success (Green)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                    <input type="text" required placeholder="e.g. Weather Advisory" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message</label>
                    <textarea 
                      required 
                      rows="4"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'var(--background-color)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
                      placeholder="Enter the announcement details..." 
                      value={annMessage} 
                      onChange={(e) => setAnnMessage(e.target.value)} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {editingAnn && (
                      <button type="button" onClick={() => { setEditingAnn(null); setAnnTitle(''); setAnnMessage(''); setAnnType('info'); }} className="btn btn-outline" style={{ flex: 1 }}>
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ flex: editingAnn ? 1 : 'none', width: editingAnn ? 'auto' : '100%' }}>
                      {editingAnn ? 'Save Changes' : 'Publish Announcement'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Bell size={24} /> Active Announcements
                </h2>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                  {announcements.map((ann) => (
                    <div key={ann.id} style={{ padding: '1.25rem', backgroundColor: 'var(--background-color)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ 
                          padding: '0.5rem', 
                          borderRadius: '50%', 
                          backgroundColor: ann.type === 'warning' ? 'rgba(255, 149, 0, 0.1)' : ann.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                          color: ann.type === 'warning' ? '#FF9500' : ann.type === 'success' ? '#34C759' : '#007AFF'
                        }}>
                          {ann.type === 'warning' && <AlertTriangle size={18} />}
                          {ann.type === 'success' && <CheckCircle size={18} />}
                          {ann.type === 'info' && <Info size={18} />}
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>{ann.title}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ann.date}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{ann.message}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.75rem' }}>
                        <button onClick={() => handleEditAnn(ann)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={() => handleDeleteAnn(ann.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
