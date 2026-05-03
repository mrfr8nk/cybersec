import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';

const MatrixRain = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = '01アCSP<>{}CYBERSECPRO[]=/\\';
    const fontSize = 12;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = 'rgba(2,4,8,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(139,92,246,0.12)';
      ctx.font = `${fontSize}px Share Tech Mono`;
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    const interval = setInterval(draw, 60);
    return () => clearInterval(interval);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = getStrength();
  const labels = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'];
  const colors = ['', '#ff4444', '#ffaa00', '#00f5ff', '#00ff88'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-1 flex-1 rounded" style={{ background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <span className="font-mono text-xs mt-1 block" style={{ color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
};

export default function Signup() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      return toast.error('All fields required');
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      login(data.token, data.user);
      toast.success('ACCOUNT INITIALIZED');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center relative overflow-hidden scan-lines py-8">
      <MatrixRain />
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none z-0" />

      <div className="fixed top-1/3 right-1/4 w-72 h-72 rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-1/3 left-1/4 w-72 h-72 rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(255,0,255,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4">

        <div className="text-center mb-8">
          <motion.img src={LOGO} alt="CYBERSECPRO" animate={{ filter: ['drop-shadow(0 0 8px #8b5cf6)', 'drop-shadow(0 0 20px #8b5cf6)', 'drop-shadow(0 0 8px #8b5cf6)'] }} transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 object-contain rounded mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl tracking-widest gradient-text">CYBERSECPRO</h1>
          <p className="font-mono text-xs text-gray-600 tracking-widest mt-1">ACCOUNT INITIALIZATION</p>
        </div>

        <div className="glass neon-border-purple rounded-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#8b5cf6]" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#8b5cf6]" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#8b5cf6]" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#8b5cf6]" />

          <div className="mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" style={{ boxShadow: '0 0 6px #8b5cf6' }} />
            <span className="font-mono text-xs text-gray-500 tracking-widest">CREATE NEW OPERATOR</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-[#8b5cf6] tracking-widest block mb-2">USERNAME</label>
              <input name="username" type="text" value={formData.username} onChange={handleChange}
                className="input-neon rounded w-full" placeholder="operator_name" style={{ borderColor: 'rgba(139,92,246,0.3)' }} />
            </div>
            <div>
              <label className="font-mono text-xs text-[#8b5cf6] tracking-widest block mb-2">EMAIL ADDRESS</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange}
                className="input-neon rounded w-full" placeholder="operator@cybersec.pro" style={{ borderColor: 'rgba(139,92,246,0.3)' }} />
            </div>
            <div>
              <label className="font-mono text-xs text-[#8b5cf6] tracking-widest block mb-2">PASSWORD</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                  className="input-neon rounded w-full pr-12" placeholder="••••••••" style={{ borderColor: 'rgba(139,92,246,0.3)' }} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#8b5cf6] transition-colors font-mono text-xs">
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <PasswordStrength password={formData.password} />
            </div>
            <div>
              <label className="font-mono text-xs text-[#8b5cf6] tracking-widest block mb-2">CONFIRM PASSWORD</label>
              <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                className="input-neon rounded w-full" placeholder="••••••••"
                style={{ borderColor: formData.confirmPassword && formData.password !== formData.confirmPassword ? 'rgba(255,68,68,0.5)' : 'rgba(139,92,246,0.3)' }} />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <span className="font-mono text-xs text-red-400 mt-1 block">PASSWORDS DO NOT MATCH</span>
              )}
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 rounded font-display text-sm tracking-widest relative overflow-hidden mt-2"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(255,0,255,0.2))', border: '1px solid rgba(139,92,246,0.5)', color: '#e0f7fa', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="cyber-spinner w-5 h-5" style={{ borderTopColor: '#8b5cf6' }} />
                  INITIALIZING...
                </span>
              ) : '🔮 CREATE ACCOUNT'}
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-[rgba(139,92,246,0.1)] text-center">
            <p className="font-mono text-xs text-gray-600">
              ALREADY REGISTERED?{' '}
              <Link to="/login" className="text-[#8b5cf6] hover:text-white transition-colors tracking-widest">ACCESS TERMINAL</Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="font-mono text-xs text-gray-600 hover:text-[#8b5cf6] transition-colors tracking-widest">← RETURN TO BASE</Link>
        </div>
      </motion.div>
    </div>
  );
}
