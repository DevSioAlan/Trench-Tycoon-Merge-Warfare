export class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.particles = [];
    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  emit(x, y, color, type = 'spark', count = 10) {
    if (!this.ctx) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (type === 'explosion' ? 15 : 8),
        vy: (Math.random() - 0.5) * 10 - (type === 'spark' ? 2 : 0),
        life: 1, color,
        size: type === 'explosion' ? Math.random() * 6 + 3 : Math.random() * 3 + 1,
        type
      });
    }
  }

  update() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.type === 'spark') p.vy += 0.4;
      p.life -= p.type === 'explosion' ? 0.04 : 0.02;

      if (p.life <= 0) { this.particles.splice(i, 1); continue; }

      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.update());
  }
}