const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const match = document.querySelector(".match");
const cakeArea = document.querySelector(".cake-area");
const cakeImg = document.querySelector(".cake");
const music = document.getElementById("bg-music");
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

async function showBirthdayLoader(durationMs = 2200) {
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

function typeWriter(element, text, speed = 40) {
  return new Promise((resolve) => {
    element.innerHTML = "";
    let i = 0;

    function typing() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(typing, speed);
      } else {
        resolve();
      }
    }

    typing();
  });
}

async function startIntro() {
  await Swal.fire({
    title: "Hola 👀",
    confirmButtonText: "💖",
    backdrop: "rgba(243,166,184,0.4)",
    allowOutsideClick: false,
    allowEscapeKey: false
  });

  fadeInMusic(0.3, 2000);
  initBlowDetection();
}


async function showFinalBirthdaySequence() {
  const messages = [
    "Feliz cumpleaños",
    "Gracias por ser la persona",
    "más espectacular",
    "Risueña",
    "Linda ",
    "Bromista !!!",
    "Interesante",
    "¡Gracias por hacer brillar mis días!",
    "Espero seguirte viendo brillar otro año",
  ];

  for (let msg of messages) {
    await Swal.fire({
      title: `<span id="swal-typing"></span>`, 
      backdrop: "rgba(243,166,184,0.4)",
      width: "600px",
      timer: 1800 + Math.random() * 1500,
      timerProgressBar: true,
      showConfirmButton: false,

      didOpen: () => {
        const el = document.getElementById("swal-typing");
        typeWriter(el, msg, 35); 
      }
    });
  }

  await Swal.fire({
    title: `<span id="swal-typing"></span>`,
    timer: 5000,
    showConfirmButton: false,
    timerProgressBar: true,
    backdrop: "rgba(243,166,184,0.4)",
    width: "600px",

    didOpen: () => {
      const el = document.getElementById("swal-typing");
      typeWriter(el, "tqmmmmmmmmmmmmmmmmmmmmmm <3", 40);
    }
  });
}

function fadeInMusic(targetVolume = 0.3, duration = 2000) {
  if (!music) return;

  music.volume = 0;
  music.play().catch(() => {});

  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = targetVolume / steps;

  let currentStep = 0;

  const interval = setInterval(() => {
    currentStep++;
    music.volume = Math.min(currentStep * volumeStep, targetVolume);

    if (currentStep >= steps) clearInterval(interval);
  }, stepTime);
}

function increaseVolume(targetVolume = 0.7, duration = 1500) {
  const startVolume = music.volume;
  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = (targetVolume - startVolume) / steps;

  let currentStep = 0;

  const interval = setInterval(() => {
    currentStep++;
    music.volume = Math.min(
      startVolume + currentStep * volumeStep,
      targetVolume
    );

    if (currentStep >= steps) clearInterval(interval);
  }, stepTime);
}


function showMessageCards() {
  const messages = [
     "Eres increíble",
    "Tu sonrisa ilumina todo",
    "De verdad eres especial",
    "No sabes lo mucho que vales",
    "Tu energía es única",
    "Haces el mundo más bonito",
    "Eres arte ",
    "Eres luz ",
    "Qué suerte coincidir contigo"
  ];

  messages.forEach((text, index) => {
    const delay = 500 + Math.random() * 2000 + index * 400; 
    const duration = 2000 + Math.random() * 2500; 

    setTimeout(() => {
      createCard(text, duration);
    }, delay);
  });
}

function createCard(text, duration) {
  const card = document.createElement("div");
  card.className = "birthday-card";
  card.textContent = text;

  card.style.left = Math.random() * 80 + 10 + "vw";
  card.style.top = Math.random() * 60 + 20 + "vh";

  document.body.appendChild(card);

  setTimeout(() => {
    card.classList.add("show");
  }, 50);

  setTimeout(() => {
    card.classList.remove("show");
    setTimeout(() => card.remove(), 500);
  }, duration);
}

async function waitLoader(durationMs = 2200) {
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

async function blowOutCandles() {
  if (!isCakeLit || isCandlesBlownOut) return;

  isCandlesBlownOut = true;
  cakeImg.src = "assets/cake_unlit.gif";
  
  await showBirthdayLoader(4200);
  await waitLoader(4200);
  setTimeout(() => {
    showMessageCards();
    increaseVolume(0.7, 1500);
  }, 5500);
  setTimeout(() => {
    showFinalBirthdaySequence();
  }, 6000);

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
   startIntro();
   const startExperience = () => {
    if (!audioContext) {
      initBlowDetection();
    }

    fadeInMusic(0.3, 2000); 

    document.body.removeEventListener("click", startExperience);
  };

  document.body.addEventListener("click", startExperience);
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
