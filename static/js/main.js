document.addEventListener("DOMContentLoaded", () => {
    const webcamElement = document.getElementById("webcam");
    const canvasElement = document.getElementById("overlay");
    const ctx = canvasElement.getContext("2d");
    const cameraSelect = document.getElementById("cameraSelect");
    const makeupNameEl = document.getElementById("makeupName");
    const detectedCountEl = document.getElementById("detectedCount");
    const detectionListEl = document.getElementById("detectionList");
    const statusBadge = document.getElementById("statusBadge");
    const routineItems = document.querySelectorAll("#routine li");

    let isProcessing = false;
    let loopStarted = false;

    // 1. Dapatkan Daftar Kamera
    async function getCameras() {
        try {
            // Minta izin dulu supaya label kamera terbaca
            const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
            tmp.getTracks().forEach(t => t.stop());

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === "videoinput");

            cameraSelect.innerHTML = "";
            videoDevices.forEach((device, index) => {
                const option = document.createElement("option");
                option.value = device.deviceId;
                option.text = device.label || `Kamera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            if (videoDevices.length > 0) {
                startWebcam(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error("Gagal mendapatkan perangkat kamera:", err);
            statusBadge.innerText = "Error: Kamera tidak ditemukan";
            statusBadge.style.backgroundColor = "#ef4444";
        }
    }

    // 2. Jalankan Stream Webcam
    async function startWebcam(deviceId) {
        if (window.stream) {
            window.stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            window.stream = stream;
            webcamElement.srcObject = stream;

            webcamElement.onloadedmetadata = () => {
                canvasElement.width = webcamElement.videoWidth;
                canvasElement.height = webcamElement.videoHeight;
                statusBadge.innerText = "Status: Live";
                statusBadge.style.backgroundColor = "#10b981";

                if (!loopStarted) {
                    loopStarted = true;
                    processFrameLoop();
                }
            };
        } catch (err) {
            console.error("Gagal mengakses webcam:", err);
            statusBadge.innerText = "Akses Kamera Ditolak";
            statusBadge.style.backgroundColor = "#ef4444";
        }
    }

    // Switch kamera ketika opsi dropdown diubah
    cameraSelect.addEventListener("change", () => {
        startWebcam(cameraSelect.value);
    });

    // 3. Kirim Frame ke Backend (Non-blocking Loop)
    async function processFrameLoop() {
        if (!isProcessing && webcamElement.readyState === 4) {
            isProcessing = true;
            await sendFrameToBackend();
            isProcessing = false;
        }
        // Kirim frame berikutnya setelah jeda singkat (~66ms = ~15 FPS)
        setTimeout(processFrameLoop, 66);
    }

    function sendFrameToBackend() {
        const captureCanvas = document.createElement("canvas");
        captureCanvas.width = canvasElement.width;
        captureCanvas.height = canvasElement.height;
        const captureCtx = captureCanvas.getContext("2d");
        captureCtx.drawImage(webcamElement, 0, 0, captureCanvas.width, captureCanvas.height);

        // Dibungkus Promise supaya isProcessing baru false setelah respons datang
        return new Promise(resolve => {
            captureCanvas.toBlob(async (blob) => {
                if (!blob) return resolve();

                const formData = new FormData();
                formData.append("file", blob, "frame.jpg");

                try {
                    const response = await fetch("/detect", { method: "POST", body: formData });
                    if (response.ok) {
                        updateUI(await response.json());
                    }
                } catch (err) {
                    console.error("Error mengirim frame ke backend:", err);
                }
                resolve();
            }, "image/jpeg", 0.7);
        });
    }

    // 4. Update Tampilan Bounding Box & Informasi Makeup
    function updateUI(data) {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        detectedCountEl.innerText = data.detected_count;
        detectionListEl.innerHTML = "";
        routineItems.forEach(li => li.classList.remove("active"));

        if (data.detections.length === 0) {
            makeupNameEl.innerText = "-";
            detectionListEl.innerHTML = '<li class="empty-state">Arahkan produk makeup ke kamera</li>';
            return;
        }

        // Kartu atas: produk dengan confidence tertinggi
        const best = data.detections.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
        makeupNameEl.innerText = best.info.nama;

        // Gambar semua kotak
        data.detections.forEach(item => {
            const [x1, y1, x2, y2] = item.box;

            ctx.strokeStyle = "#ec4899";
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

            const text = `${item.info.nama} (${item.confidence}%)`;
            ctx.font = "bold 14px sans-serif";
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = "#ec4899";
            ctx.fillRect(x1, y1 > 25 ? y1 - 25 : y1, textWidth + 10, 25);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(text, x1 + 5, y1 > 25 ? y1 - 7 : y1 + 17);
        });

        // Daftar info: satu kartu per jenis produk (ambil confidence tertinggi)
        const unique = {};
        data.detections.forEach(d => {
            if (!unique[d.info.key] || unique[d.info.key].confidence < d.confidence) {
                unique[d.info.key] = d;
            }
        });

        Object.values(unique).forEach(item => {
            const info = item.info;
            routineItems.forEach(li => {
                if (li.dataset.key === info.key) li.classList.add("active");
            });

            const li = document.createElement("li");
            li.className = "detection-item";
            li.innerHTML = `
                <div class="item-head">
                    <span class="label">${info.nama}</span>
                    <span class="confidence">${item.confidence}%</span>
                </div>
                ${info.step ? `<span class="step-pill">Langkah ${info.step} dari 6</span>` : ""}
                <p class="info-row"><b>Fungsi:</b> ${info.fungsi}</p>
                <p class="info-row"><b>Area wajah:</b> ${info.area}</p>
                <p class="info-row"><b>Sebelum pakai:</b> ${info.sebelum}</p>
                <p class="info-row"><b>Sesudah pakai:</b> ${info.sesudah}</p>
            `;
            detectionListEl.appendChild(li);
        });
    }

    // Inisialisasi
    getCameras();
});
