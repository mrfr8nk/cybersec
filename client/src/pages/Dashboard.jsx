import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';

const ParticleBg = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${p.alpha})`;
        ctx.fill();
      });
    };
    const id = setInterval(draw, 50);
    return () => clearInterval(id);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

const PlanLimitModal = ({ onClose, plan }) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
        className="relative max-w-md w-full mx-4 rounded-xl p-8 text-center overflow-hidden"
        style={{ background: 'linear-gradient(145deg, rgba(255,0,0,0.1), rgba(2,4,8,0.98))', border: '1px solid rgba(255,68,68,0.4)', boxShadow: '0 0 60px rgba(255,0,0,0.2)' }}>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500" />
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-5xl mb-4">🚫</motion.div>
        <h2 className="font-display font-bold text-xl text-red-400 tracking-widest mb-2">FREE PLAN LIMIT REACHED</h2>
        <p className="font-mono text-xs text-gray-400 mb-6 leading-relaxed">
          You have reached the maximum of 5 linked numbers for the FREE plan.<br />
          Upgrade to PRO for up to 25 numbers or ENTERPRISE for unlimited access.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 rounded font-mono text-xs text-gray-500 border border-gray-700 hover:border-gray-500 transition-all">
            DISMISS
          </button>
          <button className="flex-1 py-2 rounded font-display text-xs tracking-widest"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(255,0,255,0.2))', border: '1px solid rgba(139,92,246,0.5)', color: '#fff' }}>
            UPGRADE NOW
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const AddNumberModal = ({ onClose, onAdd }) => {
  const [data, setData] = useState({ number: '', botName: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!data.number || !data.botName) return toast.error('All fields required');
    setLoading(true);
    try {
      const res = await axios.post('/api/numbers', data);
      onAdd(res.data);
      toast.success('NUMBER LINKED SUCCESSFULLY');
      onClose();
    } catch (err) {
      if (err.response?.data?.error === 'PLAN_LIMIT_REACHED') {
        onClose();
        toast.error('Plan limit reached — upgrade required');
      } else {
        toast.error(err.response?.data?.error || 'Failed to link number');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="relative max-w-md w-full mx-4 glass neon-border rounded-xl p-8">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00f5ff]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f5ff]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00f5ff]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00f5ff]" />
        <h3 className="font-display text-lg text-[#00f5ff] tracking-widest mb-6">LINK NEW NUMBER</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-xs text-[#00f5ff] tracking-widest block mb-2">PHONE NUMBER</label>
            <input value={data.number} onChange={e => setData(p => ({ ...p, number: e.target.value }))}
              className="input-neon rounded w-full" placeholder="+1 (555) 000-0000" />
          </div>
          <div>
            <label className="font-mono text-xs text-[#00f5ff] tracking-widest block mb-2">BOT NAME</label>
            <input value={data.botName} onChange={e => setData(p => ({ ...p, botName: e.target.value }))}
              className="input-neon rounded w-full" placeholder="BOT_ALPHA" />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded font-mono text-xs text-gray-500 border border-gray-700 hover:border-gray-500 transition-all">CANCEL</button>
            <button type="submit" disabled={loading} className="flex-1 btn-neon-solid py-3 rounded font-display text-xs tracking-widest">
              {loading ? 'LINKING...' : '+ LINK NUMBER'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const StatCard = ({ label, value, icon, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
    className="glass rounded-xl p-5 card-hover relative overflow-hidden"
    style={{ border: `1px solid ${color}20`, boxShadow: `0 0 20px ${color}08` }}>
    <div className="absolute top-0 right-0 text-5xl opacity-5 p-2">{icon}</div>
    <div className="font-mono text-xs tracking-widest mb-2" style={{ color: `${color}99` }}>{label}</div>
    <div className="font-display font-bold text-3xl mb-1" style={{ color, textShadow: `0 0 10px ${color}50` }}>{value}</div>
    {sub && <div className="font-mono text-xs text-gray-600">{sub}</div>}
  </motion.div>
);

const NAV_ITEMS = [
  { id: 'overview', label: 'OVERVIEW', icon: '◈' },
  { id: 'numbers', label: 'NUMBERS', icon: '📱' },
  { id: 'profile', label: 'PROFILE', icon: '👤' },
];

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [numbers, setNumbers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileEdit, setProfileEdit] = useState({ username: user?.username || '' });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [numRes, statsRes] = await Promise.all([
        axios.get('/api/numbers'),
        axios.get('/api/user/stats')
      ]);
      setNumbers(numRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNumber = (num) => {
    setNumbers(p => [num, ...p]);
    setStats(p => ({ ...p, total: p.total + 1, active: p.active + 1 }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this number?')) return;
    try {
      await axios.delete(`/api/numbers/${id}`);
      setNumbers(p => p.filter(n => n._id !== id));
      setStats(p => ({ ...p, total: p.total - 1 }));
      toast.success('Number deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.put(`/api/numbers/${id}/toggle`);
      setNumbers(p => p.map(n => n._id === id ? res.data : n));
    } catch (err) {
      toast.error('Failed to toggle');
    }
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await axios.put('/api/user/profile', { username: profileEdit.username });
      updateUser({ username: profileEdit.username });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out');
  };

  const filteredNumbers = numbers.filter(n =>
    n.number.toLowerCase().includes(search.toLowerCase()) ||
    n.botName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020408] flex relative overflow-hidden">
      <ParticleBg />
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none z-0" />
      <AnimatePresence>{showAdd && <AddNumberModal onClose={() => setShowAdd(false)} onAdd={handleAddNumber} />}</AnimatePresence>
      {showLimit && <PlanLimitModal onClose={() => setShowLimit(false)} />}

      {/* Sidebar */}
      <motion.aside initial={{ x: 0 }} animate={{ x: sidebarOpen ? 0 : -220 }}
        className="fixed top-0 left-0 h-full w-56 z-40 flex flex-col"
        style={{ background: 'rgba(2,4,8,0.95)', borderRight: '1px solid rgba(0,245,255,0.1)', backdropFilter: 'blur(20px)' }}>

        {/* Logo */}
        <div className="p-5 border-b border-[rgba(0,245,255,0.1)]">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="CSP" className="w-9 h-9 object-contain rounded" style={{ filter: 'drop-shadow(0 0 6px #00f5ff)' }} />
            <div>
              <div className="font-display text-xs font-bold text-[#00f5ff] tracking-widest">CYBERSEC</div>
              <div className="font-display text-xs font-bold text-white tracking-widest">PRO</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-[rgba(0,245,255,0.05)]">
          <div className="font-mono text-xs text-gray-500 mb-1">OPERATOR</div>
          <div className="font-display text-sm text-white truncate">{user?.username}</div>
          <div className="mt-2">
            <span className="font-mono text-[9px] px-2 py-1 rounded"
              style={{
                background: user?.subscriptionPlan === 'pro' ? 'rgba(139,92,246,0.2)' : user?.subscriptionPlan === 'enterprise' ? 'rgba(255,0,255,0.2)' : 'rgba(0,245,255,0.1)',
                border: `1px solid ${user?.subscriptionPlan === 'pro' ? 'rgba(139,92,246,0.4)' : user?.subscriptionPlan === 'enterprise' ? 'rgba(255,0,255,0.4)' : 'rgba(0,245,255,0.3)'}`,
                color: user?.subscriptionPlan === 'pro' ? '#8b5cf6' : user?.subscriptionPlan === 'enterprise' ? '#ff00ff' : '#00f5ff'
              }}>
              {(user?.subscriptionPlan || 'FREE').toUpperCase()} PLAN
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`sidebar-item w-full text-left px-4 py-3 rounded flex items-center gap-3 ${activeTab === item.id ? 'active' : ''}`}>
              <span>{item.icon}</span>
              <span className="font-mono text-xs tracking-widest">{item.label}</span>
            </button>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin">
              <div className="sidebar-item w-full text-left px-4 py-3 rounded flex items-center gap-3 text-[#ff00ff]">
                <span>⚙️</span>
                <span className="font-mono text-xs tracking-widest">ADMIN</span>
              </div>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[rgba(0,245,255,0.05)]">
          <button onClick={handleLogout}
            className="w-full px-4 py-3 rounded font-mono text-xs tracking-widest text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3">
            <span>⏻</span> LOGOUT
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-0'} relative z-10`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(2,4,8,0.9)', borderBottom: '1px solid rgba(0,245,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(p => !p)} className="text-[#00f5ff] hover:text-white transition-colors text-lg">☰</button>
            <div>
              <div className="font-display text-sm tracking-widest text-[#00f5ff]">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'DASHBOARD'}
              </div>
              <div className="font-mono text-xs text-gray-600">CYBERSECPRO CONTROL CENTER</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" style={{ boxShadow: '0 0 6px #00ff88' }} />
              <span className="font-mono text-xs text-gray-500">ONLINE</span>
            </div>
            <div className="font-mono text-xs text-gray-600 hidden md:block">{new Date().toLocaleTimeString()}</div>
          </div>
        </header>

        <div className="p-6">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold gradient-text tracking-widest">SYSTEM OVERVIEW</h2>
                <p className="font-mono text-xs text-gray-600 mt-1">Real-time monitoring dashboard</p>
              </div>
              {loading ? (
                <div className="flex justify-center py-20"><div className="cyber-spinner" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="TOTAL NUMBERS" value={stats?.total || 0} icon="📱" color="#00f5ff" sub={`${stats?.limit - (stats?.total || 0)} slots remaining`} />
                    <StatCard label="ACTIVE BOTS" value={stats?.active || 0} icon="⚡" color="#00ff88" />
                    <StatCard label="INACTIVE" value={stats?.inactive || 0} icon="💤" color="#ffaa00" />
                    <StatCard label="PLAN LIMIT" value={stats?.limit || 5} icon="🛡️" color="#8b5cf6" sub={(stats?.plan || 'free').toUpperCase()} />
                  </div>

                  {/* Usage bar */}
                  <div className="glass neon-border rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-xs text-[#00f5ff] tracking-widest">PLAN USAGE</span>
                      <span className="font-mono text-xs text-gray-400">{stats?.total}/{stats?.limit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(0,245,255,0.1)] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((stats?.total || 0) / (stats?.limit || 5)) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: (stats?.total / stats?.limit) > 0.8
                            ? 'linear-gradient(90deg, #ffaa00, #ff4444)'
                            : 'linear-gradient(90deg, #00f5ff, #8b5cf6)',
                          boxShadow: '0 0 10px rgba(0,245,255,0.5)'
                        }} />
                    </div>
                    <div className="mt-2 font-mono text-xs text-gray-600">
                      {Math.round(((stats?.total || 0) / (stats?.limit || 5)) * 100)}% capacity used
                    </div>
                  </div>

                  {/* Recent numbers */}
                  <div className="glass neon-border rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-mono text-xs text-[#00f5ff] tracking-widest">RECENT LINKED NUMBERS</span>
                      <button onClick={() => setActiveTab('numbers')} className="font-mono text-xs text-gray-500 hover:text-[#00f5ff] transition-colors">VIEW ALL →</button>
                    </div>
                    {numbers.slice(0, 5).map(n => (
                      <div key={n._id} className="flex justify-between items-center py-3 border-b border-[rgba(0,245,255,0.05)]">
                        <div>
                          <div className="font-mono text-sm text-gray-300">{n.number}</div>
                          <div className="font-mono text-xs text-gray-600">{n.botName}</div>
                        </div>
                        <span className={n.status === 'active' ? 'status-active' : 'status-inactive'}>{n.status.toUpperCase()}</span>
                      </div>
                    ))}
                    {numbers.length === 0 && (
                      <div className="text-center py-8 font-mono text-xs text-gray-600">NO NUMBERS LINKED — INITIALIZE YOUR FIRST BOT</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Numbers Tab */}
          {activeTab === 'numbers' && (
            <div>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
                <div>
                  <h2 className="font-display text-2xl font-bold gradient-text tracking-widest">LINKED NUMBERS</h2>
                  <p className="font-mono text-xs text-gray-600 mt-1">{numbers.length} numbers registered</p>
                </div>
                <button onClick={() => {
                  if (stats && stats.total >= stats.limit) { setShowLimit(true); }
                  else { setShowAdd(true); }
                }} className="btn-neon-solid px-6 py-3 rounded font-display text-xs tracking-widest">
                  + LINK NUMBER
                </button>
              </div>

              <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input-neon rounded w-full max-w-sm" placeholder="SEARCH NUMBERS..." />
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><div className="cyber-spinner" /></div>
              ) : (
                <div className="glass neon-border rounded-xl overflow-hidden">
                  <table className="w-full cyber-table">
                    <thead>
                      <tr>
                        <th className="text-left">NUMBER</th>
                        <th className="text-left">BOT NAME</th>
                        <th className="text-left">STATUS</th>
                        <th className="text-left hidden md:table-cell">DATE ADDED</th>
                        <th className="text-left hidden md:table-cell">LAST ACTIVE</th>
                        <th className="text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNumbers.map((n, i) => (
                        <motion.tr key={n._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                          <td className="text-gray-300">{n.number}</td>
                          <td className="text-[#00f5ff]">{n.botName}</td>
                          <td>
                            <button onClick={() => handleToggle(n._id)}
                              className={`${n.status === 'active' ? 'status-active' : 'status-inactive'} cursor-pointer hover:opacity-80 transition-opacity`}>
                              {n.status.toUpperCase()}
                            </button>
                          </td>
                          <td className="text-gray-600 hidden md:table-cell text-xs">{new Date(n.createdAt).toLocaleDateString()}</td>
                          <td className="text-gray-600 hidden md:table-cell text-xs">{new Date(n.lastActive).toLocaleDateString()}</td>
                          <td className="text-right">
                            <button onClick={() => handleDelete(n._id)}
                              className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors ml-4">
                              DELETE
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredNumbers.length === 0 && (
                    <div className="text-center py-12 font-mono text-xs text-gray-600">
                      {search ? 'NO RESULTS FOUND' : 'NO NUMBERS LINKED YET'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold gradient-text tracking-widest">OPERATOR PROFILE</h2>
                <p className="font-mono text-xs text-gray-600 mt-1">Manage your account</p>
              </div>

              <div className="glass neon-border rounded-xl p-8 mb-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ background: 'rgba(0,245,255,0.1)', border: '2px solid rgba(0,245,255,0.3)', boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}>
                    👤
                  </div>
                  <div>
                    <div className="font-display text-xl text-white">{user?.username}</div>
                    <div className="font-mono text-xs text-gray-500">{user?.email}</div>
                    <div className="mt-2">
                      <span className="font-mono text-xs px-3 py-1 rounded"
                        style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }}>
                        {(user?.subscriptionPlan || 'FREE').toUpperCase()} PLAN
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-xs text-[#00f5ff] tracking-widest block mb-2">USERNAME</label>
                    <input value={profileEdit.username} onChange={e => setProfileEdit(p => ({ ...p, username: e.target.value }))}
                      className="input-neon rounded w-full" />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-[#00f5ff] tracking-widest block mb-2">EMAIL (READ-ONLY)</label>
                    <input value={user?.email} disabled className="input-neon rounded w-full opacity-50 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-[#00f5ff] tracking-widest block mb-2">MEMBER SINCE</label>
                    <div className="font-mono text-sm text-gray-400 px-4 py-3 glass rounded">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                  <button onClick={handleProfileSave} disabled={profileLoading}
                    className="btn-neon-solid px-8 py-3 rounded font-display text-xs tracking-widest">
                    {profileLoading ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </div>

              <div className="glass rounded-xl p-6" style={{ border: '1px solid rgba(255,68,68,0.2)' }}>
                <h3 className="font-display text-sm text-red-400 tracking-widest mb-4">DANGER ZONE</h3>
                <button onClick={handleLogout}
                  className="px-6 py-2 rounded font-mono text-xs text-red-400 transition-all"
                  style={{ border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.05)' }}>
                  LOGOUT FROM ALL SESSIONS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
