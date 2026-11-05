"""Kamus informasi makeup GlamDetect.

Key = nama kelas dari classes.txt (huruf kecil, dicocokkan lewat .lower()).
Urutan rutinitas dipakai untuk menampilkan langkah (step) di UI.
"""

ROUTINE_ORDER = ["essence", "moisturizer", "sunscreen", "cushion", "eyebrow", "lipcream"]

MAKEUP_INFO = {
    "essence": {
        "nama": "Essence",
        "fungsi": "Melembapkan dan menyiapkan kulit agar produk berikutnya lebih mudah meresap.",
        "area": "Seluruh wajah (ditepuk lembut dari tengah ke luar)",
        "sebelum": "Cuci muka / Toner",
        "sesudah": "Moisturizer",
    },
    "moisturizer": {
        "nama": "Moisturizer",
        "fungsi": "Menjaga kelembapan kulit dan mengunci hidrasi dari essence.",
        "area": "Seluruh wajah dan leher",
        "sebelum": "Essence",
        "sesudah": "Sunscreen",
    },
    "sunscreen": {
        "nama": "Sunscreen",
        "fungsi": "Melindungi kulit dari sinar UV dan mencegah flek serta penuaan dini.",
        "area": "Seluruh wajah, leher, dan area yang terpapar matahari",
        "sebelum": "Moisturizer",
        "sesudah": "Cushion",
    },
    "cushion": {
        "nama": "Cushion",
        "fungsi": "Meratakan warna kulit dan menutupi noda ringan (foundation praktis).",
        "area": "Pipi, dahi, hidung, dan dagu (ditepuk dari tengah ke luar)",
        "sebelum": "Sunscreen",
        "sesudah": "Eyebrow",
    },
    "eyebrow": {
        "nama": "Eyebrow",
        "fungsi": "Membentuk dan mempertegas alis.",
        "area": "Alis",
        "sebelum": "Cushion",
        "sesudah": "Lip Cream",
    },
    "lipcream": {
        "nama": "Lip Cream",
        "fungsi": "Memberi warna dan tekstur pada bibir.",
        "area": "Bibir",
        "sebelum": "Eyebrow",
        "sesudah": "Langkah terakhir (selesai)",
    },
}

DEFAULT_INFO = {
    "nama": "Tidak dikenal",
    "fungsi": "-",
    "area": "-",
    "sebelum": "-",
    "sesudah": "-",
}


def get_info(class_name: str) -> dict:
    """Ambil info makeup dari nama kelas (tidak peka huruf besar/kecil)."""
    key = class_name.strip().lower().replace(" ", "").replace("_", "")
    info = dict(MAKEUP_INFO.get(key, DEFAULT_INFO))
    info["key"] = key
    info["step"] = ROUTINE_ORDER.index(key) + 1 if key in ROUTINE_ORDER else 0
    return info
