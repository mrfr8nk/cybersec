import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';

const MatrixRain = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ<>{}[]|=+*/\\';
    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = 'rgba(2,4,8,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,245,255,0.15)';
      ctx.font = `${fontSize}px Share Tech Mono`;
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    const interval = setInterval(draw, 60);
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
};

const FloatingOrb = ({ size, x, y, color, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ width: size, height: size, left: x, top: y, background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, filter: `blur(${size / 3}px)` }}
    animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

const HUDRing = ({ size, color, duration, reverse }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size, height: size,
      left: '50%', top: '50%',
      marginLeft: -size / 2, marginTop: -size / 2,
      border: `1px solid ${color}40`,
      boxShadow: `0 0 20px ${color}20, inset 0 0 20px ${color}10`
    }}
    animate={{ rotate: reverse ? -360 : 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
  />
);

const CounterCard = ({ value, label, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const end = parseInt(value.replace(/\D/g, ''));
    let start = 0;
    const step = end / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="glass neon-border rounded text-center p-6 card-hover">
      <div className="font-display text-3xl font-bold neon-cyan">{prefix}{count.toLocaleString()}{suffix}</div>
      <div className="text-xs tracking-widest text-gray-400 mt-2 uppercase">{label}</div>
    </motion.div>
  );
};

const FEATURES = [
  { icon: '⚡', title: 'Lightning Fast', desc: 'Instant number linking and management with real-time status updates across your entire network.', color: '#00f5ff' },
  { icon: '🛡️', title: 'Military Grade Security', desc: 'End-to-end encryption, JWT authentication, and advanced threat detection protect your data.', color: '#8b5cf6' },
  { icon: '🤖', title: 'AI-Powered Bots', desc: 'Intelligent bot management system with automated responses and smart routing algorithms.', color: '#ff00ff' },
  { icon: '📊', title: 'Real-Time Analytics', desc: 'Holographic dashboards with live metrics, usage graphs, and performance insights.', color: '#00ff88' },
  { icon: '🌐', title: 'Global Network', desc: 'Distributed infrastructure spanning multiple regions for ultra-low latency worldwide.', color: '#0080ff' },
  { icon: '🔮', title: 'Quantum Encryption', desc: 'Next-generation cryptographic protocols that are resistant to future quantum attacks.', color: '#ff6600' },
];

const PRICING = [
  {
    plan: 'FREE', price: '0', period: 'forever', color: '#00f5ff',
    features: ['5 Linked Numbers', 'Basic Dashboard', 'Standard Security', 'Community Support', 'Basic Analytics'],
    cta: 'Start Free'
  },
  {
    plan: 'PRO', price: '29', period: 'month', color: '#8b5cf6', popular: true,
    features: ['25 Linked Numbers', 'Advanced Dashboard', 'Enhanced Security', 'Priority Support', 'Full Analytics', 'API Access', 'Custom Bot Names'],
    cta: 'Go Pro'
  },
  {
    plan: 'ENTERPRISE', price: '99', period: 'month', color: '#ff00ff',
    features: ['Unlimited Numbers', 'Control Center', 'Military Security', 'Dedicated Support', 'AI Analytics', 'Full API Access', 'White Label', 'SLA Guarantee'],
    cta: 'Contact Sales'
  }
];

const TESTIMONIALS = [
  { name: 'Alex_X', role: 'Bot Developer', text: 'CYBERSECPRO transformed how I manage my bot infrastructure. The holographic UI is insane.', rating: 5 },
  { name: 'CyberNinja', role: 'Tech Lead', text: 'Best SaaS platform I\'ve ever used. The security features are unmatched.', rating: 5 },
  { name: 'NexusOp', role: 'System Admin', text: 'Migrated 50+ numbers seamlessly. The admin panel is a game changer.', rating: 5 },
];

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="relative min-h-screen bg-[#020408] overflow-x-hidden scan-lines">
      <MatrixRain />

      {/* Background orbs */}
      <FloatingOrb size={400} x="10%" y="5%" color="#00f5ff" delay={0} />
      <FloatingOrb size={300} x="70%" y="10%" color="#8b5cf6" delay={2} />
      <FloatingOrb size={250} x="85%" y="60%" color="#ff00ff" delay={4} />
      <FloatingOrb size={350} x="5%" y="70%" color="#0080ff" delay={1} />

      {/* Cyber Grid */}
      <div className="fixed inset-0 cyber-grid opacity-50 pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-4 glass border-b border-[rgba(0,245,255,0.1)]">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="CYBERSECPRO" className="w-10 h-10 object-contain rounded" style={{ filter: 'drop-shadow(0 0 8px #00f5ff)' }} />
          <span className="font-display font-bold text-lg tracking-widest neon-cyan">CYBERSECPRO</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Dashboard', 'Testimonials'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="font-mono text-xs tracking-widest text-gray-400 hover:text-[#00f5ff] transition-colors uppercase">{item}</a>
          ))}
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-neon text-xs px-5 py-2 rounded">LOGIN</Link>
          <Link to="/signup" className="btn-neon-solid text-xs px-5 py-2 rounded">SIGNUP</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        {/* HUD rings */}
        <div className="absolute" style={{ width: 600, height: 600, left: '50%', top: '50%', marginLeft: -300, marginTop: -300 }}>
          <HUDRing size={600} color="#00f5ff" duration={20} />
          <HUDRing size={480} color="#8b5cf6" duration={15} reverse />
          <HUDRing size={360} color="#ff00ff" duration={10} />
          <HUDRing size={240} color="#00f5ff" duration={7} reverse />
        </div>

        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }} className="relative z-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-block mb-6 px-4 py-2 glass neon-border rounded-full">
            <span className="font-mono text-xs tracking-widest text-[#00f5ff]">⚡ NEXT-GEN BOT MANAGEMENT PLATFORM</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-display font-black mb-4 leading-none"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}>
            <span className="gradient-text animate-neon-flicker">CYBER</span>
            <span className="text-white">SEC</span>
            <span className="gradient-text">PRO</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="font-mono text-[#00f5ff] text-sm md:text-base tracking-widest mb-4 opacity-80">
            [ HOLOGRAPHIC CONTROL CENTER — BOT MANAGEMENT SYSTEM ]
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="font-body text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            The most advanced cyberpunk SaaS platform for managing bot numbers, real-time monitoring, and AI-powered automation. Built for the future.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn-neon-solid px-10 py-4 text-sm rounded font-display tracking-widest">
                ⚡ ENTER CYBERSECPRO
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn-neon px-10 py-4 text-sm rounded font-display tracking-widest">
                EXPLORE FEATURES
              </motion.button>
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest text-gray-600">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#00f5ff] to-transparent" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <CounterCard value="10000" label="Active Users" prefix="" suffix="+" />
          <CounterCard value="50000" label="Linked Numbers" prefix="" suffix="+" />
          <CounterCard value="99" label="Uptime" prefix="" suffix="%" />
          <CounterCard value="150" label="Countries" prefix="" suffix="+" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="font-mono text-xs tracking-widest text-gray-600 mb-3">// CAPABILITIES</p>
            <h2 className="font-display font-bold text-4xl gradient-text">SYSTEM FEATURES</h2>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="glass rounded-lg p-6 card-hover"
                style={{ border: `1px solid ${f.color}20`, boxShadow: `0 0 20px ${f.color}10` }}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-display font-bold text-base mb-3" style={{ color: f.color }}>{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-body">{f.desc}</p>
                <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${f.color}40, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="font-mono text-xs tracking-widest text-gray-600 mb-3">// INTERFACE</p>
            <h2 className="font-display font-bold text-4xl gradient-text">HOLOGRAM DASHBOARD</h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden glass neon-border p-1">
            <div className="rounded-lg overflow-hidden bg-[#030610] p-6">
              {/* Mock Dashboard UI */}
              <div className="flex gap-2 mb-4">
                {['#ff4444', '#ffaa00', '#00ff88'].map((c, i) => <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />)}
                <div className="flex-1 glass rounded px-3 py-1 ml-2">
                  <span className="font-mono text-xs text-gray-600">cybersecpro.app/dashboard</span>
                </div>
              </div>
              <div className="flex gap-4 h-48">
                <div className="w-48 glass rounded p-3 space-y-2">
                  {['DASHBOARD', 'NUMBERS', 'ANALYTICS', 'SETTINGS'].map((item, i) => (
                    <div key={i} className={`font-mono text-xs p-2 rounded cursor-pointer ${i === 0 ? 'bg-[rgba(0,245,255,0.1)] text-[#00f5ff]' : 'text-gray-500'}`}>{item}</div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  {[['TOTAL NUMBERS', '47', '#00f5ff'], ['ACTIVE BOTS', '42', '#00ff88'], ['PLAN', 'PRO', '#8b5cf6']].map(([label, val, color], i) => (
                    <div key={i} className="glass rounded p-3 text-center" style={{ border: `1px solid ${color}30` }}>
                      <div className="font-display text-2xl font-bold" style={{ color, textShadow: `0 0 10px ${color}` }}>{val}</div>
                      <div className="font-mono text-[9px] text-gray-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 glass rounded p-3">
                <div className="font-mono text-xs text-[#00f5ff] mb-2">LINKED NUMBERS</div>
                {['+1 (555) 000-1234', '+44 7700 000123', '+91 98765 43210'].map((num, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-[rgba(0,245,255,0.05)]">
                    <span className="font-mono text-xs text-gray-400">{num}</span>
                    <span className="status-active text-[8px]">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="font-mono text-xs tracking-widest text-gray-600 mb-3">// ACCESS TIERS</p>
            <h2 className="font-display font-bold text-4xl gradient-text">PRICING MATRIX</h2>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="relative rounded-xl p-6 card-hover"
                style={{
                  background: `linear-gradient(145deg, ${tier.color}08, transparent)`,
                  border: `1px solid ${tier.color}30`,
                  boxShadow: tier.popular ? `0 0 40px ${tier.color}20` : 'none'
                }}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-display tracking-widest rounded-full"
                    style={{ background: tier.color, color: '#020408' }}>
                    MOST POPULAR
                  </div>
                )}
                <div className="font-display text-sm tracking-widest mb-4" style={{ color: tier.color }}>{tier.plan}</div>
                <div className="flex items-end gap-1 mb-6">
                  <span className="font-mono text-gray-400 text-lg">$</span>
                  <span className="font-display font-black text-5xl" style={{ color: tier.color }}>{tier.price}</span>
                  <span className="font-mono text-gray-500 text-sm mb-2">/{tier.period}</span>
                </div>
                <div className="space-y-3 mb-8">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <span style={{ color: tier.color }} className="text-sm">◆</span>
                      <span className="font-mono text-xs text-gray-400">{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/signup">
                  <button className="w-full py-3 rounded font-display text-xs tracking-widest transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${tier.color}30, ${tier.color}10)`,
                      border: `1px solid ${tier.color}60`,
                      color: tier.color,
                      boxShadow: `0 0 20px ${tier.color}20`
                    }}>
                    {tier.cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="font-mono text-xs tracking-widest text-gray-600 mb-3">// USER LOGS</p>
            <h2 className="font-display font-bold text-4xl gradient-text">TESTIMONIALS</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass neon-border rounded-lg p-6">
                <div className="flex text-[#00f5ff] mb-4">{Array(t.rating).fill('★').join('')}</div>
                <p className="font-mono text-xs text-gray-400 leading-relaxed mb-4">"{t.text}"</p>
                <div className="border-t border-[rgba(0,245,255,0.1)] pt-3">
                  <div className="font-display text-sm text-[#00f5ff]">{t.name}</div>
                  <div className="font-mono text-xs text-gray-600">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass neon-border rounded-2xl p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at center, rgba(0,245,255,0.2) 0%, transparent 70%)' }} />
          <h2 className="font-display font-black text-4xl md:text-5xl gradient-text mb-6 relative z-10">READY TO ENTER?</h2>
          <p className="font-mono text-gray-400 text-sm mb-10 tracking-wider relative z-10">Join thousands of operators using CYBERSECPRO to manage their bot infrastructure</p>
          <Link to="/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-neon-solid px-12 py-4 rounded font-display text-sm tracking-widest relative z-10">
              ⚡ INITIALIZE ACCOUNT
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(0,245,255,0.1)] py-10 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="CYBERSECPRO" className="w-8 h-8 object-contain rounded" />
            <span className="font-display text-sm tracking-widest text-[#00f5ff]">CYBERSECPRO</span>
          </div>
          <div className="font-mono text-xs text-gray-600 text-center">
            © 2026 CYBERSECPRO — FUTURISTIC BOT MANAGEMENT SYSTEM
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="font-mono text-xs text-gray-500 hover:text-[#00f5ff] transition-colors">LOGIN</Link>
            <Link to="/signup" className="font-mono text-xs text-gray-500 hover:text-[#00f5ff] transition-colors">SIGNUP</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
