import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';

/* ─── Glassmorphism card ─── */
const GCard = ({ children, className = '', style = {} }) => (
  <div className={`rounded-2xl ${className}`}
    style={{
      background: 'rgba(10,20,60,0.55)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(0,245,255,0.18)',
      ...style
    }}>
    {children}
  </div>
);

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
    className="rounded-2xl p-4 relative overflow-hidden"
    style={{
      background: `linear-gradient(135deg, ${color}18, rgba(10,20,60,0.7))`,
      backdropFilter: 'blur(24px)',
      border: `1px solid ${color}35`,
      boxShadow: `0 0 24px ${color}15`
    }}>
    <div className="absolute -top-2 -right-2 text-5xl opacity-10">{icon}</div>
    <div className="font-mono text-[10px] tracking-widest mb-1" style={{ color: `${color}cc` }}>{label}</div>
    <div className="font-display font-bold text-2xl sm:text-3xl" style={{ color, textShadow: `0 0 12px ${color}60` }}>{value}</div>
    {sub && <div className="font-mono text-[10px] text-gray-500 mt-1">{sub}</div>}
  </motion.div>
);

/* ─── Plan limit modal ─── */
const PlanLimitModal = ({ onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
      className="w-full max-w-sm rounded-2xl p-6 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, rgba(255,0,0,0.12), rgba(6,9,26,0.98))', border: '1px solid rgba(255,68,68,0.4)' }}>
      <div className="text-5xl mb-3">🚫</div>
      <h2 className="font-display font-bold text-lg text-red-400 tracking-widest mb-2">PLAN LIMIT REACHED</h2>
      <p className="font-mono text-xs text-gray-400 mb-5 leading-relaxed">
        You've reached your FREE plan limit of 5 numbers.
      </p>
      <div className="rounded-xl px-4 py-3 mb-5" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)' }}>
        <div className="font-mono text-[10px] text-gray-400 mb-1 tracking-widest">CONTACT FOR UPGRADE</div>
        <a href="https://wa.me/923417022212" target="_blank" rel="noreferrer"
          className="font-display font-bold text-base" style={{ color: '#8b5cf6' }}>+923417022212</a>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-mono text-xs text-gray-400"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>DISMISS</button>
        <a href="https://wa.me/923417022212" target="_blank" rel="noreferrer" className="flex-1">
          <button className="w-full py-3 rounded-xl font-display text-xs tracking-widest text-white"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.5),rgba(255,0,255,0.3))', border: '1px solid rgba(139,92,246,0.5)' }}>
            📱 CONTACT NOW
          </button>
        </a>
      </div>
    </motion.div>
  </motion.div>
);

/* ─── Link Number Modal (with real pairing code) ─── */
const LinkModal = ({ onClose, onAdd }) => {
  const [step, setStep] = useState(1); // 1=form, 2=code
  const [form, setForm] = useState({ number: '', botName: '' });
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(300);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step === 2) {
      timerRef.current = setInterval(() => setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  const handleRequest = async e => {
    e.preventDefault();
    if (!form.number || !form.botName) return toast.error('All fields required');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/pairing/request', { phoneNumber: form.number });
      if (data.alreadyPaired) {
        // Save directly
        const res = await axios.post('/api/numbers', { number: form.number, botName: form.botName });
        onAdd(res.data);
        toast.success('NUMBER LINKED SUCCESSFULLY');
        onClose();
      } else {
        setCode(data.code);
        setStep(2);
      }
    } catch (err) {
      if (err.response?.data?.error === 'PLAN_LIMIT_REACHED') {
        toast.error('Plan limit reached');
        onClose();
      } else {
        toast.error(err.response?.data?.error || 'Failed to get pairing code');
      }
    } finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/numbers', { number: form.number, botName: form.botName });
      onAdd(res.data);
      toast.success('NUMBER LINKED SUCCESSFULLY');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to link number');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'rgba(10,20,60,0.95)', backdropFilter: 'blur(30px)', border: '1px solid rgba(0,245,255,0.25)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,245,255,0.1)]">
          <div className="font-display text-sm text-[#00f5ff] tracking-widest">
            {step === 1 ? 'LINK WhatsApp NUMBER' : 'ENTER PAIRING CODE'}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] text-[#00f5ff] tracking-widest block mb-2">
                    PHONE NUMBER (with country code)
                  </label>
                  <input value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
                    className="input-neon rounded-xl w-full" placeholder="923417022212" inputMode="tel" />
                  <p className="font-mono text-[10px] text-gray-600 mt-1">Example: 923417022212 (no + or spaces)</p>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[#00f5ff] tracking-widest block mb-2">BOT NAME</label>
                  <input value={form.botName} onChange={e => setForm(p => ({ ...p, botName: e.target.value }))}
                    className="input-neon rounded-xl w-full" placeholder="MY_BOT_ALPHA" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-display text-sm tracking-widest text-white"
                  style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.3),rgba(139,92,246,0.3))', border: '1px solid rgba(0,245,255,0.5)', boxShadow: '0 0 20px rgba(0,245,255,0.2)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="cyber-spinner w-5 h-5" />REQUESTING CODE...
                    </span>
                  ) : '⚡ GET PAIRING CODE'}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                {/* Code display */}
                <div className="rounded-2xl p-5 text-center"
                  style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.25)' }}>
                  <div className="font-mono text-[10px] text-gray-400 tracking-widest mb-3">YOUR PAIRING CODE</div>
                  <div className="font-display font-black text-3xl sm:text-4xl tracking-[8px]"
                    style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.8)' }}>
                    {code}
                  </div>
                  <div className="mt-3 font-mono text-sm" style={{ color: timer < 60 ? '#ff4444' : '#00ff88' }}>
                    ⏱ {fmt(timer)} remaining
                  </div>
                </div>

                {/* Steps */}
                <div className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div className="font-mono text-[10px] text-[#8b5cf6] tracking-widest mb-2">HOW TO LINK</div>
                  {[
                    'Open WhatsApp on your phone',
                    'Tap Menu (⋮) → Linked Devices',
                    'Tap "Link a Device"',
                    'Tap "Link with phone number instead"',
                    `Enter the code above: ${code}`,
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="font-display text-xs w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'rgba(139,92,246,0.3)', color: '#8b5cf6' }}>{i + 1}</span>
                      <span className="font-mono text-xs text-gray-300">{s}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-mono text-xs text-gray-400"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    ← BACK
                  </button>
                  <button onClick={handleConfirm} disabled={loading || timer === 0}
                    className="flex-2 px-6 py-3 rounded-xl font-display text-xs tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg,rgba(0,255,136,0.3),rgba(0,245,255,0.2))', border: '1px solid rgba(0,255,136,0.4)', flex: 2 }}>
                    {loading ? 'SAVING...' : '✓ CODE ENTERED — SAVE'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Nav items ─── */
const NAV = [
  { id: 'overview', label: 'HOME', icon: '◈' },
  { id: 'numbers', label: 'NUMBERS', icon: '📱' },
  { id: 'profile', label: 'PROFILE', icon: '👤' },
];

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
export default function Dashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [numbers, setNumbers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileEdit, setProfileEdit] = useState({ username: user?.username || '' });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nRes, sRes] = await Promise.all([axios.get('/api/numbers'), axios.get('/api/user/stats')]);
      setNumbers(nRes.data);
      setStats(sRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleAdd = n => {
    setNumbers(p => [n, ...p]);
    setStats(p => ({ ...p, total: (p?.total || 0) + 1, active: (p?.active || 0) + 1 }));
  };

  const handleDelete = async id => {
    if (!confirm('Delete this number?')) return;
    try {
      await axios.delete(`/api/numbers/${id}`);
      setNumbers(p => p.filter(n => n._id !== id));
      setStats(p => ({ ...p, total: p.total - 1 }));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async id => {
    try {
      const res = await axios.put(`/api/numbers/${id}/toggle`);
      setNumbers(p => p.map(n => n._id === id ? res.data : n));
    } catch { toast.error('Failed to toggle'); }
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await axios.put('/api/user/profile', { username: profileEdit.username });
      updateUser({ username: profileEdit.username });
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setProfileLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); toast.success('Logged out'); };

  const filtered = numbers.filter(n =>
    n.number?.toLowerCase().includes(search.toLowerCase()) ||
    n.botName?.toLowerCase().includes(search.toLowerCase())
  );

  const planColor = user?.subscriptionPlan === 'enterprise' ? '#ff00ff' : user?.subscriptionPlan === 'pro' ? '#8b5cf6' : '#00f5ff';

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#06091a 0%,#0d0820 50%,#060d1e 100%)' }}>
      {/* Background grid */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0 opacity-40" />

      {/* ── Modals ── */}
      <AnimatePresence>
        {showAdd && <LinkModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
        {showLimit && <PlanLimitModal onClose={() => setShowLimit(false)} />}
      </AnimatePresence>

      {/* ── Mobile overlay when sidebar open ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* ════ SIDEBAR ════ */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-64 z-40 flex flex-col lg:translate-x-0"
        style={{ background: 'rgba(6,9,26,0.92)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(0,245,255,0.15)' }}>

        {/* Logo area */}
        <div className="p-5 border-b border-[rgba(0,245,255,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={LOGO} className="w-9 h-9 rounded-lg object-cover" style={{ filter: 'drop-shadow(0 0 8px #00f5ff)' }} alt="CSP" />
              <div>
                <div className="font-display text-xs font-bold tracking-widest" style={{ color: '#00f5ff' }}>CYBERSEC</div>
                <div className="font-display text-xs font-bold text-white tracking-widest">PRO</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white text-lg">×</button>
          </div>
        </div>

        {/* User card */}
        <div className="mx-3 mt-3 mb-2 rounded-xl p-3"
          style={{ background: `linear-gradient(135deg,${planColor}12,rgba(10,20,60,0.6))`, border: `1px solid ${planColor}25` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: `${planColor}20`, border: `1.5px solid ${planColor}40` }}>👤</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm text-white truncate">{user?.username}</div>
              <div className="font-mono text-[10px] truncate" style={{ color: planColor }}>
                {(user?.subscriptionPlan || 'FREE').toUpperCase()} PLAN
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all"
              style={{
                background: tab === item.id ? 'rgba(0,245,255,0.1)' : 'transparent',
                borderLeft: tab === item.id ? '2px solid #00f5ff' : '2px solid transparent',
                color: tab === item.id ? '#00f5ff' : '#9ca3af'
              }}>
              <span className="text-base">{item.icon}</span>
              <span className="font-mono text-xs tracking-widest">{item.label}</span>
            </button>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setSidebarOpen(false)}>
              <div className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-[#ff00ff] hover:bg-[rgba(255,0,255,0.07)] transition-all">
                <span>⚙️</span><span className="font-mono text-xs tracking-widest">ADMIN PANEL</span>
              </div>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-[rgba(0,245,255,0.08)]">
          <button onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl font-mono text-xs tracking-widest text-red-400 flex items-center gap-3 hover:bg-red-500/10 transition-all">
            <span>⏻</span> LOGOUT
          </button>
        </div>
      </motion.aside>

      {/* ════ MAIN AREA ════ */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 relative z-10">

        {/* ── Top bar ── */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(6,9,26,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(p => !p)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#00f5ff] lg:hidden"
              style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)' }}>
              ☰
            </button>
            <div>
              <div className="font-display text-sm tracking-widest text-[#00f5ff]">
                {NAV.find(n => n.id === tab)?.label || 'DASHBOARD'}
              </div>
              <div className="font-mono text-[10px] text-gray-600 hidden sm:block">CYBERSECPRO CONTROL CENTER</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" style={{ boxShadow: '0 0 6px #00ff88' }} />
              <span className="font-mono text-[10px] text-gray-500 hidden sm:inline">ONLINE</span>
            </div>
            {/* Desktop user badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5"
              style={{ background: `${planColor}12`, border: `1px solid ${planColor}25` }}>
              <span className="font-mono text-[10px] truncate max-w-[80px]" style={{ color: planColor }}>{user?.username}</span>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 p-4 pb-24 lg:pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ══ OVERVIEW ══ */}
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-5">
                  <h2 className="font-display text-xl font-bold gradient-text tracking-widest">SYSTEM OVERVIEW</h2>
                  <p className="font-mono text-[10px] text-gray-500 mt-0.5">Real-time monitoring</p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20"><div className="cyber-spinner" /></div>
                ) : (
                  <div className="space-y-4">
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="TOTAL NUMBERS" value={stats?.total ?? 0} icon="📱" color="#00f5ff"
                        sub={`${(stats?.limit ?? 5) - (stats?.total ?? 0)} slots left`} />
                      <StatCard label="ACTIVE BOTS" value={stats?.active ?? 0} icon="⚡" color="#00ff88" />
                      <StatCard label="INACTIVE" value={stats?.inactive ?? 0} icon="💤" color="#ffaa00" />
                      <StatCard label="PLAN LIMIT" value={stats?.limit ?? 5} icon="🛡️" color="#8b5cf6"
                        sub={(stats?.plan || 'FREE').toUpperCase()} />
                    </div>

                    {/* Usage bar */}
                    <GCard className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest">PLAN USAGE</span>
                        <span className="font-mono text-xs text-gray-400">{stats?.total}/{stats?.limit}</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,245,255,0.08)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(((stats?.total || 0) / (stats?.limit || 5)) * 100, 100)}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: (stats?.total / stats?.limit) > 0.8
                              ? 'linear-gradient(90deg,#ffaa00,#ff4444)'
                              : 'linear-gradient(90deg,#00f5ff,#8b5cf6)',
                            boxShadow: '0 0 10px rgba(0,245,255,0.5)'
                          }} />
                      </div>
                      <div className="mt-2 font-mono text-[10px] text-gray-500">
                        {Math.round(((stats?.total || 0) / (stats?.limit || 5)) * 100)}% capacity used
                      </div>
                    </GCard>

                    {/* Quick link button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => stats?.total >= stats?.limit ? setShowLimit(true) : setShowAdd(true)}
                      className="w-full py-4 rounded-2xl font-display text-sm tracking-widest text-white"
                      style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.25),rgba(139,92,246,0.25))', border: '1px solid rgba(0,245,255,0.35)', boxShadow: '0 0 25px rgba(0,245,255,0.15)' }}>
                      ⚡ LINK NEW WHATSAPP NUMBER
                    </motion.button>

                    {/* Recent */}
                    <GCard>
                      <div className="flex justify-between items-center px-4 py-3 border-b border-[rgba(0,245,255,0.1)]">
                        <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest">RECENT NUMBERS</span>
                        <button onClick={() => setTab('numbers')} className="font-mono text-[10px] text-gray-500 hover:text-[#00f5ff]">VIEW ALL →</button>
                      </div>
                      {numbers.length === 0 ? (
                        <div className="text-center py-8 font-mono text-xs text-gray-600">NO NUMBERS LINKED YET</div>
                      ) : (
                        numbers.slice(0, 5).map(n => (
                          <div key={n._id} className="flex justify-between items-center px-4 py-3 border-b border-[rgba(0,245,255,0.05)] last:border-0">
                            <div>
                              <div className="font-mono text-sm text-white">{n.number}</div>
                              <div className="font-mono text-[10px] text-gray-500">{n.botName}</div>
                            </div>
                            <span className={n.status === 'active' ? 'status-active' : 'status-inactive'}>{n.status.toUpperCase()}</span>
                          </div>
                        ))
                      )}
                    </GCard>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ NUMBERS ══ */}
            {tab === 'numbers' && (
              <motion.div key="numbers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-display text-xl font-bold gradient-text tracking-widest">LINKED NUMBERS</h2>
                    <p className="font-mono text-[10px] text-gray-500 mt-0.5">{numbers.length} registered</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => stats?.total >= stats?.limit ? setShowLimit(true) : setShowAdd(true)}
                    className="px-4 py-2.5 rounded-xl font-display text-xs tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.25),rgba(139,92,246,0.25))', border: '1px solid rgba(0,245,255,0.35)' }}>
                    + LINK
                  </motion.button>
                </div>

                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input-neon rounded-xl w-full mb-4" placeholder="🔍  SEARCH NUMBERS..." />

                {loading ? (
                  <div className="flex justify-center py-20"><div className="cyber-spinner" /></div>
                ) : filtered.length === 0 ? (
                  <GCard className="p-10 text-center">
                    <div className="text-4xl mb-3">📱</div>
                    <div className="font-mono text-xs text-gray-500">{search ? 'NO RESULTS' : 'NO NUMBERS LINKED YET'}</div>
                  </GCard>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((n, i) => (
                      <motion.div key={n._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="rounded-2xl p-4"
                        style={{ background: 'rgba(10,20,60,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,245,255,0.14)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm text-white truncate">{n.number}</div>
                            <div className="font-mono text-[10px] text-[#00f5ff] mt-0.5">{n.botName}</div>
                            <div className="font-mono text-[10px] text-gray-600 mt-0.5">
                              Added {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                            <button onClick={() => handleToggle(n._id)}
                              className={n.status === 'active' ? 'status-active' : 'status-inactive'}>
                              {n.status.toUpperCase()}
                            </button>
                            <button onClick={() => handleDelete(n._id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/15 transition-all"
                              style={{ border: '1px solid rgba(255,68,68,0.25)' }}>
                              ✕
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ PROFILE ══ */}
            {tab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-5">
                  <h2 className="font-display text-xl font-bold gradient-text tracking-widest">OPERATOR PROFILE</h2>
                  <p className="font-mono text-[10px] text-gray-500 mt-0.5">Manage your account</p>
                </div>

                <div className="space-y-4 max-w-md">
                  {/* Avatar card */}
                  <GCard className="p-5">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ background: `${planColor}15`, border: `2px solid ${planColor}35` }}>👤</div>
                      <div>
                        <div className="font-display text-lg text-white">{user?.username}</div>
                        <div className="font-mono text-xs text-gray-400">{user?.email}</div>
                        <span className="inline-block mt-1 font-mono text-[10px] px-2 py-0.5 rounded-lg"
                          style={{ background: `${planColor}18`, border: `1px solid ${planColor}35`, color: planColor }}>
                          {(user?.subscriptionPlan || 'FREE').toUpperCase()} PLAN
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="font-mono text-[10px] text-[#00f5ff] tracking-widest block mb-2">USERNAME</label>
                        <input value={profileEdit.username} onChange={e => setProfileEdit(p => ({ ...p, username: e.target.value }))}
                          className="input-neon rounded-xl w-full" />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] text-[#00f5ff] tracking-widest block mb-2">EMAIL</label>
                        <input value={user?.email} disabled className="input-neon rounded-xl w-full opacity-50 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] text-[#00f5ff] tracking-widest block mb-2">MEMBER SINCE</label>
                        <div className="font-mono text-sm text-gray-400 px-4 py-3 rounded-xl"
                          style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.1)' }}>
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleProfileSave} disabled={profileLoading}
                        className="w-full py-3 rounded-xl font-display text-sm tracking-widest text-white"
                        style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.25),rgba(139,92,246,0.25))', border: '1px solid rgba(0,245,255,0.4)', boxShadow: '0 0 20px rgba(0,245,255,0.15)' }}>
                        {profileLoading ? 'SAVING...' : '💾 SAVE CHANGES'}
                      </motion.button>
                    </div>
                  </GCard>

                  {/* Admin link */}
                  {user?.role === 'admin' && (
                    <Link to="/admin">
                      <GCard className="p-4 flex items-center justify-between hover:border-[rgba(255,0,255,0.4)] transition-all cursor-pointer"
                        style={{ borderColor: 'rgba(255,0,255,0.25)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">⚙️</span>
                          <div>
                            <div className="font-display text-sm text-[#ff00ff]">ADMIN PANEL</div>
                            <div className="font-mono text-[10px] text-gray-500">Manage all users</div>
                          </div>
                        </div>
                        <span className="text-gray-500">→</span>
                      </GCard>
                    </Link>
                  )}

                  {/* Danger zone */}
                  <GCard className="p-4" style={{ borderColor: 'rgba(255,68,68,0.2)' }}>
                    <div className="font-display text-xs text-red-400 tracking-widest mb-3">DANGER ZONE</div>
                    <button onClick={handleLogout}
                      className="w-full py-3 rounded-xl font-mono text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      style={{ border: '1px solid rgba(255,68,68,0.25)' }}>
                      ⏻ LOGOUT
                    </button>
                  </GCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ════ MOBILE BOTTOM NAV ════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden flex"
        style={{ background: 'rgba(6,9,26,0.95)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(0,245,255,0.15)' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
            style={{ color: tab === item.id ? '#00f5ff' : '#6b7280' }}>
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="font-mono text-[9px] tracking-widest">{item.label}</span>
            {tab === item.id && (
              <motion.div layoutId="tab-indicator" className="absolute top-0 h-0.5 w-10 rounded-full"
                style={{ background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
            )}
          </button>
        ))}
        {user?.role === 'admin' && (
          <Link to="/admin" className="flex-1 flex flex-col items-center justify-center py-3 gap-1" style={{ color: '#ff00ff' }}>
            <span className="text-xl leading-none">⚙️</span>
            <span className="font-mono text-[9px] tracking-widest">ADMIN</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
