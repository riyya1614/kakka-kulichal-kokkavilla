/* ==========================================================================
   KAKKA KULICHAL KOKKAVILLA — MAIN / LANDING LOGIC (main.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Ambient Particle Generation
  createAmbientParticles();

  // Audio Button Setup
  const audioBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');

  function updateAudioIcon() {
    if (!audioBtn) return;
    const isMuted = window.soundEngine ? window.soundEngine.isMuted : false;
    if (isMuted) {
      audioBtn.classList.add('muted');
      audioBtn.title = "Sound Muted (Click to Unmute)";
      audioBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      `;
    } else {
      audioBtn.classList.remove('muted');
      audioBtn.title = "Sound Active (Click to Mute)";
      audioBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
    }
  }

  if (audioBtn) {
    updateAudioIcon();
    audioBtn.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.init();
        window.soundEngine.toggleMute();
        updateAudioIcon();
      }
    });
  }

  // Crow interaction Easter Egg
  const crowCard = document.querySelector('.crow-pedestal-card');
  if (crowCard) {
    crowCard.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.init();
        window.soundEngine.playWaterDroplet();
      }
      crowCard.style.transform = 'scale(0.97)';
      setTimeout(() => {
        crowCard.style.transform = '';
      }, 150);
    });
  }

  // Start button sound trigger
  const startBtn = document.querySelector('.btn-primary');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      if (window.soundEngine) {
        window.soundEngine.init();
      }
    });
  }
});

function createAmbientParticles() {
  const container = document.querySelector('.app-container');
  if (!container) return;

  const count = 15;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 6 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    particle.style.animationDuration = `${Math.random() * 6 + 6}s`;
    container.appendChild(particle);
  }
}
