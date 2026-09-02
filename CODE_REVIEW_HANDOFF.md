# 程式碼審查交接手冊

**交接日期：**2026 年 9 月 2 日  
**最後更新：**2026 年 9 月 2 日晚間  
**審查目標：**審查目前工作區未提交的變更，確認遺址參考連結修復、新增 Chindailik 點位與年代篩選、斯坦因編號對照修正、CSV 清冊重建與地圖快取修正可安全且正確地合併。

---

## 1. 專案摘要

本專案是純靜態的 Leaflet 歷史地圖，無後端或資料庫。主要資料及行為流程如下：

```text
GeoJSON 資料
  data/sites.geojson
        │
        ▼
Leaflet 點位與時間軸篩選
  js/app.js
        │ 點選點位
        ▼
右側遺址說明欄與外部連結
  js/site-detail.js
```

- 地圖資料透過 `fetch` 載入 GeoJSON，因此必須經由靜態 HTTP 伺服器開啟，不能直接雙擊 HTML 檔案。
- `data/sites.geojson` 的 Point 座標順序是 GeoJSON 標準 `[longitude, latitude]`。
- `js/app.js` 在繪製 Leaflet 標記時改為使用 `[latitude, longitude]`。
- 時間軸每 10 年篩選一次；點位的顯示條件是選取年份落在 `period.start_year` 與 `period.end_year` 之間，含兩端。

---

## 2. 本次變更目的

本次工作對應已完成的 Spectra change：`repair-site-reference-links`。

### 完成內容

1. 將每個遺址的 `source_links` 從裸網址陣列改成具結構的物件。
2. 側欄只顯示一筆具名外部連結；DSR 記錄優先導向其個別地名記錄頁。
3. 移除已失效的 DSR GETA CGI 與 Serindia 地理頁參考連結。
4. 在外部圖片及 IIIF 載入失敗時，改以中文佔位訊息顯示，且保留圖片說明與來源。
5. 將高昌古城座標修正為使用者確認的遺址位置。
6. 依 `outputs/stein-gazetteer-site-links.xlsx` 補齊連結清冊，新增第 21 個點位「阿蘭的家（Chindailik）」。
7. 將 Chindailik 限定為西元 200 至 340 年，側欄說明為「魏晉時期（西元 200 至 340 年）」。
8. 修正側欄「斯坦因編號」欄位資料：8 筆真正的斯坦因圖錄編號保留，其餘 13 筆改為對照連結清冊的「斯坦因地名」欄；小河與陽關無 DSR 個別記錄，`stein_id` 清為空字串，側欄顯示「-」。
9. 重建在 Excel 編輯過程中遺失的 `outputs/stein-gazetteer-site-links.csv`，並新增測試防止再次遺失或與資料集脫節。
10. 修正「改了 geojson 但地圖仍顯示舊資料」的長期問題：`js/app.js` 三個資料 `fetch` 加上 `{ cache: "no-store" }`，並新增 `serve_map.py` 本機預覽伺服器（每個回應送不要快取標頭），`start_map.bat` 改為呼叫它並使用 port 8001。

---

## 3. 未提交檔案與審查優先順序

| 優先度 | 檔案 | 審查重點 |
| --- | --- | --- |
| 高 | `data/sites.geojson` | 21 筆 Feature 的資料形狀、座標順序、外部連結、年代範圍與資料一致性。 |
| 高 | `js/app.js` | 點位點選、時間軸顯隱、側欄掛載、OpenSeadragon 生命週期與失敗處理。 |
| 高 | `js/site-detail.js` | 外部連結安全渲染、HTML 跳脫、失效圖片替換行為。 |
| 高 | `tests/site-reference-links.test.mjs` | 是否涵蓋資料契約與 Chindailik 的年代邊界。 |
| 中 | `index.html` | `site-detail.js` 是否在 `app.js` 前載入。 |
| 中 | `css/style.css` | `.image-unavailable` 佔位樣式是否不會破壞側欄版面。 |
| 中 | `serve_map.py` | 本機預覽伺服器：是否固定以專案根目錄為服務目錄、每個回應是否送出不要快取標頭。 |
| 中 | `start_map.bat` | 是否正確呼叫 `serve_map.py` 並使用 port 8001。本檔已改為納入版控，與 `serve_map.py` 成對。 |
| 中 | `.gitignore` | 是否正確排除 `.chrome-verify/` 與 Office 鎖定檔 `~$*`，且已解除 `start_map.bat` 的排除。 |
| 低 | `README.md` | DSR 出處連結是否仍適合作為公開引用入口。 |
| 資料 | `outputs/stein-gazetteer-site-links.xlsx`、`outputs/stein-gazetteer-site-links.csv` | xlsx 是人工校正連結的清冊來源；csv 由 xlsx 重建，須與其內容同步。注意第三欄標題已由「斯坦因檢索詞」改名為「斯坦因地名」。 |

`.chrome-verify/` 與 Office 鎖定檔 `~$*` 已加入 `.gitignore`，不會進入提交範圍，也不需審查。

---

## 4. 資料契約

### `source_links`

每個地點目前都有恰好一筆 `source_links` 記錄。DSR 記錄採下列形狀：

```json
{
  "label": "斯坦因地名記錄",
  "search_term": "Chindailik",
  "url": "https://dsr.nii.ac.jp/cgi-bin/digital-maps/list.pl?lang=en&map=stein&name=Chindailik",
  "record_title": "Chindailik",
  "record_url": "https://dsr.nii.ac.jp/digital-maps/stein/place-names/00941.html.en",
  "fallback_url": "https://dsr.nii.ac.jp/digital-maps/stein/place-names/index.html.en",
  "status": "verified"
}
```

- `status` 只允許 `verified`、`fallback`、`unavailable`。
- `verified` 的 DSR 記錄必須有可用 `record_url`，側欄優先使用它，而非搜尋結果 `url`。
- 小河與陽關無對應的 DSR 個別記錄，使用 Wikipedia 連結，標籤為「公開參考資料」。這是本次明確允許的例外。
- 不應重新加入下列淘汰網址：
  - `dsr.nii.ac.jp/cgi-bin/toyobunko/geta_search.pl`
  - `dsr.nii.ac.jp/geography/stein-maps/serindia/`

### Chindailik

| 欄位 | 預期值 |
| --- | --- |
| Feature ID | `chindailik` |
| 中文名 | 阿蘭的家（Chindailik） |
| 英文名 | Chindailik |
| 座標 | `[89.9379, 39.619938]` |
| 起始年 | `200` |
| 結束年 | `340` |
| 年代說明 | 魏晉時期（西元 200 至 340 年） |
| DSR 記錄 | `00941.html.en` |

### `stein_id`（側欄「斯坦因編號」欄位）

`stein_id` 必須與 `outputs/stein-gazetteer-site-links.xlsx` 的「斯坦因地名」欄一致，規則如下：

- 有真正斯坦因圖錄編號的 8 筆保留原值：`LA`、`N.xiv`、`M.I`、`E.i`、`T.xix`、`K.K.`、`L.K.`、`T.xiv`。
- 其餘 13 筆等於該筆在清冊「斯坦因地名」欄的值，例如喀拉墩為 `Kara-dong`、瓦石峽為 `Vāsh-shahri`、土垠為 `L. G `（含尾端空白）、阿達格泉為 `Ak-tāgh-bulak`。
- 清冊標為「無」的小河與陽關，`stein_id` 為空字串，側欄顯示「-」。
- 側欄欄位名稱維持「斯坦因編號」，不要改名。
- 地圖標記短標籤取自 `stein_id`，為空時退回中文名前兩字，這是預期行為。

---

## 5. 已知審查風險與建議檢查

### 資料正確性

1. **外部連結品質**：測試主要驗證網址形狀與資料契約，無法保證外部 DSR、Wikipedia 長期可存取。應抽查 Chindailik、土垠、阿達格泉、小河與陽關的實際開啟結果。
2. **歷史詮釋**：Chindailik 的 200 至 340 年是使用者已確認的標示範圍；若資料來源有不同觀點，應另建 change 討論，不要在 code review 自行改回寬泛區間。
3. **欄位一致性**：`search_term` 必須是該筆資料的英文名稱、斯坦因編號或列於 `search_aliases` 的英文字詞。注意 `L. G ` 等名稱含尾端空白，這是連結清冊現況的一部分。

### 前端可靠性

1. `index.html` 必須先載入 `js/site-detail.js`，再載入 `js/app.js`；否則 `window.SiteDetail` 不存在會導致點選點位時發生錯誤。
2. `destroyActiveOsViewers()` 必須在切換點位與關閉側欄時銷毀所有 OpenSeadragon 檢視器，避免殘留事件或記憶體。
3. 普通圖片的 inline `onerror` 呼叫 `window.SiteDetail.replaceFailedImage(this)`。請確認腳本載入失敗時不會讓例外破壞整個側欄。
4. `renderSourceLinks()` 已對連結文字及 URL 做 HTML 跳脫，且外部連結使用 `target="_blank" rel="noopener noreferrer"`。新增來源欄位時必須維持這項保護。

### 安全性注意事項

1. 本專案的密碼驗證在客戶端執行，`js/app.js` 內含 SHA-256 雜湊值，且通過狀態儲存在 `sessionStorage`。這只適用於避免誤入，**不是真正的存取控制**；能檢視前端檔案的人可繞過。
2. 未來若地圖含敏感資料，應移至伺服器端驗證或受控平台，不應把安全性要求建立在前端雜湊、HTML 遮罩或 `sessionStorage` 上。
3. GeoJSON 內容目前受版本控制且不是使用者輸入；若未來由表單或外部 API 匯入，`name_zh`、`description`、圖片說明等直接插入 `innerHTML` 的欄位也必須採取統一的 HTML 跳脫處理。

---

## 6. 測試與手動驗收

### 自動測試

在專案根目錄執行：

```powershell
node --test tests/site-reference-links.test.mjs
```

目前預期為 8 個測試全數通過。測試涵蓋：

- 21 個地點都有 1 筆已驗證來源。
- `outputs/stein-gazetteer-site-links.csv` 存在、21 筆資料列，且「側欄顯示連結」欄集合等於 geojson 的 `record_url` 集合。
- 21 筆 `stein_id` 逐一符合期望值對照表。
- 高昌 GPS 座標為 `[89.497286, 42.8004456]`。
- Chindailik 座標、DSR 記錄及 200 至 340 年年代資料正確。
- DSR 記錄連結、fallback 顯示與影像失敗佔位的輸出行為。

### 手動檢查

1. 雙擊 `start_map.bat`（會啟動 `serve_map.py`，網址 `http://localhost:8001`）。不要再用 `python -m http.server 8000`，該 port 的瀏覽器快取曾造成長時間誤判。
2. 將時間軸調整至西元 190 年：Chindailik 不應顯示。
3. 調整至西元 200、300、340 年：Chindailik 應顯示。
4. 調整至西元 350 年：Chindailik 不應顯示。
5. 點選 Chindailik，確認側欄顯示「魏晉時期（西元 200 至 340 年）」及「斯坦因地名記錄」。
6. 點選小河與陽關，確認側欄標籤為「公開參考資料」且能開啟各自的 Wikipedia 詞條。
7. 點選含 IIIF 的尼雅，並以網路失敗情境確認保留圖說及來源資訊的佔位畫面。

---

## 7. Spectra 規格與狀態

- Change 名稱：`repair-site-reference-links`
- 工作流程：`spec-driven`
- 任務狀態：31/31 完成（第 11 節斯坦因編號修正、第 12 節 CSV 重建與快取修正為 9 月 2 日晚間追加）。
- `spectra validate` 通過。`spectra analyze` 尚有 4 個既有 Warning（`COV-1`、`COV-2`、`CON-1`、`CON-2`），成因是分析器以規格英文標題比對中文任務文字，與本次變更無關。
- 若審查發現應修正的問題，先以 `/spectra:discuss` 釐清決策，再使用 `/spectra:propose` 建立新的 change；不要改寫已完成 change 的歷史任務。
- 如審查結論為可接受，可執行 `/spectra:archive repair-site-reference-links` 歸檔。

主要規格檔：

- `openspec/changes/repair-site-reference-links/proposal.md`
- `openspec/changes/repair-site-reference-links/design.md`
- `openspec/changes/repair-site-reference-links/specs/silk-road-map/spec.md`
- `openspec/changes/repair-site-reference-links/tasks.md`

---

## 8. 建議 Code Review 指令

請新 AI 依序執行：

```powershell
Get-Content CODE_REVIEW_HANDOFF.md

git status --short
git diff HEAD -- data/sites.geojson js/app.js index.html css/style.css README.md .gitignore

node --test tests/site-reference-links.test.mjs
```

`js/site-detail.js`、`tests/site-reference-links.test.mjs`、`serve_map.py`、`outputs/` 是全新的未追蹤檔案，`git diff` 看不到，請直接讀取檔案內容審查。

審查結論請至少列出：

1. 必須修正的問題，包含嚴重度、檔案位置與原因。
2. 建議修正但不阻擋合併的問題。
3. 外部連結與歷史資料中無法僅靠程式碼確認的假設。
4. 是否可進行 Spectra 歸檔及 Git 提交。
