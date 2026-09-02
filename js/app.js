// Silk Road Historical Map Application

document.addEventListener("DOMContentLoaded", () => {
  // 0. 訪問驗證
  const authOverlay = document.getElementById("auth-overlay");
  const authForm = document.getElementById("auth-form");
  const authPassword = document.getElementById("auth-password");
  const authErrorMsg = document.getElementById("auth-error-msg");
  const authCard = authOverlay ? authOverlay.querySelector(".auth-card") : null;

  const authHash = "4812585e944994cb91cae8b4d8d87a155e6b1a165d8bdf5ab75752c4f04b9724";
  const authStorageKey = "silk_road_map_auth";

  async function computeHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  if (sessionStorage.getItem(authStorageKey) === "granted") {
    if (authOverlay) authOverlay.classList.add("hidden");
  } else {
    if (authOverlay) authOverlay.classList.remove("hidden");
    if (authPassword) authPassword.focus();
  }

  async function handleAuthSubmit() {
    if (!authPassword) return;
    const inputVal = authPassword.value.trim();
    const inputHash = await computeHash(inputVal);

    if (inputHash === authHash) {
      sessionStorage.setItem(authStorageKey, "granted");
      if (authErrorMsg) authErrorMsg.textContent = "";
      if (authOverlay) authOverlay.classList.add("hidden");
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    } else {
      if (authErrorMsg) authErrorMsg.textContent = "密碼錯誤，請重新輸入";
      if (authCard) {
        authCard.classList.remove("auth-shake");
        void authCard.offsetWidth; // trigger reflow
        authCard.classList.add("auth-shake");
      }
      authPassword.value = "";
      authPassword.focus();
    }
  }

  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleAuthSubmit();
    });
  }

  // 1. 初始化 Leaflet 地圖（聚焦於塔里木盆地與羅布泊區域）
  const map = L.map("map", {
    center: [39.5, 86.0],
    zoom: 6,
    minZoom: 4,
    maxZoom: 14,
    zoomControl: false // 停用預設左上角縮放控制，避免遭左側控制面板遮擋
  });

  // 將縮放控制項（+/-）放置於右下角（符合地圖常規且避開左側浮動面板）
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // 建立歷史圖磚專屬 Pane，確保獨立裁剪與透明度控制
  map.createPane("historicalPane");
  map.getPane("historicalPane").style.zIndex = 250;

  // 2. 底圖與歷史圖磚
  const satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, USGS, GIS User Community",
      maxZoom: 18
    }
  ).addTo(map);

  const osmLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors",
      maxZoom: 18
    }
  );

  // 修正 DSR 斯坦因圖磚 CGI 格式 URL
  const serindiaTileUrl = "https://dsr.nii.ac.jp/cgi-bin/map/tile.pl?t=s&z={z}&x={x}&y={y}";
  const serindiaLayer = L.tileLayer(serindiaTileUrl, {
    attribution: "&copy; <a href='https://dsr.nii.ac.jp/digital-maps/stein/place-names/index.html.en' target='_blank' rel='noopener noreferrer'>Digital Silk Road (DSR)</a> / NII",
    minZoom: 5,
    maxZoom: 12,
    opacity: 0.7,
    pane: "historicalPane",
    bounds: [
      [34.0, 73.0],
      [45.0, 104.0]
    ]
  }).addTo(map);

  // 3. 向量圖層群組（遺址點位、古水系、商路、田調半徑輔助圈）
  const markersLayer = L.layerGroup().addTo(map);
  const waterwaysLayer = L.layerGroup().addTo(map);
  const routesLayer = L.layerGroup().addTo(map);
  const radiusLayer = L.layerGroup().addTo(map);

  // 繪製若羌（Charkhlik）中心 300 公里田調研究範疇輔助圈（設為非互動圖層，避免游標滑過大面積時頻繁觸發浮動對話框）
  const charkhlikCoords = [39.0212, 88.1663];
  const surveyCircle = L.circle(charkhlikCoords, {
    radius: 300000, // 300 公里
    color: "#64748b",
    weight: 1.5,
    dashArray: "6, 8",
    fillColor: "#334155",
    fillOpacity: 0.04,
    interactive: false
  });
  radiusLayer.addLayer(surveyCircle);

  // 圖層控制器
  const baseMaps = {
    "現代衛星空照 (Satellite)": satelliteLayer,
    "現代地圖 (OpenStreetMap)": osmLayer
  };
  const overlayMaps = {
    "斯坦因《Serindia》歷史測繪圖 (1921)": serindiaLayer,
    "遺址與考古點位": markersLayer,
    "若羌 300km 田調範疇圈": radiusLayer,
    "古水系故道（孔雀河/塔里木河）": waterwaysLayer,
    "絲綢之路商路推測線": routesLayer
  };
  L.control.layers(baseMaps, overlayMaps, { position: "topright" }).addTo(map);

  // 4. 歷史圖磚透明度滑桿控制
  const opacitySlider = document.getElementById("serindia-opacity");
  const opacityValue = document.getElementById("opacity-value");

  if (opacitySlider && opacityValue) {
    opacitySlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      serindiaLayer.setOpacity(val);
      opacityValue.textContent = `${Math.round(val * 100)}%`;
    });
  }

  // 5. 資料狀態管理
  let sitesData = null;
  let waterwaysData = null;
  let routesData = null;
  let activeOsViewers = [];

  function createCustomIcon(evidenceLevel, label, markerCategory) {
    const markerClass = markerCategory || evidenceLevel;
    return L.divIcon({
      className: `custom-marker marker-${markerClass}`,
      html: `<span>${label}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  }

  // 側欄開啟與 OpenSeadragon IIIF 渲染
  const sidePanel = document.getElementById("side-panel");
  const sidePanelBody = document.getElementById("side-panel-body");
  const sidePanelTitle = document.getElementById("side-panel-title");
  const closePanelBtn = document.getElementById("close-panel-btn");
  // 側欄渲染模組缺席時的最小備援：只求可讀、不求樣式一致
  function buildFallbackSiteDetail() {
    const linkUnavailable = '<div class="source-link-item source-link-unavailable">目前無可用公開連結</div>';
    const imageUnavailable = '<div class="image-unavailable" role="status">影像目前無法載入</div>';
    return {
      renderSourceLinks: () => linkUnavailable,
      renderImageFallback: () => imageUnavailable,
      replaceImageCard: (card) => {
        if (card) card.innerHTML = imageUnavailable;
      },
      replaceFailedImage: () => {}
    };
  }

  let warnedMissingSiteDetail = false;

  // 每次使用前取值，避免載入順序或部署問題造成的一次性硬相依
  function getSiteDetail() {
    if (window.SiteDetail) return window.SiteDetail;
    if (!warnedMissingSiteDetail) {
      console.warn("js/site-detail.js 未載入，側欄改用最小備援輸出。");
      warnedMissingSiteDetail = true;
    }
    return buildFallbackSiteDetail();
  }

  // 行內 onerror 的薄包裝：在全域範圍執行，無法存取 getSiteDetail 以外的閉包
  window.handleMapImageError = function (imageElement) {
    const detail = getSiteDetail();
    if (detail && typeof detail.replaceFailedImage === "function") {
      detail.replaceFailedImage(imageElement);
    }
  };

  function destroyActiveOsViewers() {
    activeOsViewers.forEach((viewer) => {
      try {
        viewer.destroy();
      } catch (err) {
        console.warn("OpenSeadragon 檢視器銷毀失敗:", err);
      }
    });
    activeOsViewers = [];
  }

  function discardOsViewer(viewer) {
    const index = activeOsViewers.indexOf(viewer);
    if (index !== -1) activeOsViewers.splice(index, 1);
    try {
      viewer.destroy();
    } catch (err) {
      console.warn("OpenSeadragon 檢視器銷毀失敗:", err);
    }
  }

  // 一般圖檔卡片內容，供初次渲染與 IIIF 失敗降級共用
  function plainImageCardInner(img) {
    return `
      <img src="${img.url}" alt="${img.caption || ''}" data-source="${img.source || ''}" onerror="window.handleMapImageError(this)" />
      <div class="image-caption">${img.caption || ''} <br><small style="color:#94a3b8">${img.source || ''}</small></div>
    `;
  }

  // IIIF 失敗時的降級：有一般圖檔就改用一般圖檔，否則落到文字佔位
  function degradeIiifCard(card, img) {
    if (!card) return;
    if (img && img.url) {
      card.innerHTML = plainImageCardInner(img);
    } else {
      getSiteDetail().replaceImageCard(card, img);
    }
  }

  function openSidePanel(properties) {
    sidePanelTitle.textContent = properties.name_zh || "遺址考據細節";

    destroyActiveOsViewers();

    let imagesHtml = "";
    if (properties.images && properties.images.length > 0) {
      imagesHtml = `
        <div class="detail-section">
          <label>田調歷史圖像 / 出土文物</label>
          <div class="image-gallery">
            ${properties.images
              .map((img, idx) => {
                if (img.iiif_url && window.OpenSeadragon) {
                  return `
                    <div class="image-card">
                      <div class="iiif-viewer-wrapper">
                        <div id="iiif-viewer-${idx}" class="iiif-viewer-container"></div>
                      </div>
                      <div class="image-caption">
                        <span class="tag-badge iiif-badge">IIIF 高清深縮放</span>
                        ${img.caption || ''} <br><small style="color:#94a3b8">${img.source || ''}</small>
                      </div>
                    </div>
                  `;
                } else if (img.url) {
                  return `<div class="image-card">${plainImageCardInner(img)}</div>`;
                }
                return `<div class="image-card">${getSiteDetail().renderImageFallback(img)}</div>`;
              })
              .join("")}
          </div>
        </div>
      `;
    }

    let sourceLinksHtml = "";
    if (properties.source_links && properties.source_links.length > 0) {
      sourceLinksHtml = `
        <div class="detail-section">
          <label>考據文獻與資料庫出處</label>
          ${getSiteDetail().renderSourceLinks(properties.source_links)}
        </div>
      `;
    }

    const startYearStr = properties.period.start_year < 0 ? `前 ${Math.abs(properties.period.start_year)} 年` : `西元 ${properties.period.start_year} 年`;
    const endYearStr = properties.period.end_year < 0 ? `前 ${Math.abs(properties.period.end_year)} 年` : `西元 ${properties.period.end_year} 年`;

    sidePanelBody.innerHTML = `
      <div class="detail-section">
        <label>地名考證</label>
        <div class="value"><strong>中文名：</strong> ${properties.name_zh || "-"}</div>
        <div class="value"><strong>佉盧文轉寫：</strong> ${properties.name_kharosthi || "-"}</div>
        <div class="value"><strong>斯坦因編號：</strong> ${properties.stein_id || "-"}</div>
      </div>

      <div class="detail-section">
        <label>年代區間</label>
        <div class="value">${startYearStr} 至 ${endYearStr} (${properties.period.description || "-"})</div>
      </div>

      <div class="detail-section">
        <label>考據等級與授權</label>
        <div>
          <span class="tag-badge badge-${properties.evidence_level}">${properties.evidence_level_label || properties.evidence_level}</span>
          <span class="tag-badge badge-rights">${properties.rights_label || properties.rights}</span>
        </div>
      </div>

      <div class="detail-section">
        <label>考據重點與劇情備註</label>
        <div class="value">${properties.description || "暫無考據備註"}</div>
      </div>

      ${imagesHtml}
      ${sourceLinksHtml}
    `;

    sidePanel.classList.add("open");

    // 初始化 OpenSeadragon 實例
    if (properties.images && window.OpenSeadragon) {
      properties.images.forEach((img, idx) => {
        if (img.iiif_url) {
          const container = document.getElementById(`iiif-viewer-${idx}`);
          if (container) {
            try {
              const viewer = OpenSeadragon({
                id: `iiif-viewer-${idx}`,
                prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@4.1.1/build/openseadragon/images/",
                tileSources: img.iiif_url,
                showNavigationControl: true,
                navigationControlAnchor: OpenSeadragon.ControlAnchor.TOP_RIGHT,
                showNavigator: false
              });
              viewer.addHandler("open-failed", () => {
                degradeIiifCard(container.closest(".image-card"), img);
                discardOsViewer(viewer);
              });
              activeOsViewers.push(viewer);
            } catch (err) {
              console.warn("無法載入 IIIF 影像:", err);
              degradeIiifCard(container.closest(".image-card"), img);
            }
          }
        }
      });
    }
  }

  function closeSidePanel() {
    sidePanel.classList.remove("open");
    destroyActiveOsViewers();
  }

  if (closePanelBtn) {
    closePanelBtn.addEventListener("click", closeSidePanel);
  }

  // 6. 向量資料渲染與時間軸篩選
  function renderAllVectors(selectedYear) {
    // 6.1 渲染遺址點位
    markersLayer.clearLayers();
    if (sitesData && sitesData.features) {
      sitesData.features.forEach((feature) => {
        const p = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;

        if (selectedYear !== null && selectedYear !== undefined && p.period) {
          if (selectedYear < p.period.start_year || selectedYear > p.period.end_year) {
            return;
          }
        }

        const label = p.stein_id || p.name_zh.substring(0, 2);
        const markerIcon = createCustomIcon(
          p.evidence_level || "artifact",
          label,
          p.marker_category
        );
        const marker = L.marker([lat, lng], { icon: markerIcon });
        marker.bindTooltip(`<strong>${p.name_zh}</strong><br>${p.period ? p.period.description : ''}`, {
          direction: "top",
          offset: [0, -10]
        });

        marker.on("click", () => openSidePanel(p));
        markersLayer.addLayer(marker);
      });
    }

    // 6.2 渲染古水系故道與羅布泊古湖面（隨年代過濾與樣式演變）
    waterwaysLayer.clearLayers();
    if (waterwaysData && waterwaysData.features) {
      waterwaysData.features.forEach((feature) => {
        const p = feature.properties;
        const geomType = feature.geometry.type;
        let isDry = false;

        if (selectedYear !== null && selectedYear !== undefined && p.period) {
          // 若水體/湖泊尚未形成則隱藏
          if (selectedYear < p.period.start_year) return;
          // 若選定年份已超過水系活躍年代（乾涸斷流/湖面退縮）
          if (selectedYear > p.period.end_year) {
            isDry = true;
          }
        }

        let geoLayer;

        if (geomType === "Polygon" || geomType === "MultiPolygon") {
          // 羅布泊等面狀水體
          geoLayer = L.geoJSON(feature, {
            style: {
              color: isDry ? "#94a3b8" : "#0284c7",
              weight: isDry ? 1.5 : 2.5,
              dashArray: isDry ? "6, 6" : undefined,
              fillColor: isDry ? "#475569" : "#0ea5e9",
              fillOpacity: isDry ? 0.15 : 0.45
            }
          });

          geoLayer.bindTooltip(
            `<strong>${p.name_zh}</strong><br>${
              isDry
                ? '<span style="color:#f87171">[乾涸鹽澤・湖水退縮]</span> '
                : '<span style="color:#38bdf8">[碧波浩瀚・廣袤三百里]</span> '
            }${p.period ? p.period.description : ''}<br><small style="color:#cbd5e1">${p.description || ''}</small>`,
            { sticky: true }
          );
        } else {
          // 線狀古河道
          geoLayer = L.geoJSON(feature, {
            style: {
              color: isDry ? "#64748b" : "#38bdf8",
              weight: isDry ? 2 : 3.5,
              dashArray: isDry ? "4, 6" : undefined,
              opacity: isDry ? 0.4 : 0.85
            }
          });

          geoLayer.bindTooltip(
            `<strong>${p.name_zh}</strong><br>${
              isDry
                ? '<span style="color:#f87171">[已乾涸斷流]</span> '
                : '<span style="color:#38bdf8">[通水充沛]</span> '
            }${p.period ? p.period.description : ''}`,
            { sticky: true }
          );
        }

        waterwaysLayer.addLayer(geoLayer);
      });
    }

    // 6.3 渲染商路推測線（南道與北道獨立呈現，不形成封閉環狀）
    routesLayer.clearLayers();
    if (routesData && routesData.features) {
      routesData.features.forEach((feature) => {
        const p = feature.properties;
        const routeColor = p.color || (p.route_type === "southern" ? "#ff3366" : "#a855f7");
        const polyline = L.geoJSON(feature, {
          style: {
            color: routeColor,
            weight: 3.5,
            dashArray: "6, 6",
            opacity: 0.95
          }
        });
        polyline.bindTooltip(`<strong>${p.name_zh}</strong><br>${p.description || ''}`, { sticky: true });
        routesLayer.addLayer(polyline);
      });
    }
  }

  // 7. 載入三份 GeoJSON 資料集
  Promise.all([
    fetch("data/sites.geojson", { cache: "no-store" }).then((res) => res.json()),
    fetch("data/waterways.geojson", { cache: "no-store" }).then((res) => res.json()),
    fetch("data/routes.geojson", { cache: "no-store" }).then((res) => res.json())
  ])
    .then(([sites, waterways, routes]) => {
      sitesData = sites;
      waterwaysData = waterways;
      routesData = routes;

      const initialYear = parseInt(document.getElementById("timeline-range").value, 10);
      renderAllVectors(initialYear);
    })
    .catch((err) => {
      console.error("載入地理資料失敗:", err);
    });

  // 8. 時間軸滑桿事件
  const timelineSlider = document.getElementById("timeline-range");
  const yearDisplay = document.getElementById("current-year-display");

  function formatYearText(year) {
    if (year < 0) {
      return `西元前 ${Math.abs(year)} 年 (漢武帝經略西域前後)`;
    } else if (year <= 220) {
      return `西元 ${year} 年 (兩漢時期)`;
    } else if (year <= 589) {
      return `西元 ${year} 年 (魏晉南北朝時期)`;
    } else {
      return `西元 ${year} 年 (隋唐時期)`;
    }
  }

  if (timelineSlider && yearDisplay) {
    timelineSlider.addEventListener("input", (e) => {
      const year = parseInt(e.target.value, 10);
      yearDisplay.textContent = formatYearText(year);
      renderAllVectors(year);
    });
  }
});

