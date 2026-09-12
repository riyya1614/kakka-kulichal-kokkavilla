/* =====================================================
   കാക്ക കുളിച്ചാൽ കൊക്കാവില്ല — Game Logic
   ===================================================== */

const CROW_SVG = `
<svg viewBox="0 0 200 200" width="100%" height="100%">
  <g id="crowBody">
    <!-- tail -->
    <polygon points="30,110 5,85 12,125" fill="#111"/>
    <!-- body -->
    <ellipse cx="100" cy="115" rx="55" ry="42" fill="#1c1c1e"/>
    <!-- wing -->
    <ellipse cx="95" cy="115" rx="38" ry="26" fill="#2c2c2e" transform="rotate(-12 95 115)"/>
    <!-- head -->
    <circle cx="150" cy="70" r="30" fill="#1c1c1e"/>
    <!-- beak -->
    <polygon points="176,62 205,72 176,82" fill="#f59e0b"/>
    <!-- eye -->
    <circle cx="158" cy="62" r="6" fill="#fff"/>
    <circle cx="159.5" cy="62" r="3" fill="#000"/>
    <!-- legs -->
    <line x1="95" y1="155" x2="95" y2="180" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    <line x1="120" y1="155" x2="120" y2="180" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    <!-- dirt layer (populated by JS) -->
    <g id="dirtLayer"></g>
  </g>
</svg>`;

const CRANE_SVG = `
<svg viewBox="0 0 200 220" width="100%" height="100%">
  <!-- long legs -->
  <line x1="95" y1="150" x2="90" y2="215" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
  <line x1="120" y1="150" x2="125" y2="215" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
  <!-- body -->
  <ellipse cx="105" cy="125" rx="50" ry="36" fill="#f8fafc"/>
  <!-- black wing tips -->
  <ellipse cx="90" cy="120" rx="32" ry="22" fill="#334155" transform="rotate(-10 90 120)"/>
  <!-- neck -->
  <path d="M140 110 Q165 80 160 45" stroke="#f8fafc" stroke-width="14" fill="none" stroke-linecap="round"/>
  <!-- head -->
  <circle cx="160" cy="42" r="15" fill="#f8fafc"/>
  <!-- beak -->
  <polygon points="172,38 200,44 172,50" fill="#f59e0b"/>
  <!-- eye -->
  <circle cx="163" cy="38" r="3.5" fill="#000"/>
  <!-- crown -->
  <circle cx="152" cy="30" r="4" fill="#dc2626"/>
</svg>`;

const Game = {
  cleanliness: 0,
  tool: 'soap',
  bathStart: 0,
  timerInt: null,
  applying: false,
  lastTick: 0,
  dirtSpots: [],

  TOOL_POWER: { soap: 1.6, water: 2.4, brush: 3.4 },

  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  /* ---------- START ---------- */
  startStory() {
    this.show('screen-story');
    this.buildCrow(document.getElementById('wanderCrow'), true);
    const lines = [
      ['Why am I always dirty? I want to be beautiful like them… 🥺', 2200],
      ['*wanders sadly through the park*', 2200],
      ['Wait… who is THAT? 😳', 1800],
    ];
    const dlg = document.getElementById('dialogue');
    let t = 600;
    lines.forEach(([text, dur]) => {
      setTimeout(() => { dlg.textContent = text; }, t);
      t += dur;
    });
    setTimeout(() => {
      document.getElementById('crane').classList.remove('hidden');
      document.getElementById('craneArt').innerHTML = CRANE_SVG;
    }, t - 1200);
    setTimeout(() => {
      dlg.textContent = 'പോയി കുളിക്കെടാ!! 🫵🛁';
      const v = document.getElementById('voice');
      v.volume = 1; v.play().catch(() => {});
      document.getElementById('beautyBtn').classList.remove('hidden');
    }, t + 800);
  },

  /* ---------- BATH ---------- */
  goBath() {
    this.show('screen-bath');
    this.cleanliness = 0;
    this.buildCrow(document.getElementById('bathCrow'), true);
    this.buildCrow(document.getElementById('startCrow'), true); // keep start screen pretty
    this.bathStart = performance.now();
    this.updateHUD();
    clearInterval(this.timerInt);
    this.timerInt = setInterval(() => this.updateHUD(), 100);
    const crow = document.getElementById('bathCrow');
    crow.onpointerdown = e => { this.applying = true; this.apply(e); };
    crow.onpointermove = e => { if (this.applying) this.apply(e); };
    window.onpointerup = () => this.applying = false;
  },

  buildCrow(holder, dirty) {
    holder.innerHTML = CROW_SVG;
    const layer = holder.querySelector('#dirtLayer');
    layer.innerHTML = '';
    this.dirtSpots = [];
    if (!dirty) return;
    // scatter random mud spots on the crow
    const areas = [
      { cx: 100, cy: 115, rx: 50, ry: 38 },  // body
      { cx: 150, cy: 70,  rx: 26, ry: 26 },  // head
    ];
    for (let i = 0; i < 42; i++) {
      const a = areas[Math.random() < 0.75 ? 0 : 1];
      const ang = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      const x = a.cx + Math.cos(ang) * r * a.rx;
      const y = a.cy + Math.sin(ang) * r * a.ry;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y);
      c.setAttribute('r', 3 + Math.random() * 5);
      c.setAttribute('fill', ['#6b4f2a', '#7c5c33', '#5a4020'][i % 3]);
      c.setAttribute('opacity', 0.85);
      layer.appendChild(c);
      this.dirtSpots.push(c);
    }
  },

  selectTool(tool, btn) {
    this.tool = tool;
    document.querySelectorAll('.tool').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  },

  apply(e) {
    const now = performance.now();
    if (now - this.lastTick < 90) return; // throttle
    this.lastTick = now;

    const power = this.TOOL_POWER[this.tool];
    this.cleanliness = Math.min(100, this.cleanliness + power);
    this.scrubDirt();
    this.spawnBubble(e);
    this.updateHUD();

    if (this.cleanliness >= 100) this.finish();
  },

  scrubDirt() {
    const visible = this.dirtSpots.filter(s => s.style.display !== 'none');
    const toRemove = Math.ceil(visible.length * 0.06) + 1;
    for (let i = 0; i < toRemove && visible.length; i++) {
      visible.splice(Math.floor(Math.random() * visible.length), 1)[0].style.display = 'none';
    }
  },

  spawnBubble(e) {
    const layer = document.getElementById('bubblesLayer');
    const tub = document.querySelector('.tub').getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = 8 + Math.random() * 18;
      b.style.width = b.style.height = size + 'px';
      const px = (e.clientX || tub.left + tub.width / 2) - tub.left + (Math.random() * 60 - 30);
      b.style.left = px + 'px';
      b.style.bottom = (90 + Math.random() * 40) + 'px';
      layer.appendChild(b);
      setTimeout(() => b.remove(), 1500);
    }
  },

  updateHUD() {
    const secs = (performance.now() - this.bathStart) / 1000;
    document.getElementById('timer').textContent = secs.toFixed(1) + 's';
    document.getElementById('dirtPct').textContent = Math.round(100 - this.cleanliness) + '%';
    document.getElementById('meterFill').style.width = this.cleanliness + '%';
    document.getElementById('liveScore').textContent = this.score(secs);
  },

  score(secs) {
    return Math.max(100, Math.round(1000 + Math.max(0, 300 - secs * 5)));
  },

  /* ---------- REVEAL ---------- */
  finish() {
    clearInterval(this.timerInt);
    this.show('screen-reveal');
    const secs = (performance.now() - this.bathStart) / 1000;
    const final = this.score(secs);

    // sparkling clean crow (no dirt)
    const holder = document.getElementById('revealCrow');
    this.buildCrow(holder, false);
    holder.classList.remove('hidden');

    // staggered reveals
    const seq = [
      ['revealTitle', 400], ['revealCrow', 1400], ['stillCrow', 3200],
      ['proverb', 4400], ['moral', 5200], ['results', 6200], ['againBtn', 7000]
    ];
    seq.forEach(([id, delay]) => setTimeout(() => {
      const el = document.getElementById(id);
      el.classList.remove('hidden');
      if (id === 'revealTitle') this.spawnSparkles();
      if (id === 'results') {
        document.getElementById('finalTime').textContent = secs.toFixed(1) + 's';
        document.getElementById('finalScore').textContent = final;
      }
    }, delay));

    // save score (backend if running, else localStorage)
    fetch('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: final, time: +secs.toFixed(1) })
    }).catch(() => {
      const best = JSON.parse(localStorage.getItem('kakka_best') || '0');
      if (final > best) localStorage.setItem('kakka_best', JSON.stringify(final));
    });
  },

  spawnSparkles() {
    const layer = document.getElementById('sparkles');
    layer.innerHTML = '';
    const emojis = ['✨', '⭐', '🌟', '💫'];
    for (let i = 0; i < 24; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.textContent = emojis[i % emojis.length];
      s.style.left = Math.random() * 90 + 5 + '%';
      s.style.top = Math.random() * 80 + 5 + '%';
      s.style.animationDelay = Math.random() * 1.2 + 's';
      layer.appendChild(s);
    }
  },

  reset() {
    ['revealTitle','revealCrow','stillCrow','proverb','moral','results','againBtn']
      .forEach(id => document.getElementById(id).classList.add('hidden'));
    this.show('screen-start');
    this.buildCrow(document.getElementById('startCrow'), true);
  }
};

/* init */
window.onload = () => {
  Game.buildCrow(document.getElementById('startCrow'), true);
};
