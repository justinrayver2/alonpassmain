import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/formatTime';
import { Calendar, Clock, CheckCircle, Users, Plus, Minus, User } from 'lucide-react';

export default function ReservationPage({ user }) {
  const [date, setDate] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  
  const [paxCounts, setPaxCounts] = useState({ regular: 0, student: 0, senior: 0, pwd: 0 });
  const [passengerNames, setPassengerNames] = useState([]);

  const [isSuccess, setIsSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [schedules, setSchedules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedules = async () => {
      const { data } = await supabase.from('schedules').select('*');
      if (data) {
        setSchedules(data.map(s => ({
          ...s, departureTime: formatTime(s.departure_time), arrivalTime: formatTime(s.arrival_time), basePrice: s.base_price, discountedPrice: s.discounted_price
        })));
      }
    };
    fetchSchedules();
  }, []);

  const selectedSchedule = useMemo(() => schedules.find(s => s.id === scheduleId), [scheduleId, schedules]);

  const totalPax = paxCounts.regular + paxCounts.student + paxCounts.senior + paxCounts.pwd;

  // Sync passengerNames length with totalPax
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPassengerNames(prev => {
      if (prev.length === totalPax) return prev;
      const newNames = [...prev];
      if (newNames.length < totalPax) {
        for (let i = newNames.length; i < totalPax; i++) {
          newNames.push(i === 0 ? user.fullName : '');
        }
      } else {
        newNames.length = totalPax;
      }
      return newNames;
    });
  }, [totalPax, user.fullName]);
  
  const totalPrice = useMemo(() => {
    if (!selectedSchedule) return 0;
    return (paxCounts.regular * selectedSchedule.basePrice) + 
           ((paxCounts.student + paxCounts.senior + paxCounts.pwd) * selectedSchedule.discountedPrice);
  }, [paxCounts, selectedSchedule]);

  const handlePaxChange = (type, delta) => {
    setPaxCounts(prev => {
      const newVal = prev[type] + delta;
      if (newVal < 0) return prev;
      return { ...prev, [type]: newVal };
    });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!date || !scheduleId || totalPax === 0) return;

    const currentHour = new Date().getHours();
    const isToday = date === new Date().toISOString().split('T')[0];
    
    if (isToday && currentHour >= 21) {
      setShowModal(true);
      return;
    }

    const tNum = 'ALN-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    const { error } = await supabase.from('reservations').insert([{
      user_id: user.id,
      schedule_id: scheduleId,
      ticket_number: tNum,
      status: 'pending',
      payment_method: 'cash',
      date,
      pax_counts: paxCounts,
      total_pax: totalPax,
      total_price: totalPrice,
      passenger_names: passengerNames
    }]);

    if (!error) {
      setTicketNumber(tNum);
      setIsSuccess(true);
    } else {
      alert(error.message);
    }
  };

  if (isSuccess) {
    return (
      <div className="container flex-center animate-fade-in" style={{ minHeight: '80vh' }}>
        <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={64} color="var(--success-color)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Reservation Confirmed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your reservation for {totalPax} passenger(s) has been successfully placed. Please present this ticket number to the cashier and pay via cash.
          </p>
          <div style={{ background: 'var(--background-color)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Ticket Number</p>
            <h1 style={{ letterSpacing: '2px', color: 'var(--primary-color)' }}>{ticketNumber}</h1>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderPaxCounter = (type, label, priceLabel) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div>
        <h4 style={{ margin: 0 }}>{label}</h4>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{priceLabel}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          type="button"
          onClick={() => handlePaxChange(type, -1)}
          disabled={paxCounts[type] === 0}
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Minus size={16} color="var(--text-primary)" />
        </button>
        <span style={{ width: '20px', textAlign: 'center', fontWeight: 600 }}>{paxCounts[type]}</span>
        <button 
          type="button"
          onClick={() => handlePaxChange(type, 1)}
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={16} color="var(--text-primary)" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>Book a Ticket</h1>
      
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>Port Closed</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>The port only operates until 9:00 PM. We can no longer accept new reservations for today's schedule. Please select a future date.</p>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-primary">Understood</button>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <form onSubmit={handleBook}>
          <div className="grid-2">
            
            {/* Left Column: Form Selections */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  <Calendar size={18} /> Travel Date
                </label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  <Clock size={18} /> Select Schedule
                </label>
                <select 
                  required
                  value={scheduleId}
                  onChange={(e) => setScheduleId(e.target.value)}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 500 }}>
                  <Users size={18} /> Passengers
                </label>
                
                {scheduleId ? (
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                    {renderPaxCounter('regular', 'Regular', `₱${selectedSchedule.basePrice}`)}
                    {renderPaxCounter('student', 'Student', `₱${selectedSchedule.discountedPrice} (Valid ID required)`)}
                    {renderPaxCounter('senior', 'Senior Citizen', `₱${selectedSchedule.discountedPrice} (Valid ID required)`)}
                    {renderPaxCounter('pwd', 'PWD', `₱${selectedSchedule.discountedPrice} (Valid ID required)`)}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '10px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Please select a schedule to view pricing.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Passenger Names & Totals */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                {totalPax > 0 ? (
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 500 }}>
                      <User size={18} /> Passenger Names (Required for Manifest)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {passengerNames.map((name, idx) => (
                        <input 
                          key={idx}
                          type="text"
                          placeholder={`Passenger ${idx + 1} Full Name`}
                          required
                          value={name}
                          onChange={(e) => {
                            const newNames = [...passengerNames];
                            newNames[idx] = e.target.value;
                            setPassengerNames(newNames);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                    Add passengers on the left to enter their names for the manifest.
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--card-bg)', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Passengers</p>
                    <h3 style={{ margin: 0 }}>{totalPax} Pax</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Price</p>
                    <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>₱{totalPrice}</h2>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={totalPax === 0 || !scheduleId || !date}>
                    Confirm Reservation
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
