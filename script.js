const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const match = document.querySelector(".match");
const cakeArea = document.querySelector(".cake-area");
const cakeImg = document.querySelector(".cake");

// Constants
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const WEBCAM_WIDTH = isMobile ? 240 : 300;
const WEBCAM_HEIGHT = isMobile ? 180 : 225;
const BLOW_THRESHOLD = 70; // how sensitive the mic is
const LIGHT_DISTANCE = 20; // how close match needs to be to light candles

canvas.width = WEBCAM_WIDTH;
canvas.height = WEBCAM_HEIGHT;

// Track hand position
let handPosition = { x: 0.5, y: 0.5 };
let isHandDetected = false;

let isCakeLit = false;
let isCandlesBlownOut = false;

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: isMobile ? 0 : 1,
  minDetectionConfidence: isMobile ? 0.6 : 0.7,
  minTrackingConfidence: isMobile ? 0.4 : 0.5,
});

// Hand tracking
hands.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    isHandDetected = true;

    // get index finger tip (landmark 8)
    const indexTip = landmarks[8];

    handPosition.x = 1 - indexTip.x;
    handPosition.y = indexTip.y;

    updateMatchPosition();

    checkCandleLighting();
  } else {
    isHandDetected = false;
  }
});

function showBirthdayLoader(durationMs = 2200) {
  if (typeof Swal === "undefined") return;

  Swal.fire({
    title: "✨ Wish loading… ✨",
    html: `
      <div class="birthday-loader"></div>
      <div>Procesando tu soplido mágico…</div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(243,166,184,0.35)",
  });

  setTimeout(() => Swal.close(), durationMs);
}

function waitLoader(durationMs = 2200) {
  if (typeof Swal === "undefined") return;

  Swal.fire({
    title: "✨ MMMMMM Esperaa!!… ✨",
    html: `
      <div class="birthday-loader"></div>
      <div>Hay algo más…</div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(243,166,184,0.35)",
  });

  setTimeout(() => Swal.close(), durationMs);
}


// Match
function updateMatchPosition() {
  if (!isHandDetected) return;

  const cakeRect = cakeArea.getBoundingClientRect();

  const padding = 20;
  const matchX = padding + handPosition.x * (cakeRect.width - padding * 2 - 40);
  const matchY =
    padding + handPosition.y * (cakeRect.height - padding * 2 - 60);

  match.style.left = `${matchX}px`;
  match.style.top = `${matchY}px`;
}

// Light candles
function checkCandleLighting() {
  if (isCakeLit || isCandlesBlownOut) return;

  const matchRect = match.getBoundingClientRect();
  const cakeRect = cakeImg.getBoundingClientRect();

  const matchTipX = matchRect.left + matchRect.width / 2;
  const matchTipY = matchRect.top;

  const candleX = cakeRect.left + cakeRect.width / 2;
  const candleY = cakeRect.top + 10;

  const distance = Math.sqrt(
    Math.pow(matchTipX - candleX, 2) + Math.pow(matchTipY - candleY, 2)
  );

  if (distance < LIGHT_DISTANCE) {
    lightCake();
  }
}

function lightCake() {
  if (isCakeLit) return;

  isCakeLit = true;
  cakeImg.src = "assets/cake_lit.gif";
  match.style.display = "none";
}

function blowOutCandles() {
  if (!isCakeLit || isCandlesBlownOut) return;

  isCandlesBlownOut = true;
  cakeImg.src = "assets/cake_unlit.gif";
  
  showBirthdayLoader(4200);

  createConfetti(15000);
}

// ASCII Confetti
const CONFETTI_SYMBOLS = [
  "⭒",
  "˚",
  "⋆",
  "⊹",
  "₊",
  "݁",
  "˖",
  "✦",
  "✧",
  "·",
  "°",
  "✶",
];

const CONFETTI_COLORS = ["#FFC107", "#2196F3", "#FF5722", "#4CAF50", "#E91E63", "#9C27B0"];

function createConfetti(duration = 15000) {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const interval = setInterval(() => {
    for (let i = 0; i < 8; i++) {
      const confetti = document.createElement("span");
      confetti.className = "confetti";
      confetti.textContent =
        CONFETTI_SYMBOLS[Math.floor(Math.random() * CONFETTI_SYMBOLS.length)];

      confetti.style.color =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.fontSize = Math.random() * 1.5 + 0.8 + "rem";

      const fallDuration = 3 + Math.random() * 3;
      confetti.style.animationDuration = fallDuration + "s";
      confetti.style.setProperty(
        "--sway",
        (Math.random() - 0.5) * 200 + "px"
      );

      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), fallDuration * 1000);
    }
  }, 300); 

  setTimeout(() => {
    clearInterval(interval);
    setTimeout(() => container.remove(), 6000);
  }, duration);
}


// Blow detection
let audioContext = null;
let analyser = null;
let microphone = null;
let isBlowDetectionActive = false;

async function initBlowDetection() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    microphone.connect(analyser);

    isBlowDetectionActive = true;

    detectBlow();
  } catch (err) {
    console.error("Error accessing microphone:", err);
  }
}

function detectBlow() {
  if (!isBlowDetectionActive) return;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  if (volume > BLOW_THRESHOLD && isCakeLit && !isCandlesBlownOut) {
    blowOutCandles();
  }

  requestAnimationFrame(detectBlow);
}

// Camera
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: WEBCAM_WIDTH,
        height: WEBCAM_HEIGHT,
        facingMode: "user",
      },
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      startHandTracking();
    };
  } catch (err) {
    console.error("Error accessing webcam:", err);
    alert("Could not access webcam. Please allow camera permissions.");
  }
}

function startHandTracking() {
  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: WEBCAM_WIDTH,
    height: WEBCAM_HEIGHT,
  });

  camera.start();
}

window.addEventListener("DOMContentLoaded", () => {
  initCamera();

  if (isMobile) {
    document.body.addEventListener(
      "click",
      () => {
        if (!audioContext) {
          initBlowDetection();
        }
      },
      { once: true }
    );
  } else {
    initBlowDetection();
  }
});
