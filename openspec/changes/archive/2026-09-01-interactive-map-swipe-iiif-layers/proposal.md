## Why

劇組在進行絲路歷史田調考據時，需要更細緻的古今地貌對比（卷簾切割比對）、微觀文物深縮放（IIIF 檢視佉盧文木牘筆劃）、以及巨觀水系變遷與商路推測線圖層，以釐清「水斷城廢」與交通路網之歷史演變。

## What Changes

- **卷簾比對模式**：引入 Leaflet-Side-by-Side 套件，提供「透明度疊合」與「左右卷簾拖曳比對」雙模式切換。
- **IIIF 文物深縮放**：於側邊欄整合 OpenSeadragon 檢視器，當資料提供 `iiif_url` 時啟用瓦片化深縮放，無 IIIF 則降級為一般圖片預覽。
- **古水系與商路向量圖層**：新增獨立的 `data/waterways.geojson`（孔雀河、塔里木河故道等）與 `data/routes.geojson`（絲路南道、北道推測線），並於地圖提供獨立開關與樣式區隔。
- **時間軸連動篩選**：擴充時間軸滑桿，使其同步篩選遺址點位與具備活躍年代之古水系向量線。

## Capabilities

### Modified Capabilities

- `silk-road-map`: 擴充地圖互動功能，支援卷簾對照、IIIF 深縮放、獨立古水系與商路向量圖層，以及多圖層時間軸聯動。

## Impact

- Affected specs: `silk-road-map`
- Affected code:
  - New: `data/waterways.geojson`, `data/routes.geojson`
  - Modified: `index.html`, `js/app.js`, `css/style.css`
  - Removed: (none)
