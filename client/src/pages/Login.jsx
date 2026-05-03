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
    const chars = '01アイウエオCYBERSECPRO<>{}[]/\\';
    const fontSize = 12;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = 'rgba(2,4,8,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,245,255,0.12)';
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

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.email || !formData.password) return toast.error('All fields required');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', formData);
      login(data.token, data.user);
      toast.success('ACCESS GRANTED');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center relative overflow-hidden scan-lines">
      <MatrixRain />
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none z-0" />

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.img src={LOGO} alt="CYBERSECPRO" animate={{ filter: ['drop-shadow(0 0 8px #00f5ff)', 'drop-shadow(0 0 20px #00f5ff)', 'drop-shadow(0 0 8px #00f5ff)'] }} transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 object-contain rounded mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl tracking-widest neon-cyan">CYBERSECPRO</h1>
          <p className="font-mono text-xs text-gray-600 tracking-widest mt-1">SECURE ACCESS TERMINAL</p>
        </div>

        {/* Form */}
        <div className="glass neon-border rounded-xl p-8 relative overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00f5ff]" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f5ff]" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00f5ff]" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00f5ff]" />

          <div className="mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" style={{ boxShadow: '0 0 6px #00ff88' }} />
            <span className="font-mono text-xs text-gray-500 tracking-widest">AUTHENTICATION PROTOCOL</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-mono text-xs text-[#00f5ff] tracking-widest block mb-2">EMAIL ADDRESS</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange}
                className="input-neon rounded w-full" placeholder="operator@cybersec.pro" autoComplete="email" />
            </div>

            <div>
              <label className="font-mono text-xs text-[#00f5ff] tracking-widest block mb-2">PASSWORD</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                  className="input-neon rounded w-full pr-12" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00f5ff] transition-colors font-mono text-xs">
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full btn-neon-solid py-3 rounded font-display text-sm tracking-widest relative overflow-hidden">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="cyber-spinner w-5 h-5" />
                  AUTHENTICATING...
                </span>
              ) : '⚡ ACCESS SYSTEM'}
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-[rgba(0,245,255,0.1)] text-center">
            <p className="font-mono text-xs text-gray-600">
              NO ACCESS? {' '}
              <Link to="/signup" className="text-[#00f5ff] hover:text-white transition-colors tracking-widest">INITIALIZE ACCOUNT</Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="font-mono text-xs text-gray-600 hover:text-[#00f5ff] transition-colors tracking-widest">← RETURN TO BASE</Link>
        </div>
      </motion.div>
    </div>
  );
}
