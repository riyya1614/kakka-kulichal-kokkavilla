/* ==========================================================================
   KAKKA KULICHAL KOKKAVILLA — RESULT LOGIC (result.js)
   Display Results from sessionStorage, Audio & Play Again Control
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Load saved metrics from sessionStorage.setItem("gameResult", ...)
  let savedTime = "00:12";
  let savedCleanliness = "100%";

  try {
    const rawData = sessionStorage.getItem("gameResult");
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed.time) {
        savedTime = typeof parsed.time === "number" ? formatSeconds(parsed.time) : parsed.time;
      }
      if (parsed.cleanliness !== undefined) {
        savedCleanliness = `${parsed.cleanliness}%`;
      }
    } else {
      // Fallback check on individual keys
      const legacyTime = sessionStorage.getItem("kakka_final_time");
      if (legacyTime) savedTime = legacyTime;
      const legacyClean = sessionStorage.getItem("kakka_cleanliness");
      if (legacyClean) savedCleanliness = legacyClean;
    }
  } catch (err) {
    console.warn("Could not read gameResult:", err);
  }

  // Update DOM metrics with actual recorded values
  const timeElem = document.getElementById('stat-time-val');
  const cleanElem = document.getElementById('stat-clean-val');

  if (timeElem) timeElem.textContent = savedTime;
  if (cleanElem) cleanElem.textContent = savedCleanliness;

  // Initialize and play celebratory audio
  setTimeout(() => {
    if (window.soundEngine) {
      window.soundEngine.init();
      window.soundEngine.playSuccess();
    }
  }, 350);

  // Bathed crow click Easter egg
  const resultCrowImg = document.getElementById('result-crow-img');
  if (resultCrowImg) {
    resultCrowImg.style.cursor = 'pointer';
    resultCrowImg.addEventListener('click', () => {
      const finishedAudio = new Audio('assets/sounds/finished-crow.mp3');
      finishedAudio.play().catch(() => {});
    });
  }

  // Setup audio button
  setupAudioButton();

  // Play Again Button -> returns to index.html
  const playAgainBtn = document.getElementById('btn-play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('gameResult');
      sessionStorage.removeItem('kakka_final_time');
      sessionStorage.removeItem('kakka_cleanliness');
      window.location.href = 'index.html';
    });
  }
});

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setupAudioButton() {
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (!audioBtn) return;

  const updateIcon = () => {
    const isMuted = window.soundEngine ? window.soundEngine.isMuted : false;
    audioBtn.textContent = isMuted ? "🔇" : "🔊";
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
