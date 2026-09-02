"""本機地圖預覽伺服器。

與 `python -m http.server` 的差別：每個回應都送出不要快取的標頭，
避免修改 data/*.geojson 後瀏覽器仍顯示舊資料。

用法（在專案根目錄執行）：
    python serve_map.py          # 預設 port 8001
    python serve_map.py 8002     # 指定 port
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    handler = partial(NoCacheHandler, directory=str(PROJECT_ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print("=" * 56)
    print("  絲路歷史田調互動地圖本機伺服器")
    print(f"  服務目錄：{PROJECT_ROOT}")
    print(f"  網址：http://localhost:{port}")
    print("  已停用瀏覽器快取，改資料後直接重整即可看到更新")
    print("  停止：按 Ctrl+C 或關閉此視窗")
    print("=" * 56)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n伺服器已停止。")
        server.server_close()


if __name__ == "__main__":
    main()
