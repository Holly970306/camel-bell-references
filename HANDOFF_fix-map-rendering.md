# 交接手冊：fix-map-rendering-and-link-safety

交接日期：2026 年 9 月 2 日
交接對象：接手的 AI（Codex）
撰寫者：Claude Code

---

## 1. 現在在哪一步

專案有兩個 Spectra change：

| Change | 狀態 | 說明 |
| --- | --- | --- |
| `repair-site-reference-links` | done，35/35，已提交 `c47f78a`，尚未歸檔、尚未 push | 上一輪工作，已完成 |
| `fix-map-rendering-and-link-safety` | in-progress，9/13 | 本次交接的重點，程式碼已改完，剩 4 項手動驗收 |

Git 狀態：

- 目前分支 `main`，最後一個 commit 是 `c47f78a`（`repair-site-reference-links`）。
- `origin/main` 停在 `6460f0a`，所以 `c47f78a` 還沒 push 到 GitHub（repo：`Holly970306/camel-bell-references`，公開）。
- 工作區有未提交變更，全部屬於 `fix-map-rendering-and-link-safety`：
  - `js/app.js`、`js/site-detail.js`、`tests/site-reference-links.test.mjs`、`README.md`

`openspec/` 在 `.gitignore` 內，Spectra 文件不進 git，只在本機。

---

## 2. 這個 change 要修什麼

來源是 `repair-site-reference-links` 的 code review 找出的五個前端缺陷。完整規格在：

- `openspec/changes/fix-map-rendering-and-link-safety/proposal.md`
- `openspec/changes/fix-map-rendering-and-link-safety/design.md`（含 Implementation Contract）
- `openspec/changes/fix-map-rendering-and-link-safety/specs/silk-road-map/spec.md`
- `openspec/changes/fix-map-rendering-and-link-safety/tasks.md`

五個缺陷：

1. 同時有 `iiif_url` 與 `url` 的影像，IIIF 失敗後永遠退不回一般圖檔（尼雅）。
2. `js/app.js` 對 `window.SiteDetail` 是一次取值的硬相依，模組沒載入就整個點擊無反應。
3. `js/site-detail.js` 的 `renderSourceLinks` 不驗證 URL scheme，`javascript:` 連結會執行。
4. 圖磚出處連結用純 HTTP 且指向已淘汰的 `/toyobunko/` 路徑。
5. `open-failed` 後 viewer 沒移出 `activeOsViewers`，`destroyActiveOsViewers` 無 try/catch。

---

## 3. 已完成的程式修改（9/13）

以下都已改完並通過自動測試。對應 tasks.md 的任務編號。

### 任務 1、2：URL scheme 白名單（`js/site-detail.js`）

- 新增模組層級常數 `ALLOWED_LINK_PROTOCOLS = new Set(["https:", "http:"])` 與函式 `isAllowedHttpUrl(value)`：以 `new URL(String(value))` 解析，回傳 protocol 是否在白名單；解析失敗回傳 `false`。
- `renderSourceLinks` 內的守衛由 `if (!destination)` 改為 `if (!destination || !isAllowedHttpUrl(destination))`，不合法就回傳既有的「目前無可用公開連結」。
- HTML 跳脫、函式簽章、回傳型別都沒動。

### 任務 3：影像三段降級（`js/app.js`）

- 新增 `plainImageCardInner(img)`：回傳一般圖檔卡片的內層 HTML（`<img>` 加 caption），供初次渲染與降級共用。
- 新增 `degradeIiifCard(card, img)`：`img.url` 非空就把卡片內容換成 `plainImageCardInner(img)`，否則呼叫 `getSiteDetail().replaceImageCard(card, img)` 落到文字佔位。
- IIIF 的 `open-failed` handler 與建構期 `catch` 都改呼叫 `degradeIiifCard`（原本直接呼叫 `replaceImageCard`，等於直接跳到佔位）。
- `else if (img.url)` 分支改用 `plainImageCardInner`，消除重複字串。

### 任務 5、6：模組缺席備援（`js/app.js`）

- 移除 `const siteDetail = window.SiteDetail;`。
- 新增 `buildFallbackSiteDetail()`：回傳最小備援物件，提供 `renderSourceLinks`、`renderImageFallback`、`replaceImageCard`、`replaceFailedImage`，輸出中文不可用訊息，不涉及樣式。
- 新增 `getSiteDetail()`：有 `window.SiteDetail` 就回傳它，否則回傳備援並在主控台印一次警告（用 `warnedMissingSiteDetail` 旗標避免洗版）。
- 所有 `siteDetail.X(...)` 呼叫點改為 `getSiteDetail().X(...)`。
- 行內 `onerror` 從 `window.SiteDetail.replaceFailedImage(this)` 改為 `window.handleMapImageError(this)`；`window.handleMapImageError` 是掛在 window 上的薄包裝，內部用 `getSiteDetail()` 取模組並檢查 `replaceFailedImage` 是函式才呼叫。

### 任務 8：檢視器生命週期（`js/app.js`）

- `destroyActiveOsViewers`：每個 `viewer.destroy()` 包 try/catch，`activeOsViewers = []` 維持在 forEach 之後無條件執行。
- 新增 `discardOsViewer(viewer)`：從 `activeOsViewers` 用 `indexOf` 加 `splice` 移除該 viewer，再 try/catch 呼叫 `destroy`。
- `open-failed` handler 在 `degradeIiifCard(...)` 之後多呼叫 `discardOsViewer(viewer)`。

### 任務 10、11：出處連結改 HTTPS（`js/app.js`、`README.md`）

- `js/app.js` 的 Serindia 圖層 attribution：`href` 從 `http://dsr.nii.ac.jp/toyobunko/` 改為 `https://dsr.nii.ac.jp/digital-maps/stein/place-names/index.html.en`，並補上 `target='_blank' rel='noopener noreferrer'`。
- `README.md` 授權與引用聲明段：連結改為同一個 HTTPS 網址，文字改為「地名考據入口為 斯坦因地名索引」，不再宣稱指向東洋文庫入口。

### 任務 12：自動測試（`tests/site-reference-links.test.mjs`）

新增三個測試，目前 11 個測試全數通過：

- `site detail rejects a non-http reference scheme`：`javascript:` 目的地輸出「目前無可用公開連結」且不含 `<a` 與 `javascript:`。
- `site detail still renders http and https reference destinations`：HTTP 與 HTTPS 目的地仍輸出帶 `target="_blank"` 與 `rel="noopener noreferrer"` 的連結。
- `tile attribution and README use the current HTTPS Stein entry point`：讀取 `js/app.js` 與 `README.md`，斷言不含 `http://dsr.nii.ac.jp/toyobunko/` 且都含 HTTPS 斯坦因索引網址。

---

## 4. 你要做的事：剩下 4 項手動驗收

這四項都是要在瀏覽器裡看畫面，我（前一個 AI）無法代做。對應 tasks.md 的任務 4、7、9、13。

### 前置

雙擊 `start_map.bat`（會啟動 `serve_map.py`，網址 `http://localhost:8001`，這個伺服器會送不要快取的標頭，改檔後直接重整即可）。登入後把時間軸拉到需要的年份。

不要用 `python -m http.server 8000`。8000 那個 port 的瀏覽器快取在先前 session 造成過長時間誤判，已改用 8001。

### 任務 4：影像降級

- 開尼雅遺址側欄。尼雅的 `iiif_url` 是 `https://idp.bl.uk/api/iiif/image/placeholder-niya-tablet/info.json`，這是必然失敗的佔位網址。
- 預期：IIIF 失敗後卡片顯示 `https://dsr.nii.ac.jp/digital-maps/stein/images/sites/niya_house.jpg` 這張一般圖檔，加上原本的說明與來源，不再顯示「影像目前無法載入」。
- 再開樓蘭（只有 `url`、沒有 `iiif_url`），確認影像行為沒有被改壞。
- 若 `niya_house.jpg` 本身也連不上（外部 DSR 網域），會落到文字佔位，這是預期行為，在驗收紀錄註明即可。

### 任務 7：模組缺席

- 把 `index.html` 裡 `<script src="js/site-detail.js"></script>` 的 src 暫時改成不存在的路徑，例如 `js/site-detail-missing.js`。
- 重整地圖，點任一點位。
- 預期：側欄仍會開啟，顯示標題、中文名、年代區間、考據等級；參考連結區塊顯示「目前無可用公開連結」；F12 主控台只有一則「js/site-detail.js 未載入」的警告，沒有紅色未攔截例外。
- 確認後把 `index.html` 的 src 改回 `js/site-detail.js`，重整再確認一切正常。

### 任務 9：檢視器生命週期

- 連續開啟並關閉含 IIIF 的尼雅側欄至少三次。
- `activeOsViewers` 是 `js/app.js` DOMContentLoaded 閉包內的區域變數，主控台存取不到。改為觀察：每次關閉側欄後沒有殘留的 OpenSeadragon DOM 節點累積、主控台沒有未攔截例外。
- 若想更嚴謹，可在 `js/app.js` 的 `closeSidePanel` 或 `destroyActiveOsViewers` 暫時加一行 `console.log(activeOsViewers.length)`，確認每次關閉後回到 0，驗收後移除該行。

### 任務 13：整體驗收

- 時間軸放西元 300 年，依序開尼雅、樓蘭、Chindailik、小河、陽關。
- 確認影像降級、參考連結、斯坦因編號欄位、年代顯示都正常。
- 確認 `git diff data/sites.geojson` 為空（本次 change 不應動到資料檔）。

### 驗收完成後

每通過一項就標記：

```
spectra task done --change "fix-map-rendering-and-link-safety" 4
spectra task done --change "fix-map-rendering-and-link-safety" 7
spectra task done --change "fix-map-rendering-and-link-safety" 9
spectra task done --change "fix-map-rendering-and-link-safety" 13
```

四項都完成後：

```
spectra instructions apply --change "fix-map-rendering-and-link-safety" --json
```

確認 `state` 是 `all_done`，然後可以歸檔（見第 6 節）。

---

## 5. 指令與環境注意事項

- 測試一律用檔案路徑，不要用資料夾：
  ```
  node --test tests/site-reference-links.test.mjs
  ```
  這台是 Node 22.17，`node --test tests/` 會 `MODULE_NOT_FOUND`。
- 目前預期 11 個測試全過（8 個來自 `repair-site-reference-links`，3 個本次新增）。
- Shell 是 Windows PowerShell 為主，也有 Git Bash。commit message 若要多行，PowerShell 用單引號 here-string，Git Bash 用 heredoc，不要混用（前一個 AI 混用過，commit subject 多了一個 `@`，靠 `git commit --amend` 修掉）。
- 專案 commit 慣例：`spectra(<change-name>): <摘要>`，body 帶 `Change:` 與 `Tasks: N/M complete` 兩行。
- `.spectra.yaml` 沒有開 `tdd` / `audit` / `parallel_tasks`。
- `spectra analyze fix-map-rendering-and-link-safety` 目前是乾淨的（零 findings）。
- `spectra analyze repair-site-reference-links` 有 4 個既有 Warning（`COV-1`、`COV-2`、`CON-1`、`CON-2`），成因是分析器拿規格英文標題比對中文任務文字，與程式無關，歸檔前想清可在 tasks.md 第 9、10 節各補一句規格需求名稱。

---

## 6. 全部完成後的收尾順序

1. `fix-map-rendering-and-link-safety` 四項手動驗收標記完成。
2. 提交這個 change 的檔案。可用 Spectra 的 commit 流程，或手動逐一 `git add`：
   ```
   git add js/app.js js/site-detail.js tests/site-reference-links.test.mjs README.md
   git commit
   ```
   訊息格式 `spectra(fix-map-rendering-and-link-safety): <摘要>`。
   不要用 `git add .` 或 `git add -A`。
3. 歸檔兩個 change：
   ```
   spectra archive repair-site-reference-links
   spectra archive fix-map-rendering-and-link-safety
   ```
4. push 到 GitHub 是對外動作，且 repo 是公開的，請先跟 Rebecca 確認再 `git push`。

---

## 7. 尚未處理 / 待決策

- **尼雅的佔位 IIIF 網址。** `placeholder-niya-tablet` 是明顯的佔位字串。本次 change 刻意不動它（列在 Non-Goals），只確保它失敗時能正確降級到 `niya_house.jpg`。後續要決定是改成真實 IIIF 網址、還是清空該欄位讓它直接走一般圖檔。這需要影像考據判斷，建議另開 change。
- **`README.md` 的啟動說明。** 第 44 到 47 行還寫著 `python -m http.server 8000` 與 `http://localhost:8000`，但實際入口已改成 `start_map.bat` 加 `serve_map.py` 加 port 8001。不在本次 change 範圍，但值得順手修，或另開一個小 change。
- **`repair-site-reference-links` 尚未歸檔、`c47f78a` 尚未 push。**

---

## 8. 相關檔案速查

| 檔案 | 角色 |
| --- | --- |
| `CODE_REVIEW_HANDOFF.md` | 上一輪 `repair-site-reference-links` 的 code review 交接手冊，仍有效 |
| `serve_map.py` | 本機預覽伺服器，送不要快取標頭 |
| `start_map.bat` | 啟動 `serve_map.py`，port 8001 |
| `data/sites.geojson` | 21 筆遺址資料，本次 change 不應改動 |
| `js/app.js` | Leaflet 地圖主邏輯、側欄、OpenSeadragon |
| `js/site-detail.js` | 側欄渲染模組（UMD，瀏覽器與 Node 共用），測試以 Node 匯入驗證 |
| `tests/site-reference-links.test.mjs` | 唯一測試檔 |
