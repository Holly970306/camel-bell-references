# 鄯善歷史田調考據互動地圖（初稿）

本專案為絲綢之路南道與塔里木盆地東南部（樓蘭・尼雅・若羌・米蘭等核心遺址區）之歷史地理田調與時空對位互動地圖系統。

---

## 專案特色

- **歷史測繪圖磚套疊**：整合日本國立情報學研究所（DSR）斯坦因《Serindia》（1921）測繪圖磚，提供歷史圖資與現代衛星底圖之即時透明度疊合對比。
- **遺址考據分級標註**：
  - 🟢 **綠色標記**：出土實物佐證遺址（如樓蘭 LA 漢晉木牘、尼雅 N.xiv 佉盧文木牘、米蘭 M.I 翼狀天使壁畫等）。
  - 🔵 **藍色標記**：文獻記載古國與驛站（如且末、若羌、于闐等）。
  - **淺紫色標記**：斯坦因地圖測繪定位聚落（目前為阿蘭的家 Chindailik）。
- **古水系與商道變遷**：
  - 標註古孔雀河故道、古塔里木河、古尼雅河故道與羅布泊古湖面（蒲昌海）。
  - 繪製絲綢之路南道、中北道以及庫爾勒－若羌沙漠穿越道。
- **時空演進篩選**：支援西元前 200 年至西元 800 年動態年代滑桿，即時過濾各時期遺址興衰與水系變遷狀態。
- **田調研究輔助圈**：標註以若羌為中心之 300 公里田調研究範疇輔助圈。
- **文物記錄圖卡**：側欄在考據來源後顯示文物縮圖、正式題名與典藏機構，點選即可開啟原始藏品頁。

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

1. 雙擊專案根目錄的 `start_map.bat`，啟動內建的本機預覽伺服器：
   ```powershell
   .\start_map.bat
   ```
2. 瀏覽器會自動開啟 `http://localhost:8001`；此伺服器會停用快取，因此修改資料或程式後直接重新整理頁面即可看到更新。

---

## 批次匯入文物與文獻紀錄

使用 [data/artifact-records-template.xlsx](data/artifact-records-template.xlsx) 整理資料。`records` 工作表每一列代表一筆文物或文獻紀錄，並以既有地標的 `site_id` 連結，例如樓蘭是 `loulan-la`。

| 欄位 | 說明 |
| --- | --- |
| `site_id` | 已存在於 `data/sites.geojson` 的地標代號 |
| `title` | 側欄顯示的文物或文獻題名 |
| `record_url` | HTTP 或 HTTPS 的原始紀錄連結 |
| `image_path` | 專案內圖片相對路徑，例如 `images/artifacts/example.png` |
| `source` | 典藏機構或資料庫名稱 |
| `rights` | 研究用授權標記，保留在活頁簿供審閱 |
| `status` | 只有 `ready` 會匯入；其他值會保留在活頁簿但不寫入地圖 |

請先將圖片放入專案的 `images/artifacts/` 資料夾，再從專案根目錄開啟 PowerShell 執行：

```powershell
npm install
node .\scripts\import-artifact-records.mjs --workbook data\artifact-records-template.xlsx --geojson data\sites.geojson
```

匯入工具會先驗證整份工作表。若出現未知地標、重複紀錄、空白必填欄位、不安全連結，或圖片路徑不存在，工具會顯示列號並停止，`data/sites.geojson` 不會被寫入。匯入成功時，只有活頁簿中 `ready` 列所提及地標的 `artifact_records` 會被更新。

---

## 授權與引用聲明

- 歷史地圖圖磚來源：Digital Silk Road (DSR) Project / National Institute of Informatics (NII), Japan。地名考據入口為 [斯坦因地名索引](https://dsr.nii.ac.jp/digital-maps/stein/place-names/index.html.en)。
- 衛星底圖來源：Esri, USGS, GIS User Community.

