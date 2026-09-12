/* ==========================================================================
   KAKKA KULICHAL KOKKAVILLA — RESULT LOGIC (result.js)
   Display Results, Animate Counters, Punchline, and Replay Controls
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Load saved metrics
  const savedTime = sessionStorage.getItem('kakka_final_time') || localStorage.getItem('kakka_final_time') || '00:18';
  const savedCleanliness = sessionStorage.getItem('kakka_cleanliness') || '100%';

  // Update DOM metrics
  const timeElem = document.getElementById('stat-time-val');
  const cleanElem = document.getElementById('stat-clean-val');

  if (timeElem) timeElem.textContent = savedTime;
  if (cleanElem) cleanElem.textContent = savedCleanliness;

  // Play triumphant sound on reveal
  setTimeout(() => {
    if (window.soundEngine) {
      window.soundEngine.init();
      window.soundEngine.playSuccess();
    }
  }, 300);

  // Setup sparkles around clean crow
  createResultSparkles();

  // Audio button setup
  setupAudioButton();

  // Replay buttons
  const playAgainBtn = document.getElementById('btn-play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      // Clear game session states
      sessionStorage.removeItem('kakka_cleanliness');
      window.location.href = 'game.html';
    });
  }

  const homeBtn = document.getElementById('btn-home');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
});

function createResultSparkles() {
  const frame = document.querySelector('.result-crow-frame');
  if (!frame) return;

  for (let i = 0; i < 10; i++) {
    const s = document.createElement('div');
    s.className = 'result-sparkle';
    s.style.left = `${15 + Math.random() * 70}%`;
    s.style.top = `${15 + Math.random() * 70}%`;
    s.style.animationDelay = `${i * 0.25}s`;
    s.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
    frame.appendChild(s);
  }
}

function setupAudioButton() {
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
