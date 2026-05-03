import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

const LOGO = 'https://media.mrfrankofc.gleeze.com/media/IMG-20260503-WA0094.jpg';
const CONTACT = '+923417022212';

const MatrixRain = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = '01アイウエオカキクケコCSP<>{}[]|=+*/\\';
    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = 'rgba(6,9,26,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,245,255,0.18)';
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
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-50" />;
};

const FloatingOrb = ({ size, x, y, color, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ width: size, height: size, left: x, top: y, background: `radial-gradient(circle, ${color}35 0%, transparent 70%)`, filter: `blur(${size / 3}px)` }}
    animate={{ y: [0, -30, 0], opacity: [0.5, 0.9, 0.5] }}
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
      border: `1px solid ${color}60`,
      boxShadow: `0 0 25px ${color}30, inset 0 0 25px ${color}15`
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
      className="glass-bright neon-border rounded-xl text-center p-5 card-hover">
      <div className="font-display text-2xl sm:text-3xl font-bold neon-cyan">{prefix}{count.toLocaleString()}{suffix}</div>
      <div className="text-xs tracking-widest text-gray-300 mt-2 uppercase">{label}</div>
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
    features: ['5 Linked Numbers', 'Basic Dashboard', 'Standard Security', 'Community Support', 'Basic Analytics'],
    cta: 'Start Free', ctaLink: '/signup', isFree: true
  },
  {
    plan: 'PRO', color: '#8b5cf6', popular: true,
    features: ['25 Linked Numbers', 'Advanced Dashboard', 'Enhanced Security', 'Priority Support', 'Full Analytics', 'API Access', 'Custom Bot Names'],
    cta: 'Contact for PRO', isFree: false
  },
  {
    plan: 'ENTERPRISE', color: '#ff00ff',
    features: ['Unlimited Numbers', 'Control Center', 'Military Security', 'Dedicated Support', 'AI Analytics', 'Full API Access', 'White Label', 'SLA Guarantee'],
    cta: 'Contact for Enterprise', isFree: false
  }
];

const TESTIMONIALS = [
  { name: 'Alex_X', role: 'Bot Developer', text: 'CYBERSECPRO transformed how I manage my bot infrastructure. The holographic UI is insane.', rating: 5 },
  { name: 'CyberNinja', role: 'Tech Lead', text: 'Best SaaS platform I\'ve ever used. The security features are unmatched.', rating: 5 },
  { name: 'NexusOp', role: 'System Admin', text: 'Migrated 50+ numbers seamlessly. The admin panel is a game changer.', rating: 5 },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  return (
    <div className="relative min-h-screen overflow-x-hidden scan-lines" style={{ background: 'linear-gradient(135deg, #06091a 0%, #0d0820 40%, #060d1e 100%)' }}>
      <MatrixRain />

      <FloatingOrb size={500} x="5%" y="0%" color="#00f5ff" delay={0} />
      <FloatingOrb size={400} x="65%" y="5%" color="#8b5cf6" delay={2} />
      <FloatingOrb size={350} x="80%" y="55%" color="#ff00ff" delay={4} />
      <FloatingOrb size={450} x="0%" y="65%" color="#0080ff" delay={1} />
      <FloatingOrb size={300} x="40%" y="40%" color="#00ff88" delay={3} />

      <div className="fixed inset-0 cyber-grid-bright pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-8 py-4 glass-bright border-b border-[rgba(0,245,255,0.2)]">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="CYBERSECPRO" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded" style={{ filter: 'drop-shadow(0 0 10px #00f5ff)' }} />
          <span className="font-display font-bold text-base sm:text-lg tracking-widest neon-cyan">CYBERSECPRO</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Testimonials'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="font-mono text-xs tracking-widest text-gray-300 hover:text-[#00f5ff] transition-colors uppercase">{item}</a>
          ))}
        </div>
        <div className="hidden md:flex gap-3">
          <Link to="/login" className="btn-neon text-xs px-5 py-2 rounded">LOGIN</Link>
          <Link to="/signup" className="btn-neon-solid text-xs px-5 py-2 rounded">SIGNUP</Link>
        </div>
        <button onClick={() => setMenuOpen(p => !p)} className="md:hidden text-[#00f5ff] text-2xl">☰</button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-40 md:hidden glass-bright border-b border-[rgba(0,245,255,0.2)] px-4 py-4 flex flex-col gap-4">
          {['Features', 'Pricing', 'Testimonials'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
              className="font-mono text-sm tracking-widest text-gray-300 hover:text-[#00f5ff] transition-colors uppercase py-2">{item}</a>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-neon text-sm py-3 rounded text-center">LOGIN</Link>
          <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn-neon-solid text-sm py-3 rounded text-center">SIGNUP</Link>
        </motion.div>
      )}

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute hidden sm:block" style={{ width: 600, height: 600, left: '50%', top: '50%', marginLeft: -300, marginTop: -300 }}>
          <HUDRing size={600} color="#00f5ff" duration={20} />
          <HUDRing size={480} color="#8b5cf6" duration={15} reverse />
          <HUDRing size={360} color="#ff00ff" duration={10} />
          <HUDRing size={240} color="#00f5ff" duration={7} reverse />
        </div>

        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }} className="relative z-10 max-w-5xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-block mb-6 px-4 py-2 glass-bright neon-border rounded-full">
            <span className="font-mono text-xs tracking-widest text-[#00f5ff]">⚡ NEXT-GEN BOT MANAGEMENT PLATFORM</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-display font-black mb-4 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}>
            <span className="gradient-text animate-neon-flicker">CYBER</span>
            <span className="text-white">SEC</span>
            <span className="gradient-text">PRO</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="font-mono text-[#00f5ff] text-xs sm:text-base tracking-widest mb-4">
            [ HOLOGRAPHIC CONTROL CENTER — BOT MANAGEMENT SYSTEM ]
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="font-body text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed px-2">
            The most advanced cyberpunk SaaS platform for managing bot numbers, real-time monitoring, and AI-powered automation.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn-neon-solid w-full sm:w-auto px-8 sm:px-10 py-4 text-sm rounded font-display tracking-widest">
                ⚡ ENTER CYBERSECPRO
              </motion.button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn-neon w-full sm:w-auto px-8 sm:px-10 py-4 text-sm rounded font-display tracking-widest">
                EXPLORE FEATURES
              </motion.button>
            </a>
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest text-gray-500">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#00f5ff] to-transparent" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <CounterCard value="10000" label="Active Users" suffix="+" />
          <CounterCard value="50000" label="Linked Numbers" suffix="+" />
          <CounterCard value="99" label="Uptime" suffix="%" />
          <CounterCard value="150" label="Countries" suffix="+" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <p className="font-mono text-xs tracking-widest text-gray-500 mb-3">// CAPABILITIES</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl gradient-text">SYSTEM FEATURES</h2>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent" />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="glass-bright rounded-xl p-6 card-hover"
                style={{ border: `1px solid ${f.color}35`, boxShadow: `0 0 25px ${f.color}18` }}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-display font-bold text-base mb-3" style={{ color: f.color }}>{f.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-body">{f.desc}</p>
                <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${f.color}60, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <p className="font-mono text-xs tracking-widest text-gray-500 mb-3">// ACCESS TIERS</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl gradient-text">PRICING MATRIX</h2>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent" />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PRICING.map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="relative rounded-xl p-6 card-hover flex flex-col"
                style={{
                  background: `linear-gradient(145deg, ${tier.color}12, rgba(6,9,26,0.95))`,
                  border: `1px solid ${tier.color}40`,
                  boxShadow: tier.popular ? `0 0 50px ${tier.color}25` : `0 0 20px ${tier.color}10`
                }}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-display tracking-widest rounded-full"
                    style={{ background: tier.color, color: '#06091a' }}>
                    MOST POPULAR
                  </div>
                )}
                <div className="font-display text-xl font-bold tracking-widest mb-3" style={{ color: tier.color }}>{tier.plan}</div>

                {tier.isFree ? (
                  <div className="mb-6">
                    <span className="font-display font-black text-4xl text-white">FREE</span>
                    <span className="font-mono text-gray-400 text-sm ml-2">forever</span>
                  </div>
                ) : (
                  <div className="mb-6 glass-bright rounded-lg px-4 py-3 text-center" style={{ border: `1px solid ${tier.color}30` }}>
                    <div className="font-mono text-xs text-gray-400 mb-1 tracking-widest">FOR PRICING CONTACT</div>
                    <a href={`https://wa.me/${CONTACT.replace(/\+/g, '')}`} target="_blank" rel="noreferrer"
                      className="font-display font-bold text-lg" style={{ color: tier.color }}>
                      {CONTACT}
                    </a>
                  </div>
                )}

                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <span style={{ color: tier.color }} className="text-sm">◆</span>
                      <span className="font-mono text-xs text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>

                {tier.isFree ? (
                  <Link to="/signup">
                    <button className="w-full py-3 rounded font-display text-xs tracking-widest transition-all hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${tier.color}35, ${tier.color}15)`, border: `1px solid ${tier.color}70`, color: tier.color, boxShadow: `0 0 20px ${tier.color}25` }}>
                      {tier.cta}
                    </button>
                  </Link>
                ) : (
                  <a href={`https://wa.me/${CONTACT.replace(/\+/g, '')}`} target="_blank" rel="noreferrer">
                    <button className="w-full py-3 rounded font-display text-xs tracking-widest transition-all hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${tier.color}35, ${tier.color}15)`, border: `1px solid ${tier.color}70`, color: tier.color, boxShadow: `0 0 20px ${tier.color}25` }}>
                      📱 {tier.cta}
                    </button>
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <p className="font-mono text-xs tracking-widest text-gray-500 mb-3">// USER LOGS</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl gradient-text">TESTIMONIALS</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass-bright neon-border rounded-xl p-6">
                <div className="flex text-[#00f5ff] mb-4 text-lg">{Array(t.rating).fill('★').join('')}</div>
                <p className="font-mono text-xs text-gray-300 leading-relaxed mb-4">"{t.text}"</p>
                <div className="border-t border-[rgba(0,245,255,0.15)] pt-3">
                  <div className="font-display text-sm text-[#00f5ff]">{t.name}</div>
                  <div className="font-mono text-xs text-gray-500">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 sm:py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass-bright neon-border rounded-2xl p-8 sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at center, rgba(0,245,255,0.25) 0%, transparent 70%)' }} />
          <h2 className="font-display font-black text-3xl sm:text-5xl gradient-text mb-6 relative z-10">READY TO ENTER?</h2>
          <p className="font-mono text-gray-300 text-sm mb-10 tracking-wider relative z-10">Join thousands of operators using CYBERSECPRO to manage their bot infrastructure</p>
          <Link to="/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-neon-solid px-10 sm:px-12 py-4 rounded font-display text-sm tracking-widest relative z-10">
              ⚡ INITIALIZE ACCOUNT
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(0,245,255,0.2)] py-10 px-4 sm:px-8"
        style={{ background: 'rgba(6,9,26,0.9)' }}>
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="CYBERSECPRO" className="w-8 h-8 object-contain rounded" style={{ filter: 'drop-shadow(0 0 8px #00f5ff)' }} />
            <span className="font-display text-base tracking-widest text-[#00f5ff]">CYBERSECPRO</span>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm text-gray-300 mb-1">
              Created by <span className="text-[#00f5ff] font-bold">CYBERSECPRO</span>
            </div>
            <div className="font-mono text-xs text-gray-500">
              For Premium Plans: <a href={`https://wa.me/${CONTACT.replace(/\+/g, '')}`} target="_blank" rel="noreferrer"
                className="text-[#8b5cf6] hover:text-[#ff00ff] transition-colors">{CONTACT}</a>
            </div>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="font-mono text-xs text-gray-400 hover:text-[#00f5ff] transition-colors">LOGIN</Link>
            <Link to="/signup" className="font-mono text-xs text-gray-400 hover:text-[#00f5ff] transition-colors">SIGNUP</Link>
          </div>
          <div className="font-mono text-xs text-gray-600 text-center">
            © 2026 CYBERSECPRO — FUTURISTIC BOT MANAGEMENT SYSTEM
          </div>
          <div className="font-mono text-xs text-center" style={{ color: 'rgba(0,245,255,0.35)' }}>
            Web by{' '}
            <a href="https://github.com/mrfr8nk" target="_blank" rel="noreferrer"
              className="hover:text-[#00f5ff] transition-colors duration-200"
              style={{ color: 'rgba(0,245,255,0.55)' }}>
              mr frank ofc
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
