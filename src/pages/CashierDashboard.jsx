import { useState, useEffect } from 'react';
import { Search, Check, CheckCircle, PlusCircle, User, Clock, Users, Plus, Minus, XCircle, LayoutDashboard, Ticket, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/formatTime';

export default function CashierDashboard({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInScheduleId, setWalkInScheduleId] = useState('');
  const [walkInPaxCounts, setWalkInPaxCounts] = useState({ regular: 1, student: 0, senior: 0, pwd: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedResId, setSelectedResId] = useState(null);
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('cashier-db-changes')
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
    const [resRes, schedRes] = await Promise.all([
      supabase.from('reservations').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('schedules').select('*')
    ]);
    
    if (schedRes.data) {
      const validSchedules = schedRes.data.filter(s => !user.assigned_port || s.origin === user.assigned_port);
      const validScheduleIds = validSchedules.map(s => s.id);
      
      setSchedules(validSchedules.map(s => ({
        ...s, departureTime: formatTime(s.departure_time), arrivalTime: formatTime(s.arrival_time), basePrice: s.base_price, discountedPrice: s.discounted_price
      })));

      if (resRes.data) {
        const now = new Date();
        setReservations(resRes.data.filter(r => validScheduleIds.includes(r.schedule_id)).map(r => {
          let currentStatus = r.status;
          if (currentStatus === 'pending' || currentStatus === 'paid') {
            const sched = validSchedules.find(s => s.id === r.schedule_id);
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
            status: currentStatus,
            userName: r.profiles?.full_name || r.guest_name || 'Walk-in User',
            scheduleId: r.schedule_id,
            ticketNumber: r.ticket_number,
            totalPrice: r.total_price,
            totalPax: r.total_pax,
            paxCounts: r.pax_counts
          };
        }));
      }
    }
  };

  const confirmMarkPaid = (id) => {
    setSelectedResId(id);
    setShowConfirmModal(true);
  };

  const handleMarkPaid = async () => {
    if (!selectedResId) return;
    await supabase.from('reservations').update({ status: 'paid' }).eq('id', selectedResId);
    setShowConfirmModal(false);
    setSelectedResId(null);
    fetchData();
  };

  const handlePaxChange = (type, delta) => {
    setWalkInPaxCounts(prev => {
      const newVal = prev[type] + delta;
      if (newVal < 0) return prev;
      return { ...prev, [type]: newVal };
    });
  };

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInName || !walkInScheduleId) return;

    const totalPax = walkInPaxCounts.regular + walkInPaxCounts.student + walkInPaxCounts.senior + walkInPaxCounts.pwd;
    if (totalPax === 0) {
      alert("Total passengers cannot be 0");
      return;
    }

    const tNum = 'ALN-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const selectedSchedule = schedules.find(s => s.id === walkInScheduleId);
    
    const totalPrice = (walkInPaxCounts.regular * selectedSchedule.basePrice) + 
                       ((walkInPaxCounts.student + walkInPaxCounts.senior + walkInPaxCounts.pwd) * selectedSchedule.discountedPrice);
    
    const { error } = await supabase.from('reservations').insert([{
      guest_name: walkInName + ' (Walk-in)',
      schedule_id: walkInScheduleId,
      ticket_number: tNum,
      status: 'paid',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      pax_counts: walkInPaxCounts,
      total_pax: totalPax,
      total_price: totalPrice
    }]);

    if (!error) {
      fetchData();
      setWalkInName('');
      setWalkInScheduleId('');
      setWalkInPaxCounts({ regular: 1, student: 0, senior: 0, pwd: 0 });
      setShowWalkInModal(false);
    } else {
      alert(error.message);
    }
  };

  const filteredReservations = reservations.filter(res => 
    res.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    res.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      <header className="dashboard-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-color)' }}>Cashier Dashboard {user?.assigned_port ? `(${user.assigned_port})` : ''}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage reservations and collect payments.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'overview' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LayoutDashboard size={18} /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('tickets')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'tickets' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'tickets' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Ticket size={18} /> Ticketing Details
        </button>
      </div>

      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2rem' }}>
            <div style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Confirm Payment</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Are you sure you want to mark this reservation as paid? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setShowConfirmModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                No, Cancel
              </button>
              <button type="button" onClick={handleMarkPaid} className="btn btn-primary" style={{ flex: 1 }}>
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showWalkInModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', maxWidth: '500px', width: '90%', padding: '2rem' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={24} /> Create Walk-in Ticket
            </h3>
            <form onSubmit={handleAddWalkIn}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  <User size={18} /> Passenger Name
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Juan Dela Cruz"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  <Clock size={18} /> Select Schedule
                </label>
                <select 
                  required
                  value={walkInScheduleId}
                  onChange={(e) => setWalkInScheduleId(e.target.value)}
                >
                  <option value="" disabled>Choose a route and time</option>
                  {schedules.map(sch => (
                    <option key={sch.id} value={sch.id}>
                      {sch.origin} to {sch.destination} ({sch.departureTime} - {sch.arrivalTime})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  <Users size={18} /> Passengers
                </label>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                  {['regular', 'student', 'senior', 'pwd'].map(type => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{type === 'pwd' ? 'PWD' : type}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button type="button" onClick={() => handlePaxChange(type, -1)} disabled={walkInPaxCounts[type] === 0} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} color="var(--text-primary)" />
                        </button>
                        <span style={{ width: '20px', textAlign: 'center', fontWeight: 600 }}>{walkInPaxCounts[type]}</span>
                        <button type="button" onClick={() => handlePaxChange(type, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={14} color="var(--text-primary)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowWalkInModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Collect Cash & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Ready for Walk-in Customers?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>Quickly issue tickets for passengers who arrive without prior reservations. Ensure you collect the cash payment before issuing the ticket.</p>
            <button onClick={() => setShowWalkInModal(true)} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
              <PlusCircle size={24} /> Create Walk-in Ticket
            </button>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="animate-fade-in">
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--background-color)', borderRadius: '8px', padding: '0.5rem 1rem', border: '1px solid rgba(0,0,0,0.1)' }}>
              <Search size={20} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" 
                placeholder="Search by Ticket Number or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', margin: 0, padding: 0, boxShadow: 'none' }}
              />
            </div>
          </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--background-color)' }}>
                <th style={{ padding: '1rem' }}>Ticket No.</th>
                <th style={{ padding: '1rem' }}>Customer</th>
                <th style={{ padding: '1rem' }}>Route</th>
                <th style={{ padding: '1rem' }}>Date & Time</th>
                <th style={{ padding: '1rem' }}>Passengers</th>
                <th style={{ padding: '1rem' }}>Total Price</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No reservations found.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res, idx) => {
                  const schedule = schedules.find(s => s.id === res.scheduleId);
                  const paxCounts = res.paxCounts || { regular: 1, student: 0, senior: 0, pwd: 0 };
                  
                  return (
                    <tr key={res.id} style={{ borderBottom: idx === filteredReservations.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td data-label="Ticket No." style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>{res.ticketNumber}</td>
                      <td data-label="Customer" style={{ padding: '1rem' }}>{res.userName}</td>
                      <td data-label="Route" style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500 }}>{schedule?.origin} to {schedule?.destination}</div>
                      </td>
                      <td data-label="Date & Time" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.9rem' }}>{res.date}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {schedule?.departureTime} - {schedule?.arrivalTime}
                        </div>
                      </td>
                      <td data-label="Passengers" style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{res.totalPax || 1} Pax Total</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {Object.entries(paxCounts).map(([k, v]) => v > 0 ? `${v} ${k}` : '').filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td data-label="Total Price" style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--success-color)', fontWeight: 700 }}>₱{res.totalPrice}</div>
                      </td>
                      <td data-label="Status" style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          backgroundColor: res.status === 'paid' ? 'rgba(52, 199, 89, 0.1)' : res.status === 'cancelled' ? 'rgba(255, 59, 48, 0.1)' : res.status === 'expired' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(134, 134, 139, 0.1)',
                          color: res.status === 'paid' ? 'var(--success-color)' : res.status === 'cancelled' ? 'var(--error-color)' : res.status === 'expired' ? '#ff9500' : 'var(--text-secondary)'
                        }}>
                          {res.status.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Action" style={{ padding: '1rem' }}>
                        {res.status === 'pending' ? (
                          <button 
                            onClick={() => confirmMarkPaid(res.id)}
                            className="btn btn-primary" 
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          >
                            <Check size={16} /> Mark Paid
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: res.status === 'cancelled' ? 'var(--error-color)' : res.status === 'expired' ? '#ff9500' : 'var(--success-color)', fontSize: '0.85rem', fontWeight: 600 }}>
                            {res.status === 'cancelled' ? <XCircle size={16} /> : res.status === 'expired' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />} 
                            {res.status === 'cancelled' ? 'Cancelled' : res.status === 'expired' ? 'Expired' : 'Collected'}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
