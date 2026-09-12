/* ==========================================================================
   KAKKA KULICHAL KOKKAVILLA — MAIN GAME LOGIC (game.js)
   Realistic Bathing Simulation, Interactive Tools, Canvas FX, Timer & Stages
   ========================================================================== */

class KakkaBathGame {
  constructor() {
    this.stage = 1;
    this.maxStages = 8;
    this.cleanliness = 0;
    this.selectedTool = 'water';
    this.timerStarted = false;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isCompleted = false;

    // Interaction states
    this.isPointerDown = false;
    this.lastPointerPos = { x: 0, y: 0 };
    this.scrubDistance = 0;

    // Progression Map: stage -> percentage
    this.stagePercentages = [0, 10, 25, 40, 55, 65, 75, 90, 100];

    // DOM Elements
    this.dom = {};
    
    // Canvas Particles
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrame = null;

    // Procedural Foam Nodes
    this.foamNodes = [];

    // Tool Guidance Text
    this.toolGuidance = {
      water: {
        text: "Click or hold on the crow to pour well water from the brass uruli!",
        note: "Rinsing initial mud..."
      },
      soap: {
        text: "Apply Ayurvedic herbal soap to build a thick, luxurious lather!",
        note: "Covering feathers in rich foam..."
      },
      bodywash: {
        text: "Pump moisturizing herbal body wash to coat the wings and chest!",
        note: "Bubbles multiplying..."
      },
      shampoo: {
        text: "Lather head and neck feathers with fragrant botanical shampoo!",
        note: "Crown lavishly sudsed..."
      },
      scrub: {
        text: "CLICK & DRAG the bath brush across the crow to scrub away dirt!",
        note: "Scrubbing vigorously..."
      },
      razor: {
        text: "Humorous grooming! Gently glide the razor to trim loose muck.",
        note: "100% bird-safe styling..."
      },
      towel: {
        text: "Gently pat & rub with the soft Kerala cotton mundu to dry and polish!",
        note: "Revealing glistening feathers..."
      }
    };
  }

  init() {
    this.cacheDom();
    this.initCanvas();
    this.initAudioButton();
    this.initFoamClusters();
    this.initMudPatches();
    this.bindEvents();
    this.updateHUD();
    this.setTool('water');
    this.startAnimationLoop();
  }

  cacheDom() {
    this.dom.stageBadge = document.getElementById('stage-num');
    this.dom.cleanPct = document.getElementById('clean-pct-val');
    this.dom.progressBar = document.getElementById('clean-progress-bar');
    this.dom.timerDisplay = document.getElementById('timer-val');
    this.dom.crowStage = document.getElementById('crow-stage');
    this.dom.instructionText = document.getElementById('instruction-text');
    this.dom.instructionNote = document.getElementById('instruction-note');
    this.dom.brushFollower = document.getElementById('brush-cursor-follower');

    // Crow Visual Layers
    this.dom.layerClean = document.getElementById('layer-clean');
    this.dom.layerWet = document.getElementById('layer-wet');
    this.dom.layerDirty = document.getElementById('layer-dirty');
    this.dom.layerFoamed = document.getElementById('layer-foamed');
    this.dom.mudContainer = document.getElementById('mud-patches-layer');
    this.dom.foamContainer = document.getElementById('foam-bubbles-layer');

    // Tool Buttons
    this.dom.toolButtons = document.querySelectorAll('.tool-btn');

    // Modal
    this.dom.completionModal = document.getElementById('completion-modal');
    this.dom.modalTime = document.getElementById('modal-final-time');
    this.dom.btnGoResult = document.getElementById('btn-go-result');
  }

  initCanvas() {
    this.canvas = document.getElementById('fx-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas || !this.dom.crowStage) return;
    const rect = this.dom.crowStage.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  initAudioButton() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (!audioBtn) return;
    
    const updateIcon = () => {
      const isMuted = window.soundEngine ? window.soundEngine.isMuted : false;
      if (isMuted) {
        audioBtn.classList.add('muted');
        audioBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        `;
      } else {
        audioBtn.classList.remove('muted');
        audioBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        `;
      }
    };

    updateIcon();
    audioBtn.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.init();
        window.soundEngine.toggleMute();
        updateIcon();
      }
    });
  }

  // Generate 35+ realistic 3D foam bubble clusters covering head, neck, chest, wings, body, legs, stone
  initFoamClusters() {
    if (!this.dom.foamContainer) return;
    this.dom.foamContainer.innerHTML = '';
    this.foamNodes = [];

    // Anatomical foam coverage points across crow
    const positions = [
      // Head & Crown
      { x: 38, y: 12, s: 42, delay: 0 },
      { x: 44, y: 8, s: 48, delay: 0.05 },
      { x: 50, y: 10, s: 38, delay: 0.1 },
      { x: 32, y: 18, s: 36, delay: 0.15 },
      // Beak base
      { x: 28, y: 22, s: 28, delay: 0.2 },
      // Neck & Throat
      { x: 34, y: 26, s: 52, delay: 0.1 },
      { x: 42, y: 28, s: 58, delay: 0.15 },
      { x: 48, y: 24, s: 46, delay: 0.2 },
      { x: 38, y: 35, s: 62, delay: 0.25 },
      // Chest
      { x: 32, y: 44, s: 66, delay: 0.1 },
      { x: 40, y: 48, s: 72, delay: 0.2 },
      { x: 48, y: 46, s: 68, delay: 0.15 },
      { x: 36, y: 56, s: 75, delay: 0.3 },
      { x: 45, y: 58, s: 70, delay: 0.25 },
      // Wings & Back
      { x: 58, y: 34, s: 55, delay: 0.1 },
      { x: 65, y: 42, s: 64, delay: 0.15 },
      { x: 72, y: 52, s: 58, delay: 0.2 },
      { x: 78, y: 64, s: 52, delay: 0.25 },
      { x: 82, y: 74, s: 45, delay: 0.3 },
      // Belly & Flanks
      { x: 52, y: 66, s: 60, delay: 0.2 },
      { x: 42, y: 68, s: 54, delay: 0.25 },
      // Thighs & Legs
      { x: 48, y: 76, s: 42, delay: 0.3 },
      { x: 60, y: 78, s: 38, delay: 0.35 },
      { x: 45, y: 82, s: 32, delay: 0.4 },
      { x: 62, y: 84, s: 30, delay: 0.4 },
      // Stone Platform Suds Runoff
      { x: 25, y: 88, s: 48, delay: 0.2 },
      { x: 35, y: 90, s: 62, delay: 0.25 },
      { x: 50, y: 92, s: 70, delay: 0.3 },
      { x: 68, y: 91, s: 64, delay: 0.35 },
      { x: 80, y: 89, s: 52, delay: 0.4 },
      // Extra Micro bubbles
      { x: 36, y: 15, s: 22, delay: 0.1 },
      { x: 46, y: 38, s: 26, delay: 0.2 },
      { x: 56, y: 50, s: 24, delay: 0.25 },
      { x: 38, y: 62, s: 25, delay: 0.3 }
    ];

    positions.forEach((pos, idx) => {
      const bubble = document.createElement('div');
      bubble.className = 'foam-cluster';
      bubble.style.width = `${pos.s}px`;
      bubble.style.height = `${pos.s}px`;
      bubble.style.left = `${pos.x}%`;
      bubble.style.top = `${pos.y}%`;
      bubble.style.transitionDelay = `${pos.delay}s`;
      bubble.dataset.index = idx;
      this.dom.foamContainer.appendChild(bubble);
      this.foamNodes.push(bubble);
    });
  }

  // Generate realistic dried mud patches overlay that fade as cleaned
  initMudPatches() {
    if (!this.dom.mudContainer) return;
    this.dom.mudContainer.innerHTML = '';
    
    const mudPoints = [
      { x: 26, y: 22, w: 28, h: 22, r: -15 },
      { x: 38, y: 30, w: 42, h: 32, r: 12 },
      { x: 36, y: 46, w: 60, h: 48, r: 25 },
      { x: 44, y: 55, w: 55, h: 40, r: -10 },
      { x: 62, y: 44, w: 75, h: 50, r: 35 },
      { x: 74, y: 62, w: 65, h: 42, r: 40 },
      { x: 48, y: 80, w: 35, h: 25, r: 5 },
      { x: 65, y: 82, w: 32, h: 22, r: -8 }
    ];

    mudPoints.forEach((mp, i) => {
      const patch = document.createElement('div');
      patch.className = 'mud-patch';
      patch.style.left = `${mp.x}%`;
      patch.style.top = `${mp.y}%`;
      patch.style.width = `${mp.w}px`;
      patch.style.height = `${mp.h}px`;
      patch.style.transform = `rotate(${mp.r}deg)`;
      patch.id = `mud-patch-${i}`;
      this.dom.mudContainer.appendChild(patch);
    });
  }

  bindEvents() {
    // Tool buttons selection
    this.dom.toolButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = btn.dataset.tool;
        this.setTool(tool);
        this.triggerToolImmediateFeedback(tool);
      });
    });

    // Pointer events on crow stage
    const stage = this.dom.crowStage;
    if (stage) {
      stage.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      window.addEventListener('pointermove', (e) => this.onPointerMove(e));
      window.addEventListener('pointerup', () => this.onPointerUp());
      window.addEventListener('pointercancel', () => this.onPointerUp());
    }

    // Modal result button
    if (this.dom.btnGoResult) {
      this.dom.btnGoResult.addEventListener('click', () => {
        window.location.href = 'result.html';
      });
    }
  }

  setTool(tool) {
    this.selectedTool = tool;

    // Update active button state
    this.dom.toolButtons.forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update instruction text
    const guide = this.toolGuidance[tool];
    if (guide && this.dom.instructionText && this.dom.instructionNote) {
      this.dom.instructionText.innerHTML = guide.text;
      this.dom.instructionNote.textContent = `— ${guide.note}`;
    }

    // Custom cursor handling for Scrub
    if (tool === 'scrub') {
      this.dom.crowStage.classList.add('scrubbing-active');
      if (this.dom.brushFollower) this.dom.brushFollower.style.display = 'block';
    } else {
      this.dom.crowStage.classList.remove('scrubbing-active');
      if (this.dom.brushFollower) this.dom.brushFollower.style.display = 'none';
    }
  }

  startTimer() {
    if (this.timerStarted) return;
    this.timerStarted = true;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const finalFormatted = this.formatTime(this.timerSeconds);
    sessionStorage.setItem('kakka_final_time', finalFormatted);
    sessionStorage.setItem('kakka_final_seconds', this.timerSeconds);
    sessionStorage.setItem('kakka_cleanliness', '100%');
    localStorage.setItem('kakka_final_time', finalFormatted);
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${pad(mins)}:${pad(secs)}`;
  }

  updateTimerDisplay() {
    if (this.dom.timerDisplay) {
      this.dom.timerDisplay.textContent = this.formatTime(this.timerSeconds);
    }
  }

  onPointerDown(e) {
    this.isPointerDown = true;
    this.startTimer();
    if (window.soundEngine) window.soundEngine.init();

    const stageRect = this.dom.crowStage.getBoundingClientRect();
    const x = e.clientX - stageRect.left;
    const y = e.clientY - stageRect.top;
    this.lastPointerPos = { x, y };

    this.executeToolAction(x, y);
  }

  onPointerMove(e) {
    if (this.dom.brushFollower && this.selectedTool === 'scrub') {
      this.dom.brushFollower.style.left = `${e.clientX}px`;
      this.dom.brushFollower.style.top = `${e.clientY}px`;
    }

    if (!this.isPointerDown) return;

    const stageRect = this.dom.crowStage.getBoundingClientRect();
    const x = e.clientX - stageRect.left;
    const y = e.clientY - stageRect.top;

    // Check if pointer is within the crow stage bounds
    if (x >= 0 && x <= stageRect.width && y >= 0 && y <= stageRect.height) {
      const dist = Math.hypot(x - this.lastPointerPos.x, y - this.lastPointerPos.y);
      if (dist > 12) {
        this.executeToolAction(x, y);
        this.lastPointerPos = { x, y };
      }
    }
  }

  onPointerUp() {
    this.isPointerDown = false;
  }

  triggerToolImmediateFeedback(tool) {
    this.startTimer();
    if (window.soundEngine) window.soundEngine.init();

    const stageRect = this.dom.crowStage.getBoundingClientRect();
    const centerX = stageRect.width * 0.5;
    const centerY = stageRect.height * 0.45;

    this.executeToolAction(centerX, centerY);
  }

  // Execute tool physics, audio, visual layer adjustments and stage progress
  executeToolAction(x, y) {
    if (this.isCompleted) return;

    switch (this.selectedTool) {
      case 'water':
        this.actionWater(x, y);
        break;
      case 'soap':
        this.actionSoap(x, y);
        break;
      case 'bodywash':
        this.actionBodyWash(x, y);
        break;
      case 'shampoo':
        this.actionShampoo(x, y);
        break;
      case 'scrub':
        this.actionScrub(x, y);
        break;
      case 'razor':
        this.actionRazor(x, y);
        break;
      case 'towel':
        this.actionTowel(x, y);
        break;
    }
  }

  // 1. WATER: shower stream, splashes, droplets, washes loose dirt, wets feathers
  actionWater(x, y) {
    if (window.soundEngine) window.soundEngine.playWater();

    // Spawn waterfall stream and splash particles
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        type: 'water_stream',
        x: x + (Math.random() * 40 - 20),
        y: Math.max(0, y - 100 - Math.random() * 80),
        vx: (Math.random() - 0.5) * 2,
        vy: 10 + Math.random() * 8,
        radius: 2.5 + Math.random() * 3,
        color: 'rgba(210, 240, 255, 0.75)',
        alpha: 0.8,
        life: 1,
        targetY: y + (Math.random() * 30 - 15)
      });
    }

    // Water splash ripples on hit
    for (let j = 0; j < 14; j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      this.particles.push({
        type: 'splash',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        radius: 2 + Math.random() * 2.5,
        color: 'rgba(230, 245, 255, 0.85)',
        alpha: 0.9,
        life: 1
      });
    }

    // Advance to Stage 1 (10%) or if lathered, rinse to Stage 7 (90%)
    if (this.stage < 2) {
      this.advanceToStage(1); // 10%
    } else if (this.stage >= 6 && this.stage < 7) {
      this.advanceToStage(7); // 90% (Rinse before towel)
      this.rinseFoam();
    }
  }

  // 2. SOAP: thick white lather blooming across the crow's body
  actionSoap(x, y) {
    if (window.soundEngine) window.soundEngine.playSoap();

    // Create soap bubbles in canvas
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        type: 'bubble',
        x: x + (Math.random() * 50 - 25),
        y: y + (Math.random() * 50 - 25),
        vx: (Math.random() - 0.5) * 2,
        vy: - (Math.random() * 2 + 1),
        radius: 6 + Math.random() * 12,
        color: '#ffffff',
        alpha: 0.9,
        life: 1
      });
    }

    // Reveal 3D foam clusters
    this.foamNodes.forEach(node => {
      node.classList.add('visible');
    });

    if (this.stage < 2) {
      this.advanceToStage(2); // 25%
    }
  }

  // 3. BODY WASH: extra bubbles and silky lather over body and wings
  actionBodyWash(x, y) {
    if (window.soundEngine) window.soundEngine.playBodyWash();

    for (let i = 0; i < 22; i++) {
      this.particles.push({
        type: 'bubble',
        x: x + (Math.random() * 60 - 30),
        y: y + (Math.random() * 60 - 30),
        vx: (Math.random() - 0.5) * 3,
        vy: - (Math.random() * 2.5 + 1.2),
        radius: 8 + Math.random() * 14,
        color: '#f0fbf6',
        alpha: 0.95,
        life: 1
      });
    }

    this.foamNodes.forEach(node => node.classList.add('visible'));

    if (this.stage < 3) {
      this.advanceToStage(3); // 40%
    }
  }

  // 4. SHAMPOO: thick foam crown on head and neck
  actionShampoo(x, y) {
    if (window.soundEngine) window.soundEngine.playShampoo();

    const stageRect = this.dom.crowStage.getBoundingClientRect();
    const headX = stageRect.width * 0.42;
    const headY = stageRect.height * 0.2;

    for (let i = 0; i < 25; i++) {
      this.particles.push({
        type: 'bubble',
        x: headX + (Math.random() * 70 - 35),
        y: headY + (Math.random() * 50 - 25),
        vx: (Math.random() - 0.5) * 2.2,
        vy: - (Math.random() * 2 + 0.8),
        radius: 7 + Math.random() * 12,
        color: '#ffffff',
        alpha: 0.95,
        life: 1
      });
    }

    this.foamNodes.forEach(node => node.classList.add('visible'));

    if (this.stage < 4) {
      this.advanceToStage(4); // 55%
    }
  }

  // 5. SCRUB: drag brush across crow to physically scrub dirt & churn foam
  actionScrub(x, y) {
    if (window.soundEngine) window.soundEngine.playScrub();

    // Brush bristles scrub particles
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        type: 'scrub_spark',
        x: x + (Math.random() * 30 - 15),
        y: y + (Math.random() * 30 - 15),
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: 3 + Math.random() * 3,
        color: 'rgba(255, 255, 255, 0.85)',
        alpha: 1,
        life: 0.6
      });
    }

    // Disintegrate nearest mud patch
    const mudPatches = document.querySelectorAll('.mud-patch');
    if (mudPatches.length > 0) {
      const randomIdx = Math.floor(Math.random() * mudPatches.length);
      const patch = mudPatches[randomIdx];
      if (patch) {
        patch.style.opacity = '0';
        patch.style.transform += ' scale(0.4)';
      }
    }

    if (this.stage < 5) {
      this.advanceToStage(5); // 65%
    }
  }

  // 6. RAZOR / GROOMING: funny styling, gently removes stray muck, safe barber clicks
  actionRazor(x, y) {
    if (window.soundEngine) window.soundEngine.playRazor();

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        type: 'groom_star',
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 4,
        color: '#f5df9e',
        alpha: 1,
        life: 0.8
      });
    }

    // Clear remaining mud patches completely
    const mudPatches = document.querySelectorAll('.mud-patch');
    mudPatches.forEach(p => p.style.opacity = '0');

    if (this.stage < 6) {
      this.advanceToStage(6); // 75%
    }
  }

  // 7. TOWEL: dry crow, wipe away foam & water droplets, reveal glossy clean feathers
  actionTowel(x, y) {
    if (window.soundEngine) window.soundEngine.playTowel();

    // Wipe away foam
    this.rinseFoam();

    // Towel drying sparks and sparkles
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        type: 'groom_star',
        x: x + (Math.random() * 50 - 25),
        y: y + (Math.random() * 50 - 25),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: 4 + Math.random() * 2,
        color: '#ffffff',
        alpha: 0.9,
        life: 0.7
      });
    }

    // Towel finishes game at Stage 8 (100%)
    if (this.stage < 8) {
      this.advanceToStage(8); // 100%!
    }
  }

  rinseFoam() {
    this.foamNodes.forEach(node => {
      node.classList.remove('visible');
    });
  }

  advanceToStage(targetStage) {
    if (targetStage <= this.stage && targetStage !== 8) return;
    this.stage = targetStage;
    this.cleanliness = this.stagePercentages[this.stage];
    this.updateHUD();
    this.updateCrowVisuals();

    if (this.cleanliness >= 100 && !this.isCompleted) {
      this.completeGame();
    }
  }

  updateHUD() {
    if (this.dom.stageBadge) {
      this.dom.stageBadge.textContent = `STAGE ${this.stage}/${this.maxStages}`;
    }
    if (this.dom.cleanPct) {
      this.dom.cleanPct.textContent = `${this.cleanliness}%`;
    }
    if (this.dom.progressBar) {
      this.dom.progressBar.style.width = `${this.cleanliness}%`;
    }
  }

  // Adjust layer opacities dynamically to create seamless realistic transitions
  updateCrowVisuals() {
    const p = this.cleanliness;

    if (p < 25) {
      // 0 - 10%: Initial state to water rinse
      this.dom.layerDirty.style.opacity = (1 - (p / 25) * 0.3).toFixed(2);
      this.dom.layerWet.style.opacity = (p / 25).toFixed(2);
      this.dom.layerFoamed.style.opacity = '0';
    } else if (p < 65) {
      // 25 - 55%: Soap, body wash, shampoo
      this.dom.layerDirty.style.opacity = '0.3';
      this.dom.layerWet.style.opacity = '0.7';
      this.dom.layerFoamed.style.opacity = '0.95';
    } else if (p < 90) {
      // 65 - 75%: Scrubbed & groomed
      this.dom.layerDirty.style.opacity = '0.1';
      this.dom.layerWet.style.opacity = '0.85';
      this.dom.layerFoamed.style.opacity = '0.5';
    } else if (p < 100) {
      // 90%: Rinsed
      this.dom.layerDirty.style.opacity = '0';
      this.dom.layerWet.style.opacity = '1';
      this.dom.layerFoamed.style.opacity = '0';
    } else {
      // 100%: Clean, dried, glossy iridescent plumage!
      this.dom.layerDirty.style.opacity = '0';
      this.dom.layerWet.style.opacity = '0';
      this.dom.layerFoamed.style.opacity = '0';
      this.dom.layerClean.style.opacity = '1';
      this.spawnCompletionSparkles();
    }
  }

  spawnCompletionSparkles() {
    const stage = this.dom.crowStage;
    if (!stage) return;
    for (let i = 0; i < 8; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-fx';
      sparkle.style.left = `${20 + Math.random() * 60}%`;
      sparkle.style.top = `${15 + Math.random() * 70}%`;
      sparkle.style.animationDelay = `${i * 0.2}s`;
      stage.appendChild(sparkle);
    }
  }

  completeGame() {
    this.isCompleted = true;
    this.stopTimer();

    if (window.soundEngine) {
      window.soundEngine.playSuccess();
    }

    if (this.dom.modalTime) {
      this.dom.modalTime.textContent = this.formatTime(this.timerSeconds);
    }

    // Show celebratory transition modal
    setTimeout(() => {
      if (this.dom.completionModal) {
        this.dom.completionModal.classList.add('active');
      }
    }, 1200);
  }

  // Continuous Canvas Particle Simulation
  startAnimationLoop() {
    const render = () => {
      this.updateParticles();
      this.renderParticles();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'water_stream') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        if (p.y >= p.targetY) {
          // Trigger small ripple and die
          p.life = 0;
        }
      } else if (p.type === 'splash') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.alpha -= 0.035;
        if (p.alpha <= 0) p.life = 0;
      } else if (p.type === 'bubble') {
        p.x += p.vx + Math.sin(p.y * 0.05) * 0.8;
        p.y += p.vy;
        p.alpha -= 0.015;
        if (p.alpha <= 0) p.life = 0;
      } else if (p.type === 'scrub_spark' || p.type === 'groom_star') {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.alpha -= 0.04;
        if (p.alpha <= 0) p.life = 0;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  renderParticles() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'water_stream' || p.type === 'splash') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'bubble') {
        // Bubble with gradient ring and highlight
        const grad = this.ctx.createRadialGradient(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.1, p.x, p.y, p.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.7, 'rgba(230, 250, 245, 0.6)');
        grad.addColorStop(1, 'rgba(200, 240, 230, 0.2)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      } else if (p.type === 'scrub_spark' || p.type === 'groom_star') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.kakkaGame = new KakkaBathGame();
  window.kakkaGame.init();
});
