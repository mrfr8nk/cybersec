import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';

const StatPanel = ({ label, value, color, icon, sub }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
    className="glass rounded-xl p-5 relative overflow-hidden card-hover"
    style={{ border: `1px solid ${color}25`, boxShadow: `0 0 20px ${color}08` }}>
    <div className="absolute top-2 right-3 text-4xl opacity-10">{icon}</div>
    <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: `${color}aa` }}>{label}</div>
    <div className="font-display font-black text-4xl mb-1" style={{ color, textShadow: `0 0 15px ${color}60` }}>{value}</div>
    {sub && <div className="font-mono text-xs text-gray-600">{sub}</div>}
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
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, numsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/numbers')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setNumbers(numsRes.data);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id) => {
    try {
      const res = await axios.put(`/api/admin/users/${id}/ban`);
      setUsers(p => p.map(u => u._id === id ? { ...u, banned: res.data.banned } : u));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user and all their data?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers(p => p.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handlePlanChange = async (id, plan) => {
    try {
      await axios.put(`/api/admin/users/${id}/plan`, { plan });
      setUsers(p => p.map(u => u._id === id ? { ...u, subscriptionPlan: plan } : u));
      toast.success(`Plan updated to ${plan}`);
    } catch (err) {
      toast.error('Failed to update plan');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020408] flex relative overflow-hidden">
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{ background: 'linear-gradient(90deg, #ff00ff, #00f5ff, #8b5cf6)', boxShadow: '0 0 20px rgba(255,0,255,0.5)' }} />

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-56 z-40 flex flex-col"
        style={{ background: 'rgba(2,4,8,0.97)', borderRight: '1px solid rgba(255,0,255,0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="p-5 border-b border-[rgba(255,0,255,0.1)]">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="CSP" className="w-9 h-9 object-contain rounded" style={{ filter: 'drop-shadow(0 0 6px #ff00ff)' }} />
            <div>
              <div className="font-display text-xs font-bold text-[#ff00ff] tracking-widest">ADMIN</div>
              <div className="font-display text-xs font-bold text-white tracking-widest">CONTROL</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[rgba(255,0,255,0.05)]">
          <div className="font-mono text-[9px] text-gray-600 mb-1">LOGGED IN AS</div>
          <div className="font-display text-xs text-[#ff00ff]">{user?.username}</div>
          <div className="font-mono text-[9px] text-red-400 mt-1">◆ SUPER ADMIN</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`sidebar-item w-full text-left px-4 py-3 rounded flex items-center gap-3 ${activeTab === item.id ? 'active' : ''}`}
              style={activeTab === item.id ? { borderLeftColor: '#ff00ff', color: '#ff00ff', background: 'rgba(255,0,255,0.05)' } : {}}>
              <span>{item.icon}</span>
              <span className="font-mono text-xs tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-1 border-t border-[rgba(255,0,255,0.05)]">
          <Link to="/dashboard">
            <div className="w-full px-4 py-3 rounded font-mono text-xs tracking-widest text-[#00f5ff] hover:bg-[rgba(0,245,255,0.05)] transition-all flex items-center gap-3">
              <span>←</span> USER PANEL
            </div>
          </Link>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full px-4 py-3 rounded font-mono text-xs tracking-widest text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3">
            <span>⏻</span> LOGOUT
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-56 relative z-10">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(2,4,8,0.93)', borderBottom: '1px solid rgba(255,0,255,0.1)', backdropFilter: 'blur(20px)' }}>
          <div>
            <div className="font-display text-sm tracking-widest text-[#ff00ff]">ADMIN CONTROL CENTER</div>
            <div className="font-mono text-xs text-gray-600">CYBERSECPRO — CLASSIFIED ACCESS</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff00ff] animate-pulse" style={{ boxShadow: '0 0 6px #ff00ff' }} />
              <span className="font-mono text-xs text-gray-500">ADMIN ONLINE</span>
            </div>
            <button onClick={fetchData} className="font-mono text-xs text-gray-500 hover:text-[#ff00ff] transition-colors">
              ↻ REFRESH
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold tracking-widest" style={{ color: '#ff00ff', textShadow: '0 0 20px rgba(255,0,255,0.3)' }}>
                  SYSTEM ANALYTICS
                </h2>
                <p className="font-mono text-xs text-gray-600 mt-1">Global platform statistics</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="cyber-spinner" style={{ borderTopColor: '#ff00ff' }} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <StatPanel label="TOTAL USERS" value={stats?.totalUsers || 0} color="#00f5ff" icon="👥" />
                    <StatPanel label="TOTAL NUMBERS" value={stats?.totalNumbers || 0} color="#8b5cf6" icon="📱" />
                    <StatPanel label="ONLINE NOW" value={stats?.onlineUsers || 0} color="#00ff88" icon="🟢" sub="Last 5 min" />
                    <StatPanel label="ACTIVE NUMBERS" value={stats?.activeNumbers || 0} color="#ffaa00" icon="⚡" />
                    <StatPanel label="BANNED USERS" value={stats?.bannedUsers || 0} color="#ff4444" icon="🚫" />
                  </div>

                  {/* Plan breakdown */}
                  <div className="glass rounded-xl p-6 mb-6" style={{ border: '1px solid rgba(255,0,255,0.15)' }}>
                    <h3 className="font-mono text-xs text-[#ff00ff] tracking-widest mb-4">PLAN DISTRIBUTION</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {['free', 'pro', 'enterprise'].map(plan => {
                        const count = stats?.planBreakdown?.find(p => p._id === plan)?.count || 0;
                        const colors = { free: '#00f5ff', pro: '#8b5cf6', enterprise: '#ff00ff' };
                        const total = stats?.totalUsers || 1;
                        return (
                          <div key={plan} className="text-center">
                            <div className="font-display text-2xl font-bold mb-1" style={{ color: colors[plan] }}>{count}</div>
                            <div className="font-mono text-xs text-gray-500 mb-2">{plan.toUpperCase()}</div>
                            <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(count / total) * 100}%` }} transition={{ duration: 1 }}
                                className="h-full rounded-full" style={{ background: colors[plan], boxShadow: `0 0 6px ${colors[plan]}` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent users */}
                  <div className="glass rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,0,255,0.1)' }}>
                    <div className="px-6 py-4 border-b border-[rgba(255,0,255,0.08)]">
                      <span className="font-mono text-xs text-[#ff00ff] tracking-widest">RECENT REGISTRATIONS</span>
                    </div>
                    <table className="w-full cyber-table">
                      <thead><tr><th>USERNAME</th><th>EMAIL</th><th>PLAN</th><th>STATUS</th><th>JOINED</th></tr></thead>
                      <tbody>
                        {users.slice(0, 8).map((u, i) => (
                          <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                            <td className="text-[#00f5ff]">{u.username}</td>
                            <td className="text-gray-400">{u.email}</td>
                            <td>
                              <span className="font-mono text-xs px-2 py-0.5 rounded"
                                style={{ color: u.subscriptionPlan === 'pro' ? '#8b5cf6' : u.subscriptionPlan === 'enterprise' ? '#ff00ff' : '#00f5ff', border: `1px solid currentColor`, background: 'rgba(0,0,0,0.3)' }}>
                                {u.subscriptionPlan?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={u.banned ? 'status-inactive' : 'status-active'}>
                                {u.banned ? 'BANNED' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex gap-4 justify-between items-center mb-8">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-widest" style={{ color: '#ff00ff' }}>USER MANAGEMENT</h2>
                  <p className="font-mono text-xs text-gray-600 mt-1">{users.length} registered operators</p>
                </div>
              </div>

              <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input-neon rounded w-full max-w-sm" placeholder="SEARCH USERS..."
                  style={{ borderColor: 'rgba(255,0,255,0.3)' }} />
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><div className="cyber-spinner" style={{ borderTopColor: '#ff00ff' }} /></div>
              ) : (
                <div className="glass rounded-xl overflow-x-auto" style={{ border: '1px solid rgba(255,0,255,0.1)' }}>
                  <table className="w-full cyber-table min-w-[700px]">
                    <thead><tr><th>USERNAME</th><th>EMAIL</th><th>PLAN</th><th>ROLE</th><th>STATUS</th><th>JOINED</th><th className="text-right">ACTIONS</th></tr></thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                          <td className="text-[#00f5ff] font-bold">{u.username}</td>
                          <td className="text-gray-400">{u.email}</td>
                          <td>
                            <select value={u.subscriptionPlan} onChange={e => handlePlanChange(u._id, e.target.value)}
                              className="bg-transparent border border-[rgba(255,255,255,0.1)] text-xs text-gray-300 px-2 py-1 rounded font-mono outline-none hover:border-[#ff00ff] transition-colors">
                              <option value="free">FREE</option>
                              <option value="pro">PRO</option>
                              <option value="enterprise">ENTERPRISE</option>
                            </select>
                          </td>
                          <td>
                            <span className="font-mono text-xs" style={{ color: u.role === 'admin' ? '#ff00ff' : '#00f5ff' }}>
                              {u.role?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={u.banned ? 'status-inactive' : 'status-active'}>
                              {u.banned ? 'BANNED' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="text-right">
                            <div className="flex gap-3 justify-end">
                              {u.role !== 'admin' && (
                                <>
                                  <button onClick={() => handleBan(u._id)}
                                    className={`font-mono text-xs transition-colors ${u.banned ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'}`}>
                                    {u.banned ? 'UNBAN' : 'BAN'}
                                  </button>
                                  <button onClick={() => handleDelete(u._id)}
                                    className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors">
                                    DELETE
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 font-mono text-xs text-gray-600">NO USERS FOUND</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Numbers Tab */}
          {activeTab === 'numbers' && (
            <div>
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold tracking-widest" style={{ color: '#ff00ff' }}>ALL LINKED NUMBERS</h2>
                <p className="font-mono text-xs text-gray-600 mt-1">{numbers.length} total numbers in system</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><div className="cyber-spinner" style={{ borderTopColor: '#ff00ff' }} /></div>
              ) : (
                <div className="glass rounded-xl overflow-x-auto" style={{ border: '1px solid rgba(255,0,255,0.1)' }}>
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
                  {numbers.length === 0 && (
                    <div className="text-center py-12 font-mono text-xs text-gray-600">NO NUMBERS IN SYSTEM</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
