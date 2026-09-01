## Why

劇組在進行古代樓蘭與尼雅絲路遺址的歷史考據與田調時，需要整合現代衛星圖、百年測繪圖磚與文獻照片，以便直觀比對古今地貌、年代時序及文物出處。本變更旨在建立純靜態、本機優先的互動歷史地圖原型，提供古今圖層卷簾對比、時間軸篩選與考據資料標註功能。

## What Changes

- 建立單一純靜態互動地圖網頁（`index.html`），以 Leaflet 作為地圖渲染引擎。
- 整合日本國立情報學研究所（DSR）之斯坦因《Serindia》歷史測繪圖磚與現代衛星空照底圖，提供圖層透明度或卷簾對照功能。
- 定義並建立田調點位資料庫（`data/sites.geojson`），包含地名、佉盧文轉寫、年代區間、考據等級、出處連結與授權狀態欄位。
- 實作年代區間時間軸滑桿與圖層篩選控制面板。
- 實作點位點擊展開側欄功能，展示考據備註與 IIIF / 線上文物圖片檢視。

## Capabilities

### New Capabilities

- `silk-road-map`: 絲路歷史田調互動地圖基礎功能，包含三層圖層疊合、時間軸篩選、考據點位側欄與純靜態本機運作。

### Modified Capabilities

(none)

## Impact

- Affected specs: `silk-road-map`
- Affected code:
  - New: `index.html`, `data/sites.geojson`, `css/style.css`, `js/app.js`
  - Modified: (none)
  - Removed: (none)
