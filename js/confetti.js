/**
 * confetti.js - Lightweight Canvas Confetti Engine
 */

class ConfettiLauncher {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrame = null;
    this.isActive = false;
  }

  _initCanvas() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'confetti-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '99999';
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this._resize();
      window.addEventListener('resize', () => this._resize());
    }
  }

  _resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  launch(options = {}) {
    this._initCanvas();
    const count = options.count || 120;
    const colors = options.colors || ['#FF6584', '#6C63FF', '#FFB6C1', '#A78BFA', '#FBBF24', '#34D399', '#EC4899', '#60A5FA'];
    const emojis = options.emojis || ['💖', '✨', '🎉', '⭐', '🦄', '🌸', '👑'];
    const useEmojis = options.useEmojis || false;

    const width = this.canvas.width;
    const height = this.canvas.height;

    for (let i = 0; i < count; i++) {
      const isEmoji = useEmojis && Math.random() > 0.6;
      this.particles.push({
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() * -18) - 4,
        size: Math.random() * 9 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        gravity: 0.35,
        drag: 0.96,
        isEmoji: isEmoji,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }

    if (!this.isActive) {
      this.isActive = true;
      this._animate();
    }
  }

  launchBurst(x, y) {
    this._initCanvas();
    const count = 40;
    const colors = ['#FF6584', '#6C63FF', '#F472B6', '#FBBF24', '#38BDF8'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 8 + 4;
      this.particles.push({
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        gravity: 0.25,
        drag: 0.95,
        shape: Math.random() > 0.4 ? 'circle' : 'rect'
      });
    }

    if (!this.isActive) {
      this.isActive = true;
      this._animate();
    }
  }

  _animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.008;

      if (p.opacity <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.isEmoji) {
        this.ctx.font = `${p.size * 2}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(p.emoji, 0, 0);
      } else {
        this.ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        }
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrame = requestAnimationFrame(() => this._animate());
    } else {
      this.isActive = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.confetti = new ConfettiLauncher();
