## 1. 資料分層與向量圖資建立

- [x] 1.1 建立水系與商路獨立向量檔案，產出 `data/waterways.geojson`（孔雀河故道、塔里木河支流）與 `data/routes.geojson`（絲路南道與北道推測線），並包含起訖年代與說明欄位。驗證方式：使用 JSON 語法檢查器驗證 FeatureCollection 格式合規。

## 2. 卷簾比對模式實作

- [x] 2.1 實作 Swipe comparison mode 與「雙模式切換（透明度 vs 卷簾）」開關，引入 Leaflet-Side-by-Side 套件，支援在「透明度疊合」與「左右卷簾比對」之間切換。驗證方式：切換至卷簾模式時出現垂直拖曳分割線，左右兩側分別正確顯示歷史地圖與衛星空照。

## 3. IIIF 文物深縮放整合

- [x] 3.1 實作 IIIF deep zoom viewer in detail panel 與「側欄 IIIF 與靜態圖片混合檢視」功能，於 `index.html` 引入 OpenSeadragon 函式庫，並於 `js/app.js` 擴充側欄渲染邏輯，當物件含有 `iiif_url` 時動態建立深縮放檢視器，無 IIIF 時平滑降級為靜態預覽。驗證方式：點擊具備 IIIF 欄位之遺址時，側欄成功呈現可放大縮小之深縮放畫布。

## 4. 向量圖層開關與時間軸聯動

- [x] 4.1 實作 Independent vector layers for waterways and routes，在 Leaflet 圖層控制面板加入古水系與商路開關，並自訂水系（藍色虛線/實線）與商路（金黃色虛線）樣式。驗證方式：手動勾選與取消勾選開關，確認線條即時顯隱。
- [x] 4.2 擴充時間軸滑桿篩選機制，使古水系故道隨所選年代即時篩選（如孔雀河故道隨樓蘭廢棄而乾涸消失）。驗證方式：拉動年份滑桿至西元 600 年後，確認已乾涸之水系線條依年代邏輯隱藏或呈現乾涸樣式。
