(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SiteDetail = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  const ALLOWED_LINK_PROTOCOLS = new Set(["https:", "http:"]);

  function isAllowedHttpUrl(value) {
    try {
      return ALLOWED_LINK_PROTOCOLS.has(new URL(String(value)).protocol);
    } catch (err) {
      return false;
    }
  }

  function renderSourceLinks(sourceLinks) {
    if (!Array.isArray(sourceLinks) || sourceLinks.length === 0) {
      return '<div class="source-link-item source-link-unavailable">目前無可用公開連結</div>';
    }

    return sourceLinks
      .map((reference) => {
        const status = reference && reference.status;
        const primaryUrl = reference && (reference.record_url || reference.url);
        const fallbackUrl = reference && reference.fallback_url;
        const label = escapeHtml((reference && reference.label) || "公開資料來源");
        const usableStatus = status === "verified" || status === "fallback";
        const destination = usableStatus && primaryUrl ? primaryUrl : fallbackUrl;

        if (!destination || !isAllowedHttpUrl(destination)) {
          return '<div class="source-link-item source-link-unavailable">目前無可用公開連結</div>';
        }

        let displayLabel = usableStatus && primaryUrl ? label : `${label}（替代入口）`;
        if (destination === "https://dsr.nii.ac.jp/digital-maps/stein/place-names/index.html.en") {
          displayLabel = "斯坦因地名索引首頁";
        }
        const escapedUrl = escapeHtml(destination);
        return `
          <div class="source-link-item">
            <a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${displayLabel}</a>
          </div>`;
      })
      .join("");
  }

  function renderArtifactRecords(artifactRecords) {
    if (!Array.isArray(artifactRecords) || artifactRecords.length === 0) {
      return "";
    }

    return `
      <div class="detail-section artifact-records-section">
        <label>相關文物記錄</label>
        <div class="artifact-record-gallery">
          ${artifactRecords
            .map((record) => {
              const title = escapeHtml((record && record.title) || "未提供文物題名");
              const source = escapeHtml((record && record.source) || "未提供來源資訊");
              const imageUrl = escapeHtml((record && record.image_url) || "");
              const recordUrl = record && record.record_url;

              if (!recordUrl || !isAllowedHttpUrl(recordUrl)) {
                return `<div class="artifact-record-card">${renderSourceLinks([])}</div>`;
              }

              const escapedRecordUrl = escapeHtml(recordUrl);
              const imageHtml = imageUrl
                ? `<a class="artifact-record-image-link" href="${escapedRecordUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="${title}" onerror="this.closest('.artifact-record-image-link').remove()" /></a>`
                : "";
              return `
                <article class="artifact-record-card">
                  ${imageHtml}
                  <div class="artifact-record-caption">
                    <a href="${escapedRecordUrl}" target="_blank" rel="noopener noreferrer">${title}</a>
                    <small>${source}</small>
                  </div>
                </article>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  return {
    renderSourceLinks,
    renderArtifactRecords
  };
});
