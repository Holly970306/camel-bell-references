## Context

影視劇組在進行樓蘭、尼雅等絲路遺址田調時，需要對照百年測繪地圖（如斯坦因《Serindia》）與當代地理空照，並將出土文物、文獻考據等級及版權授權資訊整合呈現。考量機敏性與輕量化，本系統採用本機優先（Local-first）與純靜態架構。

## Goals / Non-Goals

**Goals:**
- 提供以 Leaflet 為基礎的純靜態地圖介面，無需後端伺服器即可在本機開啟。
- 整合現代衛星影像與日本 DSR 斯坦因《Serindia》XYZ 圖磚，提供古今圖層透明度調節與卷簾對照。
- 建立標準化 `sites.geojson` 資料模型，記錄中英文地名、佉盧文轉寫、年代區間、考據等級、出處與授權狀態。
- 支援年代時間軸篩選與考據點位側欄檢視。

**Non-Goals:**
- 不建置需要資料庫或認證系統的後端 API。
- 不在本機儲存庫內存放未授權的高解析度大圖檔，圖片以線上 URL / IIIF 形式引用。
- 不支援非 Web Mercator 投影之動態重投影配準（直接使用 DSR 現成 EPSG:3857 圖磚）。

## Decisions

### 選擇 Leaflet 作為前端地圖引擎
- **理由**：相較於 MapLibre 或 OpenLayers，Leaflet 程式碼結構簡潔，支援輕量化外掛（如透明度滑桿、卷簾比對），適合以單一 HTML/JS 檔快速建置原型，無建置編譯負擔。
- **替代方案評估**：MapLibre GL JS 向量效能較佳且支援三維地貌，但設定繁複且與 IIIF 外掛整合較重，後期若有三維地形需求再行重構。

### 採用單一 GeoJSON 作為資料唯一來源
- **理由**：文字格式體積小、易於 Git 版控與多人協作，並可直接透過 geojson.io 或 QGIS 視覺化編輯。
- **替代方案評估**：SQLite/Spatialite 或 REST API 需額外啟動服務，增加劇組非技術人員的使用門檻。

## Implementation Contract

- **Behavior**: 使用者透過本機靜態伺服器開啟 `index.html`，畫面呈現塔里木盆地地圖，可調整斯坦因歷史圖磚透明度，拉動時間軸滑桿篩選符合年代的點位，點擊點位標記時展開側欄展示考據細節與圖片。
- **Interface / data shape**: `data/sites.geojson` 符合標準 RFC 7946 FeatureCollection 格式，每筆 Feature 包含 `name_zh`、`stein_id`、`period` (`start_year`, `end_year`)、`evidence_level` (`artifact` | `text` | `speculation`)、`rights`、`images` 等屬性。
- **Failure modes**: 當圖片 URL 載入失敗時，側欄顯示預設缺圖圖示與原始連結；當年代未設定時預設於所有時間區間皆顯示。
- **Acceptance criteria**: 於本機瀏覽器開啟頁面無 Console 錯誤，DSR 圖磚正常載入，至少包含樓蘭（LA）與尼雅（N.xiv）示範點位，時間軸與側欄互動正常。
- **Scope boundaries**: 僅限於本機靜態網頁與點位 GeoJSON 呈現，不包含伺服器後端與使用者權限管理。

## Risks / Trade-offs

- **[Risk]** DSR 外部圖磚伺服器若無網路連線將無法載入。
  - **Mitigation** → 系統保留快取機制說明，底層提供備用 OpenStreetMap 向量圖資。
- **[Risk]** 劇組誤將內部機敏劇本或未授權圖片發布至公開儲存庫。
  - **Mitigation** → 於資料結構中標記 `rights` 欄位，並於規範中明確提示公開與私有儲存庫之隔離原則。
