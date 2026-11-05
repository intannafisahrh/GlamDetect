import io
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from PIL import Image
from ultralytics import YOLO

from makeup_info import get_info, ROUTINE_ORDER, MAKEUP_INFO

app = FastAPI(title="GlamDetect")

# 1. Mount Static Files (CSS, JS) dan Templates (HTML)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 2. Muat Model YOLO
MODEL_PATH = "model/my_model.pt"
print("Loading YOLO model...")
model = YOLO(MODEL_PATH)
print("Model loaded successfully!")


@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    """Endpoint utama untuk menampilkan halaman UI web."""
    routine = [
        {"step": i + 1, "key": k, "nama": MAKEUP_INFO[k]["nama"]}
        for i, k in enumerate(ROUTINE_ORDER)
    ]
    return templates.TemplateResponse(
        request=request, name="index.html", context={"routine": routine}
    )


@app.post("/detect")
async def detect_makeup(file: UploadFile = File(...)):
    """Terima frame webcam, jalankan YOLO, kembalikan deteksi + info makeup."""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # conf=0.5 -> threshold 50%. Turunkan ke 0.35 jika sulit terdeteksi.
        results = model.predict(source=image, conf=0.5, imgsz=640, verbose=False)

        detections = []
        for result in results:
            for box in result.boxes:
                xyxy = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                class_name = model.names[int(box.cls[0])]

                detections.append({
                    "box": [round(c, 2) for c in xyxy],
                    "label": class_name,
                    "confidence": round(confidence * 100, 1),
                    "info": get_info(class_name),
                })

        return JSONResponse(content={
            "status": "success",
            "detected_count": len(detections),
            "detections": detections,
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )
