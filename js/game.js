// ============================================
// KAKKA KULICHAL KOKKAVILLA — INTERACTIVE GAME LOGIC
// 8 Distinct Bathing Stages, Timer, Particles & Voice Audio
// ============================================

class KakkaBathGame {
  constructor() {
    // Current Game State
    this.stage = 1;
    this.cleanliness = 0;
    this.seconds = 0;
    this.timer = null;
    this.gameFinished = false;
    this.busy = false;

    // Exact required stage order and cleanliness values
    this.stagePercentages = {
      1: 0,
      2: 10,
      3: 25,
      4: 40,
      5: 55,
      6: 65,
      7: 75,
      8: 90,
      final: 100
    };

    // Tool required for each transition:
    // Stage 1 (0%) -> use 'water' -> Stage 2 (10%)
    // Stage 2 (10%) -> use 'soap' -> Stage 3 (25%)
    // Stage 3 (25%) -> use 'bodywash' -> Stage 4 (40%)
    // Stage 4 (40%) -> use 'shampoo' -> Stage 5 (55%)
    // Stage 5 (55%) -> use 'scrub' -> Stage 6 (65%)
    // Stage 6 (65%) -> use 'groom' -> Stage 7 (75%)
    // Stage 7 (75%) -> use 'rinse' -> Stage 8 (90%)
    // Stage 8 (90%) -> use 'towel' -> Final (100%)
    this.stageTools = {
      1: "water",
      2: "soap",
      3: "bodywash",
      4: "shampoo",
      5: "scrub",
      6: "groom",
      7: "rinse",
      8: "towel"
    };

    this.selectedTool = "water";

    // Setup DOM, Audio, Canvas, Tools and Crow
    this.cacheDom();
    this.initCanvas();
    this.setupVoiceAudio();
    this.setupAudioHUD();
    this.setupTools();
    this.setupCrow();
    this.startTimer(); // Starts timer immediately when game.html loads

    // Initial display sync
    this.updateHUD();
    this.updateVisualStage();
    this.updateInstruction();
    this.updateAvailableTools();
  }

  // Cache DOM references
  cacheDom() {
    this.stageNum = document.getElementById("stage-num");
    this.cleanPct = document.getElementById("clean-pct-val");
    this.progressBar = document.getElementById("clean-progress-bar");
    this.timerVal = document.getElementById("timer-val");
    this.crowStage = document.getElementById("crow-stage");
    this.instructionIcon = document.getElementById("instruction-icon");
    this.instructionText = document.getElementById("instruction-text");
    this.instructionNote = document.getElementById("instruction-note");
    this.toolButtons = document.querySelectorAll(".tool-btn");
    this.mainCrowImg = document.getElementById("main-crow-img");
    this.finalCrowImg = document.getElementById("final-crow-img");
    this.redirectBanner = document.getElementById("final-redirect-banner");
    this.toolAnimEffect = document.getElementById("tool-anim-effect");
    this.canvas = document.getElementById("fx-canvas");
  }

  // ============================================
  // VOICE AUDIO MANAGEMENT (3 REAL MP3 VOICES)
  // ============================================
  setupVoiceAudio() {
    // 1. Voice 1: Dirty Crow (assets/sounds/dirty-crow.mp3)
    this.dirtyCrowAudio = new Audio("assets/sounds/dirty-crow.mp3");
    this.dirtyCrowAudio.preload = "auto";

    // 2. Voice 2: Bathing Crow (assets/sounds/bathing-crow.mp3)
    this.bathingCrowAudio = new Audio("assets/sounds/bathing-crow.mp3");
    this.bathingCrowAudio.preload = "auto";
    this.bathingCrowAudio.loop = true;

    // Ensure loop repeats smoothly across all browsers
    this.bathingCrowAudio.addEventListener("ended", () => {
      if (this.isBathingVoiceActive && !this.gameFinished) {
        this.bathingCrowAudio.currentTime = 0;
        this.bathingCrowAudio.play().catch(() => {});
      }
    });

    // 3. Voice 3: Finished Crow (assets/sounds/finished-crow.mp3)
    this.finishedCrowAudio = new Audio("assets/sounds/finished-crow.mp3");
    this.finishedCrowAudio.preload = "auto";

    this.dirtyCrowPlayed = false;
    this.isBathingVoiceActive = false;

    // Check mute state from localStorage
    const isMuted = localStorage.getItem("kakka_sound_muted") === "true";
    this.applyMuteState(isMuted);

    // Trigger Voice 1 when dirty crow appears
    this.triggerDirtyCrowVoice();
  }

  applyMuteState(isMuted) {
    if (this.dirtyCrowAudio) this.dirtyCrowAudio.muted = isMuted;
    if (this.bathingCrowAudio) this.bathingCrowAudio.muted = isMuted;
    if (this.finishedCrowAudio) this.finishedCrowAudio.muted = isMuted;
  }

  setupAudioHUD() {
    if (window.SoundEngine && !window.soundEngine) {
      window.soundEngine = new SoundEngine();
    }
    const audioBtn = document.getElementById("audio-toggle-btn");
    if (audioBtn) {
      const isMuted = localStorage.getItem("kakka_sound_muted") === "true";
      audioBtn.textContent = isMuted ? "🔇" : "🔊";

      audioBtn.addEventListener("click", () => {
        if (window.soundEngine) {
          window.soundEngine.init();
          const muted = window.soundEngine.toggleMute();
          audioBtn.textContent = muted ? "🔇" : "🔊";
          this.applyMuteState(muted);
        }
      });
    }
  }

  // VOICE 1: Dirty crow appears -> Play dirty-crow.mp3 ONCE
  triggerDirtyCrowVoice() {
    if (this.dirtyCrowPlayed) return;

    const playVoice = () => {
      if (this.dirtyCrowPlayed || this.isBathingVoiceActive || this.gameFinished) return;
      this.dirtyCrowAudio.play().then(() => {
        this.dirtyCrowPlayed = true;
      }).catch(() => {
        // Handle browser autoplay restriction: start audio on first user touch/click
        const unlockAudio = () => {
          window.removeEventListener("pointerdown", unlockAudio);
          window.removeEventListener("click", unlockAudio);
          if (!this.dirtyCrowPlayed && !this.isBathingVoiceActive && !this.gameFinished) {
            this.dirtyCrowAudio.play().then(() => {
              this.dirtyCrowPlayed = true;
            }).catch(() => {});
          }
        };
        window.addEventListener("pointerdown", unlockAudio, { once: true });
        window.addEventListener("click", unlockAudio, { once: true });
      });
    };

    setTimeout(playVoice, 150);
  }

  // VOICE 2: User clicks/starts cleaning crow -> Start bathing-crow.mp3 and keep repeating
  startBathingVoice() {
    if (this.gameFinished) return;

    // Stop dirty crow audio if still playing to prevent overlap
    if (this.dirtyCrowAudio && !this.dirtyCrowAudio.paused) {
      this.dirtyCrowAudio.pause();
      this.dirtyCrowAudio.currentTime = 0;
    }
    this.dirtyCrowPlayed = true;

    // DO NOT play multiple copies, DO NOT restart on every click, DO NOT allow overlap
    if (this.isBathingVoiceActive) {
      return; // Already playing and repeating continuously!
    }

    this.isBathingVoiceActive = true;
    this.bathingCrowAudio.currentTime = 0;
    this.bathingCrowAudio.play().catch(err => {
      console.log("Bathing audio autoplay handling:", err);
    });
  }

  // STOP bathing-crow.mp3 immediately
  stopBathingVoice() {
    this.isBathingVoiceActive = false;
    if (this.bathingCrowAudio) {
      this.bathingCrowAudio.pause();
      this.bathingCrowAudio.currentTime = 0;
    }
  }

  // VOICE 3: Bathed crow appears -> Play finished-crow.mp3 ONCE
  playFinishedCrowVoice() {
    this.stopBathingVoice();
    if (this.finishedCrowAudio) {
      this.finishedCrowAudio.currentTime = 0;
      this.finishedCrowAudio.play().catch(err => {
        console.log("Finished crow audio play error:", err);
      });
    }
  }

  // ============================================
  // TIMER (Starts immediately, updates every second)
  // ============================================
  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.seconds++;
      const minutes = Math.floor(this.seconds / 60);
      const secs = this.seconds % 60;
      const formatted = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      if (this.timerVal) {
        this.timerVal.textContent = formatted;
      }
    }, 1000);
  }

  getFormattedTime() {
    const minutes = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // ============================================
  // TOOL BUTTONS & CLICKS
  // ============================================
  setupTools() {
    this.toolButtons.forEach(button => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.gameFinished || this.busy) return;

        const tool = button.dataset.tool;
        const requiredTool = this.stageTools[this.stage];

        // Any user interaction with tools starts the bathing voice
        this.startBathingVoice();

        if (tool === requiredTool) {
          this.selectTool(button, tool);
          // Auto apply on tool click for snappy gameplay
          this.useTool(tool);
        } else {
          // Guide the player friendly without breaking anything
          this.showMessage(`Step ${this.stage}: Please use ${this.getToolDisplayName(requiredTool)} first!`);
        }
      });
    });
  }

  selectTool(button, tool) {
    this.toolButtons.forEach(btn => btn.classList.remove("active"));
    if (button) button.classList.add("active");
    this.selectedTool = tool;
  }

  // Clicking crow stage starts the bathing voice and applies the required tool
  setupCrow() {
    if (!this.crowStage) return;
    this.crowStage.addEventListener("click", () => {
      if (this.gameFinished || this.busy) return;

      // Start repeating bathing voice when player clicks the crow to clean it
      this.startBathingVoice();

      const toolToUse = this.stageTools[this.stage];
      if (toolToUse) {
        this.useTool(toolToUse);
      }
    });
  }

  // ============================================
  // APPLY TOOL ACTION
  // ============================================
  useTool(tool) {
    if (this.busy || this.gameFinished) return;
    this.busy = true;

    // Play Sound effect & visual feedback
    this.playAudioForTool(tool);
    this.showToolAnimation(tool);
    this.spawnParticlesForTool(tool);

    if (tool === "towel") {
      this.handleTowelCompletion();
    } else {
      setTimeout(() => {
        this.advanceToNextStage();
        this.busy = false;
      }, 750);
    }
  }

  advanceToNextStage() {
    const nextStage = this.stage + 1;
    this.stage = nextStage;
    this.cleanliness = this.stagePercentages[nextStage] || 90;

    // Next tool selection
    const nextTool = this.stageTools[nextStage];
    if (nextTool) {
      this.selectedTool = nextTool;
    }

    this.updateHUD();
    this.updateVisualStage();
    this.updateInstruction();
    this.updateAvailableTools();
  }

  // ============================================
  // FINAL TOWEL COMPLETION & AUTOMATIC REDIRECT
  // ============================================
  handleTowelCompletion() {
    // 1. Cleanliness = 100%
    this.cleanliness = 100;
    this.gameFinished = true;

    // 2. STOP bathing-crow.mp3 immediately as required!
    this.stopBathingVoice();

    // 3. Stop timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const finalTime = this.getFormattedTime();

    // 4. Save result to sessionStorage as required
    const resultObj = {
      cleanliness: 100,
      time: finalTime
    };
    sessionStorage.setItem("gameResult", JSON.stringify(resultObj));
    sessionStorage.setItem("kakka_final_time", finalTime);
    sessionStorage.setItem("kakka_cleanliness", "100%");

    // 5. Update HUD to 100%
    if (this.cleanPct) this.cleanPct.textContent = "100%";
    if (this.progressBar) this.progressBar.style.width = "100%";
    if (this.stageNum) this.stageNum.textContent = "STAGE 8 (DONE)";

    // 6. When final bathed crow appears (bathed-crow.png):
    // Play finished-crow.mp3 ONCE. Do not play the bathing voice after this.
    setTimeout(() => {
      this.crowStage.className = "crow-stage stage-final";
      this.hideAllOverlays();
      const sparkles = document.getElementById("fx-final-sparkles");
      if (sparkles) sparkles.classList.add("visible");
      if (this.redirectBanner) this.redirectBanner.classList.add("show");

      // Play finished-crow.mp3 ONCE
      this.playFinishedCrowVoice();

      this.spawnSparkleCelebration();

      // Automatically redirect to result.html after voice finishes (or ~2.2s fallback)
      let redirected = false;
      const doRedirect = () => {
        if (!redirected) {
          redirected = true;
          window.location.href = "result.html";
        }
      };

      if (this.finishedCrowAudio) {
        this.finishedCrowAudio.addEventListener("ended", doRedirect, { once: true });
      }
      setTimeout(doRedirect, 2200);
    }, 500);
  }

  // ============================================
  // VISUAL STAGE MANAGEMENT (Stages 1 - 8 are all distinct!)
  // ============================================
  updateVisualStage() {
    if (!this.crowStage) return;

    // Reset base stage classes
    this.crowStage.className = `crow-stage stage-${this.stage}`;

    this.hideAllOverlays();

    // Show the corresponding unique stage overlay
    const currentOverlay = document.getElementById(`fx-stage-${this.stage}`);
    if (currentOverlay) {
      currentOverlay.classList.add("visible");
    }
  }

  hideAllOverlays() {
    for (let i = 1; i <= 8; i++) {
      const el = document.getElementById(`fx-stage-${i}`);
      if (el) el.classList.remove("visible");
    }
    const sparkles = document.getElementById("fx-final-sparkles");
    if (sparkles) sparkles.classList.remove("visible");
  }

  // ============================================
  // UPDATE HUD & TOOLS DOCK
  // ============================================
  updateHUD() {
    if (this.stageNum) {
      this.stageNum.textContent = `STAGE ${this.stage}`;
    }
    if (this.cleanPct) {
      this.cleanPct.textContent = `${this.cleanliness}%`;
    }
    if (this.progressBar) {
      this.progressBar.style.width = `${this.cleanliness}%`;
    }
  }

  updateAvailableTools() {
    const activeTool = this.stageTools[this.stage];
    this.toolButtons.forEach(button => {
      const tool = button.dataset.tool;
      if (tool === activeTool) {
        button.disabled = false;
        button.classList.add("active");
      } else {
        button.classList.remove("active");
        button.disabled = false;
      }
    });
  }

  // Update instruction banner text & icon
  updateInstruction() {
    const instructions = {
      1: { icon: "💧", text: "Click Water (or click the crow) to pour fresh well water.", note: "— Stage 1: Wash away dry dirt (0%)" },
      2: { icon: "🧼", text: "Click Soap to lather rich foam over the feathers.", note: "— Stage 2: Create soap lather (10%)" },
      3: { icon: "🧴", text: "Click Body Wash to apply herbal foaming wash.", note: "— Stage 3: Deep herbal wash (25%)" },
      4: { icon: "🧴", text: "Click Shampoo to wash the crow thoroughly.", note: "— Stage 4: Lather head & feathers (40%)" },
      5: { icon: "🧽", text: "Click Scrub to scrub off stubborn grime with coir.", note: "— Stage 5: Intensive scrubbing (55%)" },
      6: { icon: "✂️", text: "Click Groom to align and style clean feathers.", note: "— Stage 6: Feather preening (65%)" },
      7: { icon: "🚿", text: "Click Rinse to flush away all soapy lather with torrent water.", note: "— Stage 7: Powerful rinse (75%)" },
      8: { icon: "🧺", text: "Click Towel for final drying with a clean Kerala mundu!", note: "— Stage 8: Final dry & polish (90%)" }
    };

    const info = instructions[this.stage];
    if (info) {
      if (this.instructionIcon) this.instructionIcon.textContent = info.icon;
      if (this.instructionText) this.instructionText.textContent = info.text;
      if (this.instructionNote) this.instructionNote.textContent = info.note;
    }
  }

  getToolDisplayName(tool) {
    const names = {
      water: "Water 💧",
      soap: "Soap 🧼",
      bodywash: "Body Wash 🧴",
      shampoo: "Shampoo 🧴",
      scrub: "Scrub 🧽",
      groom: "Groom ✂️",
      rinse: "Rinse 🚿",
      towel: "Towel 🧺"
    };
    return names[tool] || tool;
  }

  // ============================================
  // PROCEDURAL SOUND FX (Synthesizer)
  // ============================================
  playAudioForTool(tool) {
    if (!window.soundEngine) return;
    window.soundEngine.init();
    switch (tool) {
      case "water":
      case "rinse":
        window.soundEngine.playWater();
        break;
      case "soap":
      case "bodywash":
      case "shampoo":
        window.soundEngine.playSoapSuds();
        break;
      case "scrub":
        window.soundEngine.playScrub();
        break;
      case "groom":
        window.soundEngine.playFeatherRustle();
        break;
      case "towel":
        window.soundEngine.playTowel();
        break;
    }
  }

  // Tool animation icon badge
  showToolAnimation(tool) {
    if (!this.toolAnimEffect) return;
    const icons = {
      water: "💧",
      soap: "🧼",
      bodywash: "🧴",
      shampoo: "🧴",
      scrub: "🧽",
      groom: "✂️",
      rinse: "🚿",
      towel: "🧺"
    };
    this.toolAnimEffect.textContent = icons[tool] || "✨";
    this.toolAnimEffect.classList.add("active");
    setTimeout(() => {
      this.toolAnimEffect.classList.remove("active");
    }, 600);
  }

  // Helper toast popup
  showMessage(text) {
    let msg = document.getElementById("game-msg-toast");
    if (!msg) {
      msg = document.createElement("div");
      msg.id = "game-msg-toast";
      msg.style.position = "fixed";
      msg.style.top = "85px";
      msg.style.left = "50%";
      msg.style.transform = "translateX(-50%)";
      msg.style.padding = "10px 24px";
      msg.style.borderRadius = "999px";
      msg.style.background = "rgba(15, 44, 28, 0.95)";
      msg.style.border = "1px solid var(--gold-warm)";
      msg.style.color = "var(--gold-light)";
      msg.style.fontWeight = "600";
      msg.style.fontSize = "0.9rem";
      msg.style.zIndex = "9999";
      msg.style.boxShadow = "0 8px 24px rgba(0,0,0,0.6)";
      msg.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      document.body.appendChild(msg);
    }
    msg.textContent = text;
    msg.style.opacity = "1";
    msg.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      msg.style.opacity = "0";
      msg.style.transform = "translateX(-50%) translateY(-10px)";
    }, 1800);
  }

  // ============================================
  // CANVAS PARTICLES & PHYSICS
  // ============================================
  initCanvas() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.animateParticles();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  spawnParticlesForTool(tool) {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const count = 30;

    for (let i = 0; i < count; i++) {
      const p = {
        x: w * 0.3 + Math.random() * (w * 0.4),
        y: h * 0.3 + Math.random() * (h * 0.4),
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        size: 4 + Math.random() * 8,
        alpha: 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.02
      };

      if (tool === "water" || tool === "rinse") {
        p.color = "rgba(140, 210, 255, ";
        p.vy += 3;
      } else if (tool === "soap" || tool === "shampoo" || tool === "bodywash") {
        p.color = "rgba(255, 255, 255, ";
        p.size = 6 + Math.random() * 12;
        p.vy -= 1.5;
      } else if (tool === "scrub") {
        p.color = "rgba(255, 225, 150, ";
      } else {
        p.color = "rgba(255, 240, 200, ";
      }

      this.particles.push(p);
    }
  }

  spawnSparkleCelebration() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: w * 0.2 + Math.random() * (w * 0.6),
        y: h * 0.2 + Math.random() * (h * 0.6),
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: 3 + Math.random() * 6,
        alpha: 1,
        life: 1.5,
        decay: 0.015,
        color: "rgba(255, 215, 0, ",
        isStar: true
      });
    }
  }

  animateParticles() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${p.life})`;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animateParticles());
  }
}

// Instantiate on load
document.addEventListener("DOMContentLoaded", () => {
  window.kakkaGame = new KakkaBathGame();
});