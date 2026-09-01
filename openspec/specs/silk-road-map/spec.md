# 絲路歷史田調互動地圖（Silk Road Historical Map）規範

## 目的

本系統旨在協助影視劇組進行古代樓蘭與尼雅絲路遺址的歷史考據與田調資料整合。透過疊合現代衛星圖、百年測繪圖磚與田調考據點位，提供古今對照、時間軸篩選、文物圖片檢視與考據可信度標註功能，並保障內部未公開設定與版權安全性。

---

## 需求與功能定義

### 需求 1：三層圖層架構與古今對照

系統必須提供三層地圖資料疊合與透明度調節能力。

#### 情境 1.1：基礎圖層載入
- 底層為現代衛星空照圖（如 OpenStreetMap、Esri World Imagery 或 MapLibre 相容圖資）。
- 中層為日本國立情報學研究所（DSR）之斯坦因《Serindia》歷史測繪圖磚（XYZ 格式，覆蓋東經 73 至 104、北緯 34 至 45）。
- 頂層為劇組自訂田調點位、商路推測線與古水系路徑。

#### 情境 1.2：透明度調節與圖層開關
- 提供透明度滑桿或卷簾對照功能，供使用者即時比對歷史測繪地貌與現代衛星空照。
- 提供圖層開關，可獨立切換「遺址點位」、「古水系故道（塔里木河、孔雀河）」與「商路推測線」。

---

### 需求 2：田調資料結構（GeoJSON）

所有點位資料以單一 GeoJSON 檔案（`data/sites.geojson`）作為唯一資料來源，欄位必須符合劇組考據與美術需求。

#### 欄位規範
- `id`：唯一識別碼（字串）。
- `name_zh`：中文地名（字串，如「樓蘭古城」）。
- `name_kharosthi`：佉盧文轉寫名稱（字串，選填）。
- `stein_id`：斯坦因編號（字串，如「LA」、「N.xiv」）。
- `geometry`：地理座標（Point，經緯度）。
- `period`：年代區間物件，包含 `start_year` 與 `end_year`（整數，西元年，西元前以負數表示）。
- `evidence_level`：考據等級（列舉：`artifact` 出土實物佐證、`text` 文獻記載、`speculation` 學者推測）。
- `source_links`：出處連結清單（字串陣列，如 IDP 物件頁、DSR 頁面）。
- `rights`：版權與授權狀態（列舉：`public_domain` 公有領域、`internal_only` 劇組內部使用、`commercial_cleared` 已取得商業授權）。
- `description`：考據重點與劇情備註（字串）。
- `images`：關聯圖片清單（物件陣列，包含 `url`、`caption`、`iiif_url`、`source`）。

---

### 需求 3：時間軸與點位互動篩選

#### 情境 3.1：年代滑桿篩選
- 使用者拖動時間軸滑桿時，地圖僅顯示其年代區間（`start_year` 至 `end_year`）涵蓋該時間點的點位。

#### 情境 3.2：考據等級與側欄檢視
- 地圖點位依 `evidence_level` 顯示不同樣式或標籤顏色，供美術組辨識自由發揮空間。
- 點擊點位標記時展開側邊欄，展示地名對照、年代、考據出處、歷史照片與 IIIF 圖片連結。

---

### 需求 4：本機優先與資料安全

#### 情境 4.1：純靜態本機運行
- 前端採用純靜態架構（HTML、CSS、JavaScript 搭配 Leaflet 地圖庫），無需後端伺服器與資料庫。
- 支援透過本機靜態伺服器（如 Python http.server 或 VS Code Live Server）直接開啟與操作。

#### 情境 4.2：版權與機敏資料隔離
- 公開圖檔直接引用來源 URL 或 IIIF 網址，避免將大量未授權高解析度圖檔提交至版本控制儲存庫。
- 劇組內部劇本設定標註為 `internal_only`，不上傳至公開儲存庫。

## Requirements

### Requirement: Multi-layer historical map overlay
The system SHALL overlay modern satellite imagery and Stein's Serindia historical map tiles in XYZ format, and SHALL provide an opacity slider for historical-to-modern map comparison.

#### Scenario: Historical layer rendering and opacity control
- **WHEN** user adjusts the historical map opacity slider
- **THEN** the historical map layer transparency SHALL update dynamically on top of the base satellite layer

---
### Requirement: Archaeological site points visualization
The system SHALL render archaeological sites from a local GeoJSON dataset with evidence level distinctions.

#### Scenario: Site marker display
- **WHEN** the map loads `data/sites.geojson`
- **THEN** site markers SHALL be plotted at their specified geographic coordinates with evidence level indicators

---
### Requirement: Timeline filtering
The system SHALL filter visible archaeological sites based on a user-selected historical year.

#### Scenario: Year slider interaction
- **WHEN** user changes the timeline slider position
- **THEN** only sites whose active period covers the selected year SHALL remain visible on the map

---
### Requirement: Site detail side panel
The system SHALL provide a side panel showing detailed archaeological metadata and imagery upon selecting a site.

#### Scenario: Marker selection
- **WHEN** user clicks on a site marker
- **THEN** the side panel SHALL display the site Chinese name, Kharosthi transcription, Stein ID, period, evidence level, rights status, description, and source links
