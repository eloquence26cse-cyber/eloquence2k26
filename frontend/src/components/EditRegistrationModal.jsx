import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FaTimes,
  FaSave,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaUniversity,
  FaGraduationCap,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaReceipt,
  FaTrash,
  FaPlus,
  FaBolt,
  FaCopy,
  FaCheck,
  FaClock,
  FaShieldAlt
} from 'react-icons/fa';
import { getApiUrl } from '../config/api';

export default function EditRegistrationModal({
  isOpen,
  onClose,
  registration,
  eventsList = [],
  token,
  isDark = false,
  onSuccess
}) {
  const [activeSection, setActiveSection] = useState('participant'); // 'participant' | 'event' | 'payment'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');

  // Event & Team
  const [eventId, setEventId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);

  // Payment & Status
  const [totalFee, setTotalFee] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [registrationStatus, setRegistrationStatus] = useState('CONFIRMED');
  const [upiUtr, setUpiUtr] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('pending');
  const [flagReason, setFlagReason] = useState('');

  // Initialize form when registration changes
  useEffect(() => {
    if (!registration) return;

    setFullName(registration.fullName || registration.full_name || '');
    setEmail(registration.email || '');
    setPhone(registration.phone || '');
    setCollege(registration.college || '');
    setDepartment(registration.department || '');
    setYear(registration.year || '');

    setEventId(registration.eventId || registration.event_id || '');
    setTeamName(registration.teamName || registration.team_name || '');

    // Normalize team members
    const members = Array.isArray(registration.teamMembers) && registration.teamMembers.length > 0
      ? registration.teamMembers
      : (Array.isArray(registration.registration_members) && registration.registration_members.length > 0
          ? registration.registration_members.map((m, i) => ({
              id: m.id || i,
              name: m.member_name || m.name || m.fullName || `Member ${i + 2}`,
              email: m.email || '',
              phone: m.phone || '',
              college: m.college || registration.college || '',
              department: m.department || registration.department || '',
              year: m.year || registration.year || ''
            }))
          : []);

    setTeamMembers(
      members.map((m, i) => ({
        id: m.id || i,
        name: typeof m === 'string' ? m : (m.name || m.fullName || m.member_name || ''),
        email: m.email || '',
        phone: m.phone || '',
        college: m.college || registration.college || '',
        department: m.department || registration.department || '',
        year: m.year || registration.year || ''
      }))
    );

    setTotalFee(Number(registration.totalAmount ?? registration.totalFee ?? registration.total_fee ?? 0));
    setPaymentStatus(String(registration.paymentStatus || registration.payment_status || 'PENDING').toUpperCase());
    setPaymentMethod(String(registration.paymentMethod || registration.payment_method || 'ONLINE').toUpperCase());
    setRegistrationStatus(String(registration.registrationStatus || registration.registration_status || 'CONFIRMED').toUpperCase());
    setUpiUtr(registration.upiUtr || registration.upi_utr || registration.transactionId || registration.transaction_id || '');
    setAttendanceStatus(String(registration.attendanceStatus || registration.attendance_status || 'pending').toLowerCase());
    setFlagReason(registration.flagReason || registration.flag_reason || '');
    setActiveSection('participant');
  }, [registration, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !registration) return null;

  const ticketCode = registration.ticketCode || registration.ticket_code || registration.id || 'N/A';
  const selectedEvent = eventsList.find((e) => e.id === eventId);
  const isTeamEvent = Boolean(selectedEvent?.is_team || selectedEvent?.isTeam || (selectedEvent?.max_members > 1) || (selectedEvent?.maxMembers > 1) || teamMembers.length > 0 || teamName);

  const handleAddMember = () => {
    const maxMembers = Number(selectedEvent?.max_members || selectedEvent?.maxMembers || 4);
    if (teamMembers.length + 1 >= maxMembers) {
      toast.error(`Event allows a maximum of ${maxMembers} members per team.`);
      return;
    }
    setTeamMembers([
      ...teamMembers,
      {
        id: Date.now(),
        name: '',
        email: '',
        phone: '',
        college: college || '',
        department: department || '',
        year: year || ''
      }
    ]);
  };

  const handleUpdateMember = (idx, field, val) => {
    setTeamMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveMember = (idx) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCopyUtr = () => {
    if (!upiUtr) return;
    navigator.clipboard.writeText(upiUtr);
    setCopiedUtr(true);
    toast.success('UTR reference copied');
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Participant name is required');
      setActiveSection('participant');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid email address is required');
      setActiveSection('participant');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      toast.error('Valid 10-digit mobile number is required');
      setActiveSection('participant');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Saving registration updates...');

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, '').slice(-10),
      college: college.trim(),
      department: department.trim(),
      year: year.trim(),
      eventId,
      teamName: teamName.trim() || null,
      teamMembers: teamMembers.filter((m) => m.name && m.name.trim()),
      membersCount: (teamMembers.filter((m) => m.name && m.name.trim()).length) + 1,
      totalFee: Number(totalFee || 0),
      paymentStatus: paymentStatus.toUpperCase(),
      paymentMethod: paymentMethod.toUpperCase(),
      registrationStatus: registrationStatus.toUpperCase(),
      upiUtr: upiUtr.trim(),
      attendanceStatus: attendanceStatus.toLowerCase(),
      isVerified: paymentStatus.toUpperCase() === 'VERIFIED',
      flagReason: paymentStatus.toUpperCase() === 'REJECTED' ? (flagReason || 'Flagged by admin') : null
    };

    try {
      const idToUpdate = registration.id || registration.ticketCode || registration.ticket_code;
      const res = await fetch(getApiUrl(`/api/admin/registrations/${encodeURIComponent(idToUpdate)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Registration details updated successfully!', { id: toastId });
        if (onSuccess) onSuccess(data.data || { ...registration, ...payload });
        onClose();
      } else {
        toast.error(data.message || 'Failed to update registration', { id: toastId });
      }
    } catch (err) {
      console.error('Update registration error:', err);
      toast.error('Network error updating registration', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Styles
  const S = {
    overlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'modalFadeIn 0.2s ease-out'
    },
    modal: {
      width: '100%',
      maxWidth: '780px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      borderRadius: '18px',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      boxShadow: isDark
        ? '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(37, 99, 235, 0.2)'
        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden'
    },
    header: {
      padding: '1.25rem 1.75rem',
      borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc'
    },
    tabsBar: {
      display: 'flex',
      gap: '4px',
      padding: '0.65rem 1.75rem',
      background: isDark ? '#111827' : '#f1f5f9',
      borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      overflowX: 'auto'
    },
    tabBtn: (active) => ({
      padding: '0.55rem 1rem',
      borderRadius: '8px',
      fontSize: '0.84rem',
      fontWeight: '700',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
      background: active ? '#2563eb' : 'transparent',
      color: active ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')
    }),
    body: {
      padding: '1.5rem 1.75rem',
      overflowY: 'auto',
      flex: 1
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.15rem',
      marginBottom: '1.15rem'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem'
    },
    label: {
      fontSize: '0.78rem',
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#334155',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    },
    input: {
      width: '100%',
      padding: '0.65rem 0.85rem',
      borderRadius: '8px',
      border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '0.9rem',
      outline: 'none',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '0.65rem 0.85rem',
      borderRadius: '8px',
      border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '0.9rem',
      outline: 'none',
      boxSizing: 'border-box',
      cursor: 'pointer'
    },
    footer: {
      padding: '1.15rem 1.75rem',
      borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '0.75rem',
      background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc'
    },
    closeBtn: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
      background: 'transparent',
      color: isDark ? '#94a3b8' : '#64748b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                Edit Participant Registration
              </h3>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.76rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isDark ? '#1e293b' : '#e0f2fe',
                color: isDark ? '#38bdf8' : '#0369a1',
                border: isDark ? '1px solid #0284c7' : '1px solid #bae6fd'
              }}>
                {ticketCode}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
              Update registration details, event enrollment, team squad, and payment status.
            </p>
          </div>
          <button style={S.closeBtn} onClick={onClose} title="Close (Esc)">
            <FaTimes size={13} />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div style={S.tabsBar}>
          <button
            type="button"
            onClick={() => setActiveSection('participant')}
            style={S.tabBtn(activeSection === 'participant')}
          >
            <FaUser size={12} />
            <span>1. Participant Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('event')}
            style={S.tabBtn(activeSection === 'event')}
          >
            <FaUsers size={12} />
            <span>2. Event &amp; Team ({teamMembers.length + 1})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('payment')}
            style={S.tabBtn(activeSection === 'payment')}
          >
            <FaReceipt size={12} />
            <span>3. Payment &amp; Status</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={S.body}>
            {/* ── SECTION 1: PARTICIPANT PERSONAL DETAILS ── */}
            {activeSection === 'participant' && (
              <div>
                <div style={S.grid2}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaUser size={11} /> Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      style={S.input}
                    />
                  </div>

                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaEnvelope size={11} /> Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. participant@gmail.com"
                      style={S.input}
                    />
                  </div>
                </div>

                <div style={S.grid2}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaPhoneAlt size={11} /> Phone Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      style={S.input}
                    />
                  </div>

                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaUniversity size={11} /> College Name
                    </label>
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. University College of Engineering"
                      style={S.input}
                    />
                  </div>
                </div>

                <div style={S.grid2}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaGraduationCap size={11} /> Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. BE CSE / BTech AIDS"
                      style={S.input}
                    />
                  </div>

                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaCalendarAlt size={11} /> Year of Study
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      style={S.select}
                    >
                      <option value="">-- Select Year --</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 2: EVENT & TEAM MEMBERS ── */}
            {activeSection === 'event' && (
              <div>
                <div style={S.grid2}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaBolt size={11} /> Enrolled Event <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      style={S.select}
                    >
                      <option value="">-- Select Event --</option>
                      {eventsList.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          [{ev.category?.toUpperCase()}] {ev.name} ({ev.fee || '₹100'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaUsers size={11} /> Team Name {isTeamEvent ? '' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Cyber Ninjas"
                      style={S.input}
                    />
                  </div>
                </div>

                {/* Team Members List */}
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800' }}>
                        Team Squad Members ({teamMembers.length + 1} Total)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                        Team Leader: <strong>{fullName || 'Primary Participant'}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <FaPlus size={10} /> Add Member
                    </button>
                  </div>

                  {teamMembers.length === 0 ? (
                    <div style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      background: isDark ? '#1e293b' : '#f8fafc',
                      borderRadius: '10px',
                      border: isDark ? '1px dashed #334155' : '1px dashed #cbd5e1',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.85rem'
                    }}>
                      No additional team members added. Click &quot;Add Member&quot; if this is a team event.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {teamMembers.map((member, idx) => (
                        <div
                          key={member.id || idx}
                          style={{
                            padding: '0.9rem 1rem',
                            background: isDark ? '#1e293b' : '#f8fafc',
                            borderRadius: '10px',
                            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#38bdf8' : '#0284c7' }}>
                              Member #{idx + 2}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.75rem'
                              }}
                              title="Remove member"
                            >
                              <FaTrash size={10} /> Remove
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                            <input
                              type="text"
                              placeholder="Member Name *"
                              value={member.name}
                              onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                              style={{ ...S.input, padding: '0.45rem 0.7rem', fontSize: '0.82rem' }}
                            />
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={member.email}
                              onChange={(e) => handleUpdateMember(idx, 'email', e.target.value)}
                              style={{ ...S.input, padding: '0.45rem 0.7rem', fontSize: '0.82rem' }}
                            />
                            <input
                              type="tel"
                              placeholder="Phone Number"
                              value={member.phone}
                              onChange={(e) => handleUpdateMember(idx, 'phone', e.target.value)}
                              maxLength={10}
                              style={{ ...S.input, padding: '0.45rem 0.7rem', fontSize: '0.82rem' }}
                            />
                            <input
                              type="text"
                              placeholder="College"
                              value={member.college}
                              onChange={(e) => handleUpdateMember(idx, 'college', e.target.value)}
                              style={{ ...S.input, padding: '0.45rem 0.7rem', fontSize: '0.82rem' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SECTION 3: PAYMENT, UTR & STATUS ── */}
            {activeSection === 'payment' && (
              <div>
                <div style={S.grid2}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaMoneyBillWave size={11} /> Fee Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={totalFee}
                      onChange={(e) => setTotalFee(e.target.value)}
                      style={S.input}
                    />
                  </div>

                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={S.select}
                    >
                      <option value="ONLINE">ONLINE (Gateway / Scan)</option>
                      <option value="UPI_QR">UPI_QR (Direct UTR Reference)</option>
                      <option value="OFFLINE">OFFLINE (Registration Desk Cash)</option>
                      <option value="FREE">FREE PASS (Zero Entry Fee)</option>
                    </select>
                  </div>
                </div>

                <div style={S.grid2}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaReceipt size={11} /> UPI / UTR Reference No.
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={upiUtr}
                        onChange={(e) => setUpiUtr(e.target.value)}
                        placeholder="12-digit UPI UTR / Transaction Ref"
                        style={{ ...S.input, fontFamily: 'monospace' }}
                      />
                      {upiUtr && (
                        <button
                          type="button"
                          onClick={handleCopyUtr}
                          style={{
                            padding: '0 0.85rem',
                            borderRadius: '8px',
                            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                            background: isDark ? '#1e293b' : '#f1f5f9',
                            color: copiedUtr ? '#10b981' : (isDark ? '#cbd5e1' : '#475569'),
                            cursor: 'pointer'
                          }}
                          title="Copy UTR"
                        >
                          {copiedUtr ? <FaCheck size={12} /> : <FaCopy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      style={{
                        ...S.select,
                        fontWeight: '700',
                        color:
                          paymentStatus === 'VERIFIED'
                            ? '#10b981'
                            : paymentStatus === 'REJECTED'
                            ? '#ef4444'
                            : '#f59e0b'
                      }}
                    >
                      <option value="PENDING">⏳ PENDING (Awaiting Audit)</option>
                      <option value="VERIFIED">✅ VERIFIED (Confirmed &amp; Approved)</option>
                      <option value="REJECTED">❌ REJECTED (Disputed / Invalid UTR)</option>
                    </select>
                  </div>
                </div>

                <div style={S.grid2}>
                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaShieldAlt size={11} /> Registration Status
                    </label>
                    <select
                      value={registrationStatus}
                      onChange={(e) => setRegistrationStatus(e.target.value)}
                      style={S.select}
                    >
                      <option value="CONFIRMED">CONFIRMED (Active Admission)</option>
                      <option value="CANCELLED">CANCELLED (Revoked)</option>
                    </select>
                  </div>

                  <div style={S.inputGroup}>
                    <label style={S.label}>
                      <FaClock size={11} /> On-Site Check-In Status
                    </label>
                    <select
                      value={attendanceStatus}
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                      style={S.select}
                    >
                      <option value="pending">PENDING (Not Reported Yet)</option>
                      <option value="checked_in">CHECKED IN (Admitted at Venue)</option>
                    </select>
                  </div>
                </div>

                {paymentStatus === 'REJECTED' && (
                  <div style={{ ...S.inputGroup, marginTop: '0.5rem' }}>
                    <label style={{ ...S.label, color: '#ef4444' }}>
                      Rejection / Flag Reason
                    </label>
                    <input
                      type="text"
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="e.g. UTR belongs to another person / Fake screenshot"
                      style={{ ...S.input, borderColor: '#ef4444' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div style={S.footer}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#cbd5e1' : '#475569',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: '800',
                letterSpacing: '0.03em',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <FaSave size={13} />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
