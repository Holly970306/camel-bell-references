# 鄯善歷史田調考據互動地圖（初稿）

本專案為絲綢之路南道與塔里木盆地東南部（樓蘭・尼雅・若羌・米蘭等核心遺址區）之歷史地理田調與時空對位互動地圖系統。

---

## 專案特色

- **歷史測繪圖磚套疊**：整合日本國立情報學研究所（DSR）斯坦因《Serindia》（1921）測繪圖磚，提供歷史圖資與現代衛星底圖之即時透明度疊合對比。
- **遺址考據分級標註**：
  - 🟢 **綠色標記**：出土實物佐證遺址（如樓蘭 LA 漢晉木牘、尼雅 N.xiv 佉盧文木牘、米蘭 M.I 翼狀天使壁畫等）。
  - 🔵 **藍色標記**：文獻記載古國與驛站（如且末、若羌、于闐等）。
- **古水系與商道變遷**：
  - 標註古孔雀河故道、古塔里木河、古尼雅河故道與羅布泊古湖面（蒲昌海）。
  - 繪製絲綢之路南道、中北道以及庫爾勒－若羌沙漠穿越道。
- **時空演進篩選**：支援西元前 200 年至西元 800 年動態年代滑桿，即時過濾各時期遺址興衰與水系變遷狀態。
- **田調研究輔助圈**：標註以若羌為中心之 300 公里田調研究範疇輔助圈。
- **文物深度檢視**：側欄整合 OpenSeadragon 支援 IIIF Deep Zoom 高解析文物木牘筆畫檢視。

---

## 檔案結構

```text
├── index.html          # 主頁面結構與密碼驗證遮罩
├── css/
│   └── style.css       # 深色系介面、地圖控制項與側欄樣式
├── js/
│   └── app.js          # Leaflet 地圖邏輯、時空篩選與 SHA-256 驗證
└── data/
    ├── sites.geojson   # 遺址點位與考據詳情資料
    ├── waterways.geojson # 古水系與湖泊面資料
    ├── routes.geojson  # 絲路古道航線資料
    └── dsr.en.kmz      # DSR 原始測繪參考資產
```

---

## 本地開發與瀏覽

本專案採純前端架構（Local-first），無需安裝後端服務或資料庫：

1. 透過任何靜態檔案伺服器開啟（例如 VS Code Live Server 或 Python 簡易伺服器）：
   ```powershell
   python -m http.server 8000
   ```
2. 開啟瀏覽器訪問 `http://localhost:8000` 即可預覽。

---

## 授權與引用聲明

- 歷史地圖圖磚來源：[Digital Silk Road (DSR) Project](http://dsr.nii.ac.jp/toyobunko/) / National Institute of Informatics (NII), Japan.
- 衛星底圖來源：Esri, USGS, GIS User Community.

