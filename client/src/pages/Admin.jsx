import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';

const GCard = ({ children, className = '', style = {} }) => (
  <div className={`rounded-2xl ${className}`}
    style={{
      background: 'rgba(15,5,30,0.65)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,0,255,0.18)',
      ...style
    }}>
    {children}
  </div>
);

const StatPanel = ({ label, value, color, icon, sub }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
    className="rounded-2xl p-4 relative overflow-hidden"
    style={{
      background: `linear-gradient(135deg,${color}18,rgba(15,5,30,0.75))`,
      backdropFilter: 'blur(24px)',
      border: `1px solid ${color}35`,
      boxShadow: `0 0 24px ${color}12`
    }}>
    <div className="absolute -top-2 -right-2 text-5xl opacity-10">{icon}</div>
    <div className="font-mono text-[10px] tracking-widest mb-1" style={{ color: `${color}cc` }}>{label}</div>
    <div className="font-display font-black text-2xl sm:text-3xl" style={{ color, textShadow: `0 0 12px ${color}60` }}>{value}</div>
    {sub && <div className="font-mono text-[10px] text-gray-500 mt-1">{sub}</div>}
  </motion.div>
);

const NAV = [
  { id: 'overview', label: 'OVERVIEW', icon: '◈' },
  { id: 'users', label: 'USERS', icon: '👥' },
  { id: 'numbers', label: 'NUMBERS', icon: '📱' },
];

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sR, uR, nR] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/numbers')
      ]);
      setStats(sR.data);
      setUsers(uR.data.users);
      setNumbers(nR.data);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const handleBan = async id => {
    try {
      const res = await axios.put(`/api/admin/users/${id}/ban`);
      setUsers(p => p.map(u => u._id === id ? { ...u, banned: res.data.banned } : u));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async id => {
    if (!confirm('Permanently delete this user and all their data?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers(p => p.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handlePlanChange = async (id, plan) => {
    try {
      await axios.put(`/api/admin/users/${id}/plan`, { plan });
      setUsers(p => p.map(u => u._id === id ? { ...u, subscriptionPlan: plan } : u));
      toast.success(`Plan → ${plan.toUpperCase()}`);
    } catch { toast.error('Failed to update plan'); }
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const planColors = { free: '#00f5ff', pro: '#8b5cf6', enterprise: '#ff00ff' };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#06091a 0%,#120820 50%,#06091a 100%)' }}>
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50"
        style={{ background: 'linear-gradient(90deg,#ff00ff,#8b5cf6,#00f5ff)', boxShadow: '0 0 20px rgba(255,0,255,0.6)' }} />

      <div className="fixed inset-0 cyber-grid pointer-events-none z-0 opacity-30" />

      {/* Mobile backdrop */}
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
        animate={{ x: sidebarOpen ? 0 : -260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-60 z-40 flex flex-col lg:translate-x-0"
        style={{ background: 'rgba(8,3,18,0.96)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(255,0,255,0.15)' }}>

        {/* Logo */}
        <div className="p-5 pt-6 border-b border-[rgba(255,0,255,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={LOGO} className="w-9 h-9 rounded-xl object-cover" style={{ filter: 'drop-shadow(0 0 8px #ff00ff)' }} alt="CSP" />
              <div>
                <div className="font-display text-xs font-bold tracking-widest" style={{ color: '#ff00ff' }}>ADMIN</div>
                <div className="font-display text-xs font-bold text-white tracking-widest">CONTROL</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white">×</button>
          </div>
        </div>

        {/* Admin badge */}
        <div className="mx-3 mt-3 mb-2 rounded-xl p-3"
          style={{ background: 'rgba(255,0,255,0.08)', border: '1px solid rgba(255,0,255,0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'rgba(255,0,255,0.15)', border: '1px solid rgba(255,0,255,0.3)' }}>⚙️</div>
            <div>
              <div className="font-display text-xs text-white">{user?.username}</div>
              <div className="font-mono text-[9px]" style={{ color: '#ff00ff' }}>◆ SUPER ADMIN</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all"
              style={{
                background: tab === item.id ? 'rgba(255,0,255,0.1)' : 'transparent',
                borderLeft: tab === item.id ? '2px solid #ff00ff' : '2px solid transparent',
                color: tab === item.id ? '#ff00ff' : '#9ca3af'
              }}>
              <span>{item.icon}</span>
              <span className="font-mono text-xs tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-[rgba(255,0,255,0.08)] space-y-1">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
            <div className="px-4 py-3 rounded-xl font-mono text-xs tracking-widest text-[#00f5ff] flex items-center gap-3 hover:bg-[rgba(0,245,255,0.06)] transition-all">
              ← USER PANEL
            </div>
          </Link>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full px-4 py-3 rounded-xl font-mono text-xs tracking-widest text-red-400 flex items-center gap-3 hover:bg-red-500/10 transition-all">
            <span>⏻</span> LOGOUT
          </button>
        </div>
      </motion.aside>

      {/* ════ MAIN ════ */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 relative z-10">

        {/* Top bar */}
        <header className="sticky top-0.5 z-20 flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(8,3,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,0,255,0.12)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(p => !p)}
              className="w-9 h-9 rounded-xl flex items-center justify-center lg:hidden"
              style={{ background: 'rgba(255,0,255,0.08)', border: '1px solid rgba(255,0,255,0.2)', color: '#ff00ff' }}>
              ☰
            </button>
            <div>
              <div className="font-display text-sm tracking-widest" style={{ color: '#ff00ff' }}>ADMIN CONTROL CENTER</div>
              <div className="font-mono text-[10px] text-gray-600 hidden sm:block">CYBERSECPRO — CLASSIFIED ACCESS</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff00ff] animate-pulse" style={{ boxShadow: '0 0 6px #ff00ff' }} />
              <span className="font-mono text-[10px] text-gray-500 hidden sm:inline">ADMIN ONLINE</span>
            </div>
            <button onClick={fetchData}
              className="px-3 py-1.5 rounded-xl font-mono text-[10px] tracking-widest transition-all"
              style={{ border: '1px solid rgba(255,0,255,0.25)', color: '#ff00ff', background: 'rgba(255,0,255,0.06)' }}>
              ↻ REFRESH
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pb-24 lg:pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ══ OVERVIEW ══ */}
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-5">
                  <h2 className="font-display text-xl font-bold tracking-widest"
                    style={{ color: '#ff00ff', textShadow: '0 0 20px rgba(255,0,255,0.35)' }}>SYSTEM ANALYTICS</h2>
                  <p className="font-mono text-[10px] text-gray-500 mt-0.5">Global platform statistics</p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="cyber-spinner" style={{ borderTopColor: '#ff00ff' }} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <StatPanel label="TOTAL USERS" value={stats?.totalUsers || 0} color="#00f5ff" icon="👥" />
                      <StatPanel label="TOTAL NUMBERS" value={stats?.totalNumbers || 0} color="#8b5cf6" icon="📱" />
                      <StatPanel label="ONLINE NOW" value={stats?.onlineUsers || 0} color="#00ff88" icon="🟢" sub="Last 5 min" />
                      <StatPanel label="ACTIVE NUMBERS" value={stats?.activeNumbers || 0} color="#ffaa00" icon="⚡" />
                      <StatPanel label="BANNED USERS" value={stats?.bannedUsers || 0} color="#ff4444" icon="🚫" />
                    </div>

                    {/* Plan breakdown */}
                    <GCard className="p-5">
                      <h3 className="font-mono text-[10px] tracking-widest mb-4" style={{ color: '#ff00ff' }}>PLAN DISTRIBUTION</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {['free', 'pro', 'enterprise'].map(plan => {
                          const count = stats?.planBreakdown?.find(p => p._id === plan)?.count || 0;
                          const col = planColors[plan];
                          const total = stats?.totalUsers || 1;
                          return (
                            <div key={plan} className="text-center">
                              <div className="font-display text-2xl font-bold mb-1" style={{ color: col }}>{count}</div>
                              <div className="font-mono text-[10px] text-gray-500 mb-2">{plan.toUpperCase()}</div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(count / total) * 100}%` }}
                                  transition={{ duration: 1 }} className="h-full rounded-full"
                                  style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </GCard>

                    {/* Recent users - card list on mobile, table on desktop */}
                    <GCard>
                      <div className="px-4 py-3 border-b border-[rgba(255,0,255,0.1)]">
                        <span className="font-mono text-[10px] tracking-widest" style={{ color: '#ff00ff' }}>RECENT REGISTRATIONS</span>
                      </div>
                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y divide-[rgba(255,0,255,0.06)]">
                        {users.slice(0, 8).map(u => (
                          <div key={u._id} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-mono text-sm text-[#00f5ff] truncate">{u.username}</div>
                              <div className="font-mono text-[10px] text-gray-500 truncate">{u.email}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded"
                                style={{ color: planColors[u.subscriptionPlan] || '#00f5ff', border: '1px solid currentColor', background: 'rgba(0,0,0,0.3)' }}>
                                {u.subscriptionPlan?.toUpperCase()}
                              </span>
                              <span className={u.banned ? 'status-inactive' : 'status-active'}>
                                {u.banned ? 'BAN' : 'OK'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full cyber-table">
                          <thead><tr><th>USERNAME</th><th>EMAIL</th><th>PLAN</th><th>STATUS</th><th>JOINED</th></tr></thead>
                          <tbody>
                            {users.slice(0, 8).map((u, i) => (
                              <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                                <td className="text-[#00f5ff]">{u.username}</td>
                                <td className="text-gray-400 text-xs">{u.email}</td>
                                <td>
                                  <span className="font-mono text-xs px-2 py-0.5 rounded"
                                    style={{ color: planColors[u.subscriptionPlan] || '#00f5ff', border: '1px solid currentColor', background: 'rgba(0,0,0,0.3)' }}>
                                    {u.subscriptionPlan?.toUpperCase()}
                                  </span>
                                </td>
                                <td><span className={u.banned ? 'status-inactive' : 'status-active'}>{u.banned ? 'BANNED' : 'ACTIVE'}</span></td>
                                <td className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </GCard>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ USERS ══ */}
            {tab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-widest" style={{ color: '#ff00ff' }}>USER MANAGEMENT</h2>
                    <p className="font-mono text-[10px] text-gray-500 mt-0.5">{users.length} operators registered</p>
                  </div>
                </div>

                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input-neon rounded-xl w-full mb-4" placeholder="🔍  SEARCH USERS..."
                  style={{ borderColor: 'rgba(255,0,255,0.3)' }} />

                {loading ? (
                  <div className="flex justify-center py-20"><div className="cyber-spinner" style={{ borderTopColor: '#ff00ff' }} /></div>
                ) : filtered.length === 0 ? (
                  <GCard className="p-10 text-center">
                    <div className="text-4xl mb-3">👥</div>
                    <div className="font-mono text-xs text-gray-500">NO USERS FOUND</div>
                  </GCard>
                ) : (
                  <>
                    {/* Mobile card list */}
                    <div className="sm:hidden space-y-3">
                      {filtered.map((u, i) => (
                        <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="rounded-2xl p-4"
                          style={{ background: 'rgba(15,5,30,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,0,255,0.14)' }}>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <div className="font-mono text-sm text-[#00f5ff] font-bold truncate">{u.username}</div>
                              <div className="font-mono text-[10px] text-gray-500 truncate">{u.email}</div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="font-mono text-[9px] px-2 py-0.5 rounded"
                                  style={{ color: u.role === 'admin' ? '#ff00ff' : '#9ca3af', border: '1px solid currentColor', background: 'rgba(0,0,0,0.3)' }}>
                                  {u.role?.toUpperCase()}
                                </span>
                                <span className={u.banned ? 'status-inactive' : 'status-active'}>
                                  {u.banned ? 'BANNED' : 'ACTIVE'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <select value={u.subscriptionPlan} onChange={e => handlePlanChange(u._id, e.target.value)}
                                className="text-xs font-mono px-2 py-1.5 rounded-lg outline-none"
                                style={{ background: 'rgba(255,0,255,0.08)', border: '1px solid rgba(255,0,255,0.25)', color: planColors[u.subscriptionPlan] || '#fff' }}>
                                <option value="free" style={{ background: '#0a0a1a' }}>FREE</option>
                                <option value="pro" style={{ background: '#0a0a1a' }}>PRO</option>
                                <option value="enterprise" style={{ background: '#0a0a1a' }}>ENTERPRISE</option>
                              </select>
                            </div>
                          </div>
                          {u.role !== 'admin' && (
                            <div className="flex gap-2 pt-2 border-t border-[rgba(255,0,255,0.07)]">
                              <button onClick={() => handleBan(u._id)}
                                className="flex-1 py-2 rounded-xl font-mono text-xs transition-all"
                                style={{ background: u.banned ? 'rgba(0,255,136,0.08)' : 'rgba(255,170,0,0.08)', border: `1px solid ${u.banned ? 'rgba(0,255,136,0.25)' : 'rgba(255,170,0,0.25)'}`, color: u.banned ? '#00ff88' : '#ffaa00' }}>
                                {u.banned ? 'UNBAN' : 'BAN'}
                              </button>
                              <button onClick={() => handleDelete(u._id)}
                                className="flex-1 py-2 rounded-xl font-mono text-xs transition-all"
                                style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: '#ff4444' }}>
                                DELETE
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <GCard className="hidden sm:block overflow-x-auto">
                      <table className="w-full cyber-table min-w-[700px]">
                        <thead><tr><th>USERNAME</th><th>EMAIL</th><th>PLAN</th><th>ROLE</th><th>STATUS</th><th>JOINED</th><th className="text-right">ACTIONS</th></tr></thead>
                        <tbody>
                          {filtered.map((u, i) => (
                            <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                              <td className="text-[#00f5ff] font-bold">{u.username}</td>
                              <td className="text-gray-400 text-xs">{u.email}</td>
                              <td>
                                <select value={u.subscriptionPlan} onChange={e => handlePlanChange(u._id, e.target.value)}
                                  className="text-xs font-mono px-2 py-1 rounded outline-none"
                                  style={{ background: 'rgba(255,0,255,0.06)', border: '1px solid rgba(255,0,255,0.2)', color: planColors[u.subscriptionPlan] || '#fff' }}>
                                  <option value="free" style={{ background: '#0a0a1a' }}>FREE</option>
                                  <option value="pro" style={{ background: '#0a0a1a' }}>PRO</option>
                                  <option value="enterprise" style={{ background: '#0a0a1a' }}>ENTERPRISE</option>
                                </select>
                              </td>
                              <td>
                                <span className="font-mono text-xs" style={{ color: u.role === 'admin' ? '#ff00ff' : '#00f5ff' }}>
                                  {u.role?.toUpperCase()}
                                </span>
                              </td>
                              <td><span className={u.banned ? 'status-inactive' : 'status-active'}>{u.banned ? 'BANNED' : 'ACTIVE'}</span></td>
                              <td className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="text-right">
                                {u.role !== 'admin' && (
                                  <div className="flex gap-3 justify-end">
                                    <button onClick={() => handleBan(u._id)}
                                      className={`font-mono text-xs transition-colors ${u.banned ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'}`}>
                                      {u.banned ? 'UNBAN' : 'BAN'}
                                    </button>
                                    <button onClick={() => handleDelete(u._id)}
                                      className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors">
                                      DELETE
                                    </button>
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </GCard>
                  </>
                )}
              </motion.div>
            )}

            {/* ══ NUMBERS ══ */}
            {tab === 'numbers' && (
              <motion.div key="numbers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-5">
                  <h2 className="font-display text-xl font-bold tracking-widest" style={{ color: '#ff00ff' }}>ALL LINKED NUMBERS</h2>
                  <p className="font-mono text-[10px] text-gray-500 mt-0.5">{numbers.length} numbers in system</p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20"><div className="cyber-spinner" style={{ borderTopColor: '#ff00ff' }} /></div>
                ) : numbers.length === 0 ? (
                  <GCard className="p-10 text-center">
                    <div className="text-4xl mb-3">📱</div>
                    <div className="font-mono text-xs text-gray-500">NO NUMBERS IN SYSTEM</div>
                  </GCard>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-3">
                      {numbers.map((n, i) => (
                        <motion.div key={n._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="rounded-2xl p-4"
                          style={{ background: 'rgba(15,5,30,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,0,255,0.14)' }}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="font-mono text-sm text-[#00f5ff] truncate">{n.number}</div>
                              <div className="font-mono text-[10px] text-gray-300">{n.botName}</div>
                              <div className="font-mono text-[10px] text-[#8b5cf6] mt-0.5">Owner: {n.ownerId?.username || 'N/A'}</div>
                            </div>
                            <span className={n.status === 'active' ? 'status-active' : 'status-inactive'}>{n.status?.toUpperCase()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <GCard className="hidden sm:block overflow-x-auto">
                      <table className="w-full cyber-table min-w-[700px]">
                        <thead><tr><th>NUMBER</th><th>BOT NAME</th><th>OWNER</th><th>STATUS</th><th>LAST ACTIVE</th><th>DATE ADDED</th></tr></thead>
                        <tbody>
                          {numbers.map((n, i) => (
                            <motion.tr key={n._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                              <td className="text-[#00f5ff]">{n.number}</td>
                              <td className="text-gray-300">{n.botName}</td>
                              <td className="text-[#8b5cf6]">{n.ownerId?.username || 'N/A'}</td>
                              <td><span className={n.status === 'active' ? 'status-active' : 'status-inactive'}>{n.status?.toUpperCase()}</span></td>
                              <td className="text-gray-600 text-xs">{new Date(n.lastActive).toLocaleDateString()}</td>
                              <td className="text-gray-600 text-xs">{new Date(n.createdAt).toLocaleDateString()}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </GCard>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ════ MOBILE BOTTOM NAV ════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden flex"
        style={{ background: 'rgba(8,3,18,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,0,255,0.15)' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-all"
            style={{ color: tab === item.id ? '#ff00ff' : '#6b7280' }}>
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="font-mono text-[9px] tracking-widest">{item.label}</span>
            {tab === item.id && (
              <motion.div layoutId="admin-tab-ind" className="absolute top-0 h-0.5 w-10 rounded-full"
                style={{ background: '#ff00ff', boxShadow: '0 0 8px #ff00ff' }} />
            )}
          </button>
        ))}
        <Link to="/dashboard" className="flex-1 flex flex-col items-center justify-center py-3 gap-1" style={{ color: '#00f5ff' }}>
          <span className="text-xl leading-none">←</span>
          <span className="font-mono text-[9px] tracking-widest">USER</span>
        </Link>
      </nav>
    </div>
  );
}
