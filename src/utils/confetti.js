// ============================================================
// 🎉 BungOiAnGi – Confetti Particle System
// ============================================================

const COLORS = [
  '#FF6B35','#FFB347','#FF4757','#FF2D55',
  '#2ED573','#1E90FF','#FF6EB4','#FFD700',
  '#7BED9F','#ECCC68','#A29BFE','#FD79A8',
];
const EMOJIS = ['🍜','🍱','🌶️','🔥','🍚','🎉','⭐','💥','🎊','✨'];

let particles = [];
let animId = null;
let canvas, ctx2d;

function ensure() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    ctx2d = canvas.getContext('2d');
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle(x, y, options = {}) {
  const isMini = options.mini;
  const isEmoji = !isMini && Math.random() < 0.1;
  return {
    x: x ?? Math.random() * window.innerWidth,
    y: y ?? -10,
    vx: (Math.random() - 0.5) * (options.spread ?? 8),
    vy: Math.random() * (options.upForce ?? 4) + 2,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * (isMini ? 12 : 8),
    w: isMini ? Math.random() * 7 + 3 : Math.random() * 14 + 6,
    h: isMini ? Math.random() * 4 + 2 : Math.random() * 8 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    life: 1,
    decay: Math.random() * (options.decay ?? 0.006) + 0.002,
    type: isEmoji ? 'emoji' : (Math.random() > 0.4 ? 'rect' : 'circle'),
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    scale: isMini ? 0.7 : (Math.random() * 0.5 + 0.7),
  };
}

function step() {
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.vx *= 0.985;
    p.rot += p.rotV;
    p.life -= p.decay;

    ctx2d.save();
    ctx2d.globalAlpha = Math.max(0, p.life);
    ctx2d.translate(p.x, p.y);
    ctx2d.rotate((p.rot * Math.PI) / 180);
    ctx2d.scale(p.scale, p.scale);

    if (p.type === 'emoji') {
      ctx2d.font = '16px serif';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillText(p.emoji, 0, 0);
    } else if (p.type === 'circle') {
      ctx2d.fillStyle = p.color;
      ctx2d.beginPath();
      ctx2d.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx2d.fill();
    } else {
      ctx2d.fillStyle = p.color;
      ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx2d.restore();
  });
  if (particles.length > 0) {
    animId = requestAnimationFrame(step);
  } else {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    animId = null;
  }
}

// Standard burst (used by fav saves etc.)
export function burst(x, y, count = 60) {
  ensure();
  if (animId) cancelAnimationFrame(animId);
  for (let i = 0; i < count; i++) {
    const p = createParticle(x, y, { spread: 14, decay: 0.006 });
    p.vy = Math.random() * -12 - 3;
    p.vx = (Math.random() - 0.5) * 18;
    particles.push(p);
  }
  animId = requestAnimationFrame(step);
}

// Mega BUP! explosion — punchy 2-wave burst, not overwhelming
export function megaBurst(x, y) {
  ensure();
  if (animId) cancelAnimationFrame(animId);

  // Wave 1: radial ring fan — fast outward
  const total = 60;
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2;
    const speed = Math.random() * 12 + 6;
    const p = createParticle(x, y, { decay: 0.006 });
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 4;
    p.w = Math.random() * 12 + 5;
    p.h = Math.random() * 8 + 3;
    particles.push(p);
  }

  // Wave 2 (delayed 80ms): upward confetti shower
  setTimeout(() => {
    ensure();
    for (let i = 0; i < 50; i++) {
      const p = createParticle(x, y, { spread: 22, decay: 0.005 });
      p.vy = Math.random() * -16 - 5;
      p.vx = (Math.random() - 0.5) * 24;
      particles.push(p);
    }
    if (particles.length > 0) animId = requestAnimationFrame(step);
  }, 80);

  animId = requestAnimationFrame(step);
}

export function rain(count = 120) {
  ensure();
  if (animId) cancelAnimationFrame(animId);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      particles.push(createParticle());
      if (!animId || particles.length === 1) {
        animId = requestAnimationFrame(step);
      }
    }, i * 18);
  }
}
