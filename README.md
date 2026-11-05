# GlamDetect

Deteksi makeup real-time (YOLO + FastAPI + webcam). Kelas: Cushion, Essence, Eyebrow, Lipcream, Moisturizer, Sunscreen.

## Cara pakai
1. Taruh `my_model.pt` (hasil training) ke folder `model/`
2. `python -m venv venv`
3. Windows: `venv\Scripts\activate`  |  Mac/Linux: `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn main:app --host 0.0.0.0 --port 8000`
6. Buka http://localhost:8000 dan izinkan akses kamera

## Edit informasi makeup
Ubah isi `makeup_info.py` (fungsi, area wajah, sebelum/sesudah).
Kalau produk sulit terdeteksi, turunkan `conf=0.5` di `main.py` jadi `0.35`.
