import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Cloud, Sun, CloudRain, Wind, Ticket, Edit, Trash2, XCircle, LayoutDashboard, Calendar, Clock as ClockIcon, Bell, AlertTriangle, CheckCircle, Info, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/formatTime';

export default function CustomerDashboard({ user }) {
  const [weather, setWeather] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // State from Supabase
  const [reservations, setReservations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [portalTarget, setPortalTarget] = useState(null);

  const renderTabs = () => (
    <>
      <button 
        className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        <LayoutDashboard size={20} /> Overview
      </button>
      <button 
        className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
        onClick={() => setActiveTab('bookings')}
      >
        <Calendar size={20} /> My Bookings
      </button>
      <button 
        className={`sidebar-item ${activeTab === 'schedules' ? 'active' : ''}`}
        onClick={() => setActiveTab('schedules')}
      >
        <ClockIcon size={20} /> Schedules & Prices
      </button>
      <button 
        className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
        onClick={() => setActiveTab('notifications')}
      >
        <Bell size={20} /> Announcements
      </button>
    </>
  );

  const [editingRes, setEditingRes] = useState(null);
  const [editScheduleId, setEditScheduleId] = useState('');
  const [editPaxCounts, setEditPaxCounts] = useState({ regular: 0, student: 0, senior: 0, pwd: 0 });
  const [editPassengerNames, setEditPassengerNames] = useState([]);

  const myReservations = reservations;

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('customer-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchData() {
    if (!user) return;
    const [resRes, schedRes, annRes] = await Promise.all([
      supabase.from('reservations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('schedules').select('*'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false })
    ]);

    if (resRes.data) {
      setReservations(resRes.data.map(r => ({
        ...r,
        scheduleId: r.schedule_id,
        ticketNumber: r.ticket_number,
        totalPrice: r.total_price,
        totalPax: r.total_pax,
        paxCounts: r.pax_counts,
        date: r.date,
        passengerNames: r.passenger_names || []
      })));
    }
    if (schedRes.data) {
      setSchedules(schedRes.data.map(s => ({
        ...s, departureTime: formatTime(s.departure_time), arrivalTime: formatTime(s.arrival_time), basePrice: s.base_price, discountedPrice: s.discounted_price
      })));
    }
    if (annRes.data) {
      setAnnouncements(annRes.data);
    }
  };

  const handleCancel = async (id) => {
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    fetchData();
  };

  const handleDelete = async (id) => {
    await supabase.from('reservations').delete().eq('id', id);
    fetchData();
  };

  const openEdit = (res) => {
    setEditingRes(res);
    setEditScheduleId(res.scheduleId);
    setEditPaxCounts(res.paxCounts || { regular: 1, student: 0, senior: 0, pwd: 0 });
    setEditPassengerNames(res.passengerNames || []);
  };

  const handlePaxChange = (type, delta) => {
    setEditPaxCounts(prev => {
      const newVal = (prev[type] || 0) + delta;
      if (newVal < 0) return prev;
      return { ...prev, [type]: newVal };
    });
  };

  const editTotalPax = editPaxCounts.regular + editPaxCounts.student + editPaxCounts.senior + editPaxCounts.pwd;

  useEffect(() => {
    if (!editingRes) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditPassengerNames(prev => {
      if (prev.length === editTotalPax) return prev;
      const newNames = [...prev];
      if (newNames.length < editTotalPax) {
        for (let i = newNames.length; i < editTotalPax; i++) {
          newNames.push(i === 0 && user ? user.fullName : '');
        }
      } else {
        newNames.length = editTotalPax;
      }
      return newNames;
    });
  }, [editTotalPax, editingRes, user]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRes) return;
    if (editTotalPax === 0) {
      alert('Total passengers cannot be 0.');
      return;
    }

    const schedule = schedules.find(s => s.id === editScheduleId);
    if (!schedule) return;

    const totalPrice = (editPaxCounts.regular * schedule.basePrice) + 
                       ((editPaxCounts.student + editPaxCounts.senior + editPaxCounts.pwd) * schedule.discountedPrice);

    await supabase.from('reservations').update({
      schedule_id: editScheduleId,
      pax_counts: editPaxCounts,
      total_pax: editTotalPax,
      total_price: totalPrice,
      passenger_names: editPassengerNames
    }).eq('id', editingRes.id);

    fetchData();
    setEditingRes(null);
  };

  useEffect(() => {
    // Fetch weather for Iloilo Port
    fetch('https://api.open-meteo.com/v1/forecast?latitude=10.7167&longitude=122.5667&current_weather=true')
      .then(res => res.json())
      .then(data => {
        setWeather(data.current_weather);
      })
      .catch(err => console.error("Weather fetch error", err));
      
    // eslint-disable-next-line
    setPortalTarget(document.getElementById('mobile-tabs-portal'));
  }, []);

  const getWeatherIcon = (code) => {
    if (code === undefined) return <Sun size={32} color="var(--primary-color)" />;
    if (code <= 3) return <Sun size={32} color="var(--primary-color)" />;
    if (code <= 48) return <Cloud size={32} color="var(--text-secondary)" />;
    return <CloudRain size={32} color="var(--primary-color)" />;
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Edit Modal */}
      {editingRes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={24} /> Edit Reservation
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Schedule</label>
                <select required value={editScheduleId} onChange={(e) => setEditScheduleId(e.target.value)}>
                  {schedules.map(sch => (
                    <option key={sch.id} value={sch.id}>
                      {sch.origin} to {sch.destination} ({sch.departureTime} - {sch.arrivalTime})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Passengers</label>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                  {['regular', 'student', 'senior', 'pwd'].map(type => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{type === 'pwd' ? 'PWD' : type}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button type="button" onClick={() => handlePaxChange(type, -1)} disabled={!editPaxCounts[type]} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} color="var(--text-primary)" />
                        </button>
                        <span style={{ width: '20px', textAlign: 'center', fontWeight: 600 }}>{editPaxCounts[type] || 0}</span>
                        <button type="button" onClick={() => handlePaxChange(type, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={14} color="var(--text-primary)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editTotalPax > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Passenger Names (Required for Manifest)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {editPassengerNames.map((name, idx) => (
                      <input 
                        key={idx}
                        type="text"
                        placeholder={`Passenger ${idx + 1} Full Name`}
                        required
                        value={name}
                        onChange={(e) => {
                          const newNames = [...editPassengerNames];
                          newNames[idx] = e.target.value;
                          setEditPassengerNames(newNames);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setEditingRes(null)} className="btn btn-outline" style={{ flex: 1 }}>Close</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>Welcome to Alonpass!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Book your ferry tickets smoothly and stay updated.</p>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {renderTabs()}
        </aside>
        
        {portalTarget && createPortal(renderTabs(), portalTarget)}

        {/* Main Content Area */}
        <main className="dashboard-content">
          
          {activeTab === 'overview' && (
            <div className="grid-2 animate-fade-in">
              {/* Weather Widget */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Wind size={24} /> Terminal Weather Update
                </h2>
                {weather ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {getWeatherIcon(weather.weathercode)}
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{weather.temperature}°C</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Wind: {weather.windspeed} km/h</div>
                    </div>
                  </div>
                ) : (
                  <p>Loading weather data...</p>
                )}
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
                  Location: Iloilo Port Terminal
                </p>
              </div>

              {/* Action Card */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                <h2 style={{ marginBottom: '1rem' }}>Ready to travel?</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                  Check our daily schedules and book your tickets in advance to avoid the long queues at the port.
                </p>
                <Link to="/reservation" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                  <Ticket size={20} /> Book a Ticket Now
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '1.5rem' }}>My Bookings</h2>
              {myReservations.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  You have no active bookings. Click "Book a Ticket Now" to get started!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius)', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--background-color)', textAlign: 'left' }}>
                        <th style={{ padding: '1rem' }}>Ticket No.</th>
                        <th style={{ padding: '1rem' }}>Route</th>
                        <th style={{ padding: '1rem' }}>Date & Time</th>
                        <th style={{ padding: '1rem' }}>Passengers</th>
                        <th style={{ padding: '1rem' }}>Total Price</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReservations.map((res, idx) => {
                        const schedule = schedules.find(s => s.id === res.scheduleId);
                        const isPaid = res.status === 'paid';
                        const isCancelled = res.status === 'cancelled';

                        return (
                          <tr key={res.id} style={{ borderBottom: idx === myReservations.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.05)', opacity: isCancelled ? 0.6 : 1 }}>
                            <td data-label="Ticket No." style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>{res.ticketNumber}</td>
                            <td data-label="Route" style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 500 }}>{schedule?.origin} to {schedule?.destination}</div>
                            </td>
                            <td data-label="Date & Time" style={{ padding: '1rem' }}>
                              <div style={{ fontSize: '0.9rem' }}>{res.date}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{schedule?.departureTime}</div>
                            </td>
                            <td data-label="Passengers" style={{ padding: '1rem' }}>
                              <div style={{ textTransform: 'capitalize' }}>{res.totalPax || 1} Pax</div>
                            </td>
                            <td data-label="Total Price" style={{ padding: '1rem', fontWeight: 600, color: 'var(--success-color)' }}>
                              ₱{res.totalPrice}
                            </td>
                            <td data-label="Status" style={{ padding: '1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                backgroundColor: isPaid ? 'rgba(52, 199, 89, 0.1)' : isCancelled ? 'rgba(255, 59, 48, 0.1)' : 'rgba(134, 134, 139, 0.1)',
                                color: isPaid ? 'var(--success-color)' : isCancelled ? 'var(--error-color)' : 'var(--text-secondary)'
                              }}>
                                {res.status.toUpperCase()}
                              </span>
                            </td>
                            <td data-label="Actions" style={{ padding: '1rem' }}>
                              {!isPaid && !isCancelled ? (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => openEdit(res)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} title="Edit Ticket">
                                    <Edit size={16} />
                                  </button>
                                  <button onClick={() => handleCancel(res.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--error-color)', borderColor: 'var(--error-color)' }} title="Cancel Ticket">
                                    <XCircle size={16} />
                                  </button>
                                  <button onClick={() => handleDelete(res.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--error-color)', borderColor: 'var(--error-color)' }} title="Delete Ticket">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {isPaid ? "Locked (Paid)" : "Locked (Cancelled)"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedules' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '1.5rem' }}>Daily Schedules & Prices</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius)', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--background-color)', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Vessel</th>
                      <th style={{ padding: '1rem' }}>Route</th>
                      <th style={{ padding: '1rem' }}>Departure</th>
                      <th style={{ padding: '1rem' }}>Arrival</th>
                      <th style={{ padding: '1rem' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((sch, idx) => (
                      <tr key={sch.id} style={{ borderBottom: idx === schedules.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
                        <td data-label="Vessel" style={{ padding: '1rem', fontWeight: 600 }}>{sch.vessel}</td>
                        <td data-label="Route" style={{ padding: '1rem' }}>{sch.origin} &rarr; {sch.destination}</td>
                        <td data-label="Departure" style={{ padding: '1rem' }}>{sch.departureTime}</td>
                        <td data-label="Arrival" style={{ padding: '1rem' }}>{sch.arrivalTime}</td>
                        <td data-label="Price" style={{ padding: '1rem', color: 'var(--success-color)', fontWeight: 600 }}>₱{sch.discountedPrice} - ₱{sch.basePrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={24} /> Port Announcements
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map(ann => (
                  <div key={ann.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      padding: '0.75rem', 
                      borderRadius: '50%', 
                      backgroundColor: ann.type === 'warning' ? 'rgba(255, 149, 0, 0.1)' : ann.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                      color: ann.type === 'warning' ? '#FF9500' : ann.type === 'success' ? '#34C759' : '#007AFF'
                    }}>
                      {ann.type === 'warning' && <AlertTriangle size={24} />}
                      {ann.type === 'success' && <CheckCircle size={24} />}
                      {ann.type === 'info' && <Info size={24} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0 }}>{ann.title}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ann.date}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>{ann.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
