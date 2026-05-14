import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';
const CONTACT = '+923417022212';
const INSTAGRAM = 'https://www.instagram.com/cyber_sec_pro';

const MatrixRain = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = '01アイウエオカキクケコCSP<>{}[]|=+*/\\CYBERSEC';
    const fontSize = 13;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    const colors = ['rgba(0,245,255,0.2)', 'rgba(139,92,246,0.15)', 'rgba(0,255,136,0.18)'];
    const draw = () => {
      ctx.fillStyle = 'rgba(6,9,26,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drops.forEach((y, i) => {
        ctx.fillStyle = colors[i % colors.length];
        ctx.font = `${fontSize}px Share Tech Mono`;
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    const interval = setInterval(draw, 50);
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60" />;
};

const GlitchText = ({ children, className, style }) => {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={className} style={{ ...style, position: 'relative', display: 'inline-block' }}>
      {children}
      {glitch && (
        <>
          <span style={{ position: 'absolute', top: 0, left: 2, color: '#ff00ff', clipPath: 'inset(20% 0 60% 0)', opacity: 0.8 }}>{children}</span>
          <span style={{ position: 'absolute', top: 0, left: -2, color: '#00f5ff', clipPath: 'inset(60% 0 10% 0)', opacity: 0.8 }}>{children}</span>
        </>
      )}
    </span>
  );
};

const FloatingOrb = ({ size, x, y, color, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ width: size, height: size, left: x, top: y, background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`, filter: `blur(${size / 2.5}px)` }}
    animate={{ y: [0, -40, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }}
    transition={{ duration: 7, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

const HUDRing = ({ size, color, duration, reverse, dashed }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size, height: size,
      left: '50%', top: '50%',
      marginLeft: -size / 2, marginTop: -size / 2,
      border: dashed ? `1px dashed ${color}50` : `1px solid ${color}70`,
      boxShadow: `0 0 30px ${color}35, inset 0 0 30px ${color}20`
    }}
    animate={{ rotate: reverse ? -360 : 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
  />
);

const ScanLine = () => (
  <motion.div
    className="fixed inset-x-0 pointer-events-none z-0"
    style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent)' }}
    animate={{ top: ['-2px', '100vh'] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
  />
);

const CounterCard = ({ value, label, prefix = '', suffix = '', color = '#00f5ff' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const end = parseInt(value.replace(/\D/g, ''));
    let start = 0;
    const step = end / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(t);
  }, [value]);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="rounded-xl text-center p-6"
      style={{
        background: `linear-gradient(145deg, ${color}15, rgba(6,9,26,0.9))`,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 30px ${color}20`
      }}>
      <div className="font-display text-2xl sm:text-3xl font-bold mb-1" style={{ color }}>{prefix}{count.toLocaleString()}{suffix}</div>
      <div className="w-8 h-px mx-auto mb-2" style={{ background: color }} />
      <div className="font-mono text-xs tracking-widest text-gray-400 uppercase">{label}</div>
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
    plan: 'FREE', color: '#00f5ff',
    price: 'FREE',
    period: 'forever',
    users: '1 User',
    features: ['1 User Account', 'Basic Dashboard', 'Standard Security', 'Community Support', 'Basic Analytics'],
    cta: 'Start Free', ctaLink: '/signup', isFree: true
  },
  {
    plan: 'PRO', color: '#8b5cf6', popular: true,
    price: 'Contact',
    period: 'for pricing',
    users: '5 Users',
    features: ['5 User Accounts', 'Advanced Dashboard', 'Enhanced Security', 'Priority Support', 'Full Analytics', 'API Access', 'Custom Bot Names'],
    cta: 'Contact for PRO', isFree: false
  },
  {
    plan: 'ENTERPRISE', color: '#ff00ff',
    price: 'Contact',
    period: 'for pricing',
    users: 'Unlimited',
    features: ['Unlimited Users', 'Control Center', 'Military Security', 'Dedicated Support', 'AI Analytics', 'Full API Access', 'White Label', 'SLA Guarantee'],
    cta: 'Contact for Enterprise', isFree: false
  }
];

const TESTIMONIALS = [
  { name: 'Alex_X', role: 'Bot Developer', text: 'CYBERSECPRO transformed how I manage my bot infrastructure. The holographic UI is insane.', rating: 5, color: '#00f5ff' },
  { name: 'CyberNinja', role: 'Tech Lead', text: 'Best SaaS platform I\'ve ever used. The security features are unmatched in every way.', rating: 5, color: '#8b5cf6' },
  { name: 'NexusOp', role: 'System Admin', text: 'Migrated 50+ numbers seamlessly. The admin panel is a complete game changer for teams.', rating: 5, color: '#ff00ff' },
];

const ParticleField = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    color: ['#00f5ff', '#8b5cf6', '#ff00ff', '#00ff88'][Math.floor(Math.random() * 4)],
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 4
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, boxShadow: `0 0 6px ${p.color}` }}
          animate={{ y: [0, -60, 0], opacity: [0, 1, 0], x: [0, Math.random() * 20 - 10, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #04061a 0%, #0a0618 40%, #040c1e 100%)' }}>
      <MatrixRain />
      <ParticleField />
      <ScanLine />

      <FloatingOrb size={600} x="0%" y="-5%" color="#00f5ff" delay={0} />
      <FloatingOrb size={500} x="60%" y="0%" color="#8b5cf6" delay={2} />
      <FloatingOrb size={400} x="75%" y="50%" color="#ff00ff" delay={4} />
      <FloatingOrb size={500} x="-5%" y="60%" color="#0060ff" delay={1} />
      <FloatingOrb size={350} x="35%" y="35%" color="#00ff88" delay={3} />

      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundImage: 'linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* Progress Bar */}
      <motion.div className="fixed top-0 left-0 h-0.5 z-50 origin-left"
        style={{ scaleX: scrollYProgress, background: 'linear-gradient(90deg, #00f5ff, #8b5cf6, #ff00ff)' }} />

      {/* Navbar */}
      <motion.nav style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{ background: 'rgba(4,6,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,245,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={LOGO} alt="CYBERSECPRO" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded" style={{ filter: 'drop-shadow(0 0 12px #00f5ff)' }} />
            <div className="absolute inset-0 rounded animate-ping" style={{ border: '1px solid rgba(0,245,255,0.3)', animationDuration: '3s' }} />
          </div>
          <div>
            <div className="font-display font-bold text-sm sm:text-base tracking-widest" style={{ color: '#00f5ff' }}>CYBERSECPRO</div>
            <div className="font-mono text-xs text-gray-500 tracking-widest hidden sm:block">v4.0 ONLINE</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Testimonials'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="font-mono text-xs tracking-widest text-gray-400 hover:text-[#00f5ff] transition-all duration-300 uppercase relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#00f5ff] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>
        <div className="hidden md:flex gap-3">
          <Link to="/login">
            <button className="font-display text-xs px-5 py-2 rounded tracking-widest transition-all duration-300"
              style={{ border: '1px solid rgba(0,245,255,0.5)', color: '#00f5ff', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,245,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              LOGIN
            </button>
          </Link>
          <Link to="/signup">
            <button className="font-display text-xs px-5 py-2 rounded tracking-widest transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #00f5ff, #0080ff)', color: '#04061a', boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}>
              SIGNUP
            </button>
          </Link>
        </div>
        <button onClick={() => setMenuOpen(p => !p)} className="md:hidden text-2xl" style={{ color: '#00f5ff' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="fixed top-[65px] left-0 right-0 z-40 md:hidden px-4 py-4 flex flex-col gap-4"
            style={{ background: 'rgba(4,6,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,245,255,0.15)' }}>
            {['Features', 'Pricing', 'Testimonials'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                className="font-mono text-sm tracking-widest text-gray-300 hover:text-[#00f5ff] transition-colors uppercase py-2 border-b border-[rgba(0,245,255,0.1)]">{item}</a>
            ))}
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <button className="w-full py-3 rounded font-display text-sm tracking-widest" style={{ border: '1px solid rgba(0,245,255,0.5)', color: '#00f5ff' }}>LOGIN</button>
            </Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)}>
              <button className="w-full py-3 rounded font-display text-sm tracking-widest" style={{ background: 'linear-gradient(135deg, #00f5ff, #0080ff)', color: '#04061a' }}>SIGNUP</button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex items-center justify-center text-center px-4 overflow-hidden pt-20">
        <div className="absolute hidden sm:block" style={{ width: 700, height: 700, left: '50%', top: '50%', marginLeft: -350, marginTop: -350 }}>
          <HUDRing size={700} color="#00f5ff" duration={25} dashed />
          <HUDRing size={560} color="#8b5cf6" duration={18} reverse />
          <HUDRing size={420} color="#ff00ff" duration={12} dashed />
          <HUDRing size={280} color="#00f5ff" duration={8} reverse />
          <HUDRing size={140} color="#8b5cf6" duration={5} />
        </div>

        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }}
          className="relative z-10 max-w-5xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.3)', boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}>
            <motion.div className="w-2 h-2 rounded-full bg-[#00f5ff]" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
            <span className="font-mono text-xs tracking-widest text-[#00f5ff]">SYSTEM ONLINE — NEXT-GEN BOT PLATFORM</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-display font-black mb-6 leading-none"
            style={{ fontSize: 'clamp(3rem, 9vw, 8rem)' }}>
            <GlitchText className="text-[#00f5ff]" style={{ textShadow: '0 0 40px rgba(0,245,255,0.6), 0 0 80px rgba(0,245,255,0.3)' }}>CYBER</GlitchText>
            <span className="text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>SEC</span>
            <GlitchText style={{ color: '#8b5cf6', textShadow: '0 0 40px rgba(139,92,246,0.6)' }}>PRO</GlitchText>
          </motion.h1>

          <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.4 }}
            className="w-64 h-px mx-auto mb-6"
            style={{ background: 'linear-gradient(90deg, transparent, #00f5ff, #8b5cf6, #ff00ff, transparent)' }} />

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="font-mono text-[#00f5ff] text-xs sm:text-sm tracking-widest mb-4">
            [ HOLOGRAPHIC CONTROL CENTER — BOT MANAGEMENT SYSTEM ]
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="font-body text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed px-2">
            The most advanced cyberpunk SaaS platform for managing bot numbers, real-time monitoring, and AI-powered automation.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(0,245,255,0.6)' }} whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-4 text-sm rounded font-display tracking-widest transition-all"
                style={{ background: 'linear-gradient(135deg, #00f5ff, #0060ff)', color: '#04061a', boxShadow: '0 0 25px rgba(0,245,255,0.4)' }}>
                ⚡ ENTER CYBERSECPRO
              </motion.button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.06, background: 'rgba(0,245,255,0.12)' }} whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-4 text-sm rounded font-display tracking-widest transition-all"
                style={{ border: '1px solid rgba(0,245,255,0.5)', color: '#00f5ff' }}>
                EXPLORE FEATURES
              </motion.button>
            </a>
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest text-gray-600">SCROLL DOWN</span>
          <motion.div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, #00f5ff, transparent)' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <CounterCard value="10000" label="Active Users" suffix="+" color="#00f5ff" />
          <CounterCard value="50000" label="Linked Numbers" suffix="+" color="#8b5cf6" />
          <CounterCard value="99" label="Uptime" suffix="%" color="#00ff88" />
          <CounterCard value="150" label="Countries" suffix="+" color="#ff00ff" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="font-mono text-xs tracking-widest text-gray-500 mb-3 uppercase">// System Capabilities</p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl mb-4" style={{ background: 'linear-gradient(135deg, #00f5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SYSTEM FEATURES
            </h2>
            <div className="mt-3 h-px max-w-xs mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)' }} />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onHoverStart={() => setActiveFeature(i)}
                onHoverEnd={() => setActiveFeature(null)}
                className="rounded-xl p-7 cursor-default transition-all duration-300"
                style={{
                  background: activeFeature === i ? `linear-gradient(145deg, ${f.color}20, rgba(4,6,26,0.95))` : `linear-gradient(145deg, ${f.color}10, rgba(4,6,26,0.9))`,
                  border: `1px solid ${activeFeature === i ? f.color + '60' : f.color + '25'}`,
                  boxShadow: activeFeature === i ? `0 0 40px ${f.color}25` : `0 0 15px ${f.color}10`
                }}>
                <div className="text-4xl mb-4" style={{ filter: `drop-shadow(0 0 10px ${f.color})` }}>{f.icon}</div>
                <h3 className="font-display font-bold text-base mb-3" style={{ color: f.color }}>{f.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-body">{f.desc}</p>
                <motion.div className="mt-5 h-px" style={{ background: `linear-gradient(90deg, ${f.color}80, transparent)` }}
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="font-mono text-xs tracking-widest text-gray-500 mb-3 uppercase">// Access Tiers</p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl mb-4" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              PRICING MATRIX
            </h2>
            <div className="mt-3 h-px max-w-xs mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)' }} />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PRICING.map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="relative rounded-xl p-7 flex flex-col overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${tier.color}15, rgba(4,6,26,0.97))`,
                  border: `1px solid ${tier.color}${tier.popular ? '70' : '35'}`,
                  boxShadow: tier.popular ? `0 0 60px ${tier.color}30, 0 0 120px ${tier.color}10` : `0 0 20px ${tier.color}10`
                }}>
                {tier.popular && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }} />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 text-[9px] font-display tracking-widest rounded-full font-bold"
                      style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}aa)`, color: '#04061a' }}>
                      ★ MOST POPULAR
                    </div>
                  </>
                )}

                <div className="font-display text-xs tracking-widest mb-2" style={{ color: tier.color + 'aa' }}>// TIER</div>
                <div className="font-display text-2xl font-bold tracking-widest mb-2" style={{ color: tier.color, textShadow: `0 0 20px ${tier.color}60` }}>
                  {tier.plan}
                </div>

                <div className="mb-5 rounded-lg px-4 py-3 text-center" style={{ background: `${tier.color}10`, border: `1px solid ${tier.color}25` }}>
                  <div className="font-mono text-xs text-gray-500 mb-1 tracking-widest uppercase">Users</div>
                  <div className="font-display font-black text-2xl" style={{ color: tier.color }}>{tier.users}</div>
                </div>

                {tier.isFree ? (
                  <div className="mb-6 text-center">
                    <span className="font-display font-black text-3xl text-white">FREE</span>
                    <span className="font-mono text-gray-500 text-xs ml-2">forever</span>
                  </div>
                ) : (
                  <div className="mb-6 text-center">
                    <div className="font-mono text-xs text-gray-400 mb-1 tracking-widest">FOR PRICING CONTACT</div>
                    <a href={`https://wa.me/${CONTACT.replace(/\+/g, '')}`} target="_blank" rel="noreferrer"
                      className="font-display font-bold text-lg transition-colors" style={{ color: tier.color }}>
                      {CONTACT}
                    </a>
                  </div>
                )}

                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f, j) => (
                    <motion.div key={j} className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: j * 0.05 }}>
                      <span style={{ color: tier.color }} className="text-sm">◆</span>
                      <span className="font-mono text-xs text-gray-300">{f}</span>
                    </motion.div>
                  ))}
                </div>

                {tier.isFree ? (
                  <Link to="/signup">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="w-full py-3 rounded font-display text-xs tracking-widest transition-all"
                      style={{ background: `linear-gradient(135deg, ${tier.color}40, ${tier.color}20)`, border: `1px solid ${tier.color}70`, color: tier.color, boxShadow: `0 0 20px ${tier.color}20` }}>
                      {tier.cta}
                    </motion.button>
                  </Link>
                ) : (
                  <a href={`https://wa.me/${CONTACT.replace(/\+/g, '')}`} target="_blank" rel="noreferrer">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="w-full py-3 rounded font-display text-xs tracking-widest transition-all"
                      style={{ background: `linear-gradient(135deg, ${tier.color}40, ${tier.color}20)`, border: `1px solid ${tier.color}70`, color: tier.color, boxShadow: `0 0 20px ${tier.color}20` }}>
                      📱 {tier.cta}
                    </motion.button>
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="font-mono text-xs tracking-widest text-gray-500 mb-3 uppercase">// User Logs</p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl" style={{ background: 'linear-gradient(135deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TESTIMONIALS
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="rounded-xl p-7 relative overflow-hidden"
                style={{ background: `linear-gradient(145deg, ${t.color}10, rgba(4,6,26,0.95))`, border: `1px solid ${t.color}30` }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                  style={{ background: `radial-gradient(circle, ${t.color}, transparent)`, filter: 'blur(20px)', transform: 'translate(30%, -30%)' }} />
                <div className="flex mb-4" style={{ color: t.color }}>
                  {Array(t.rating).fill('★').join('')}
                </div>
                <p className="font-mono text-xs text-gray-300 leading-relaxed mb-6">"{t.text}"</p>
                <div className="border-t pt-4" style={{ borderColor: t.color + '25' }}>
                  <div className="font-display text-sm font-bold" style={{ color: t.color }}>{t.name}</div>
                  <div className="font-mono text-xs text-gray-500 mt-0.5">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 sm:py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center rounded-2xl p-10 sm:p-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, rgba(0,245,255,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(0,245,255,0.25)', boxShadow: '0 0 80px rgba(0,245,255,0.1)' }}>
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(0,245,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(139,92,246,0.3) 0%, transparent 50%)' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute right-10 top-10 w-20 h-20 rounded-full hidden sm:block"
            style={{ border: '1px solid rgba(0,245,255,0.2)' }} />
          <h2 className="font-display font-black text-3xl sm:text-5xl mb-6 relative z-10"
            style={{ background: 'linear-gradient(135deg, #00f5ff, #8b5cf6, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            READY TO ENTER?
          </h2>
          <p className="font-mono text-gray-400 text-sm mb-10 tracking-wider relative z-10">
            Join thousands of operators using CYBERSECPRO to manage their bot infrastructure
          </p>
          <Link to="/signup">
            <motion.button whileHover={{ scale: 1.06, boxShadow: '0 0 50px rgba(0,245,255,0.5)' }} whileTap={{ scale: 0.95 }}
              className="px-12 py-4 rounded font-display text-sm tracking-widest relative z-10"
              style={{ background: 'linear-gradient(135deg, #00f5ff, #0060ff)', color: '#04061a' }}>
              ⚡ INITIALIZE ACCOUNT
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 sm:px-8"
        style={{ background: 'rgba(4,6,26,0.95)', borderTop: '1px solid rgba(0,245,255,0.15)' }}>
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="CYBERSECPRO" className="w-9 h-9 object-contain rounded" style={{ filter: 'drop-shadow(0 0 10px #00f5ff)' }} />
            <span className="font-display text-base tracking-widest" style={{ color: '#00f5ff' }}>CYBERSECPRO</span>
          </div>

          <div className="h-px w-40" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent)' }} />

          <div className="text-center">
            <div className="font-mono text-sm text-gray-300 mb-1">
              Created by <span className="font-bold" style={{ color: '#00f5ff' }}>CYBERSECPRO</span>
            </div>
            <div className="font-mono text-xs text-gray-500">
              For Premium Plans:{' '}
              <a href={`https://wa.me/${CONTACT.replace(/\+/g, '')}`} target="_blank" rel="noreferrer"
                className="transition-colors" style={{ color: '#8b5cf6' }}>{CONTACT}</a>
            </div>
          </div>

          <div className="flex gap-6">
            <Link to="/login" className="font-mono text-xs text-gray-400 hover:text-[#00f5ff] transition-colors">LOGIN</Link>
            <span className="text-gray-700">|</span>
            <Link to="/signup" className="font-mono text-xs text-gray-400 hover:text-[#00f5ff] transition-colors">SIGNUP</Link>
          </div>

          <div className="font-mono text-xs text-gray-600 text-center">
            © 2026 CYBERSECPRO — FUTURISTIC BOT MANAGEMENT SYSTEM
          </div>

          <div className="font-mono text-xs text-center" style={{ color: 'rgba(0,245,255,0.35)' }}>
            Web by{' '}
            <a href={INSTAGRAM} target="_blank" rel="noreferrer"
              className="transition-colors duration-200 hover:text-[#00f5ff]"
              style={{ color: 'rgba(0,245,255,0.6)' }}>
              cyber_sec_pro
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
