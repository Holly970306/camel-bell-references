## Context

現有地圖原型已實現基礎衛星圖磚與斯坦因圖磚疊合、點位標記及側欄。為滿足劇組深入考據需求，需進一步支援卷簾比對（左右分割）、IIIF 高清深縮放（看清佉盧文木牘筆畫）、以及將關鍵的古水系故道與商路推測線圖層獨立分離並與時間軸連動。

## Goals / Non-Goals

**Goals:**
- 提供「透明度調節」與「左右卷簾比對（Leaflet-Side-by-Side）」雙模式切換。
- 側邊欄整合 OpenSeadragon，當文物提供 `iiif_url` 時啟用瓦片化深縮放。
- 建立 `data/waterways.geojson` 與 `data/routes.geojson` 獨立向量圖層，具備獨立樣式與圖層開關。
- 時間軸滑桿連動篩選點位與古水系故道。

**Non-Goals:**
- 不架設 IIIF Image Server，直接引用第三方（如 IDP、東洋文庫、京都大學等）既有之 IIIF Manifest 或 Image API endpoint。
- 不進行複雜的伺服器端向量切割，維持純靜態 GeoJSON 載入。

## Decisions

### 雙模式切換（透明度 vs 卷簾）
- **決策**：在左上角控制面板提供模式切換按鈕。在「透明度模式」下隱藏卷簾控制桿並啟用滑桿；在「卷簾模式」下載入 `leaflet-side-by-side` 分割控制器，將左側設為歷史圖磚、右側設為現代衛星空照。
- **替代方案**：若僅保留卷簾模式，使用者無法一鍵總覽古今疊合之半透明全貌。

### 側欄 IIIF 與靜態圖片混合檢視
- **決策**：引入 OpenSeadragon。當文物物件包含有效的 `iiif_url` 時，於側欄動態建立檢視容器；若僅有一般 `url` 或無網路時，維持 `<img>` 圖片呈現。
- **替代方案**：僅用靜態放大鏡外掛（Magnifier.js），無法讀取 IIIF 協定且解析度受限於原圖下載大小。

### 水系與商路獨立向量檔案
- **決策**：將線段（LineString）抽離至 `data/waterways.geojson` 與 `data/routes.geojson`，與 `data/sites.geojson`（Point）保持職責分離。
- **替代方案**：全部塞入單一 GeoJSON 會導致資料結構混亂且難以讓田調人員分工標記。

## Implementation Contract

- **Behavior**: 使用者可在左上角切換「透明度」與「卷簾」檢視；地圖右上角圖層控制可獨立勾選遺址、古水系與商路；點選文物具有 IIIF 網址的遺址時，側欄可進行深縮放操作；拉動時間軸時，孔雀河故道與各遺址點位依年代同步顯隱。
- **Interface / data shape**:
  - `data/waterways.geojson`: FeatureCollection (LineString)，包含 `name_zh`、`period` (`start_year`, `end_year`)、`status` (`dry_up` | `active`)、`description`。
  - `data/routes.geojson`: FeatureCollection (LineString)，包含 `name_zh`、`route_type` (`southern` | `northern` | `oasis`)、`description`。
- **Failure modes**: 若 IIIF 服務無法連線或無 `iiif_url`，自動降級為一般預覽圖或標記出處連結。
- **Acceptance criteria**: 卷簾拖曳順暢無切邊破圖，OpenSeadragon 在具備 IIIF 資料時正確初始化，圖層控制器可獨立控制三種向量圖層。
- **Scope boundaries**: 僅限純靜態 HTML/JS/CSS 擴充，不新增後端服務。

## Risks / Trade-offs

- **[Risk]** 第三方 IIIF 伺服器若有 CORS 限制可能無法由本機跨來源讀取。
  - **Mitigation** → 側欄提供直連外部官方瀏覽頁面的 fallback 按鈕。
