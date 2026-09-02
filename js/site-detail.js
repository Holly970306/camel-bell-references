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

        if (!destination) {
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

  function renderImageFallback(image) {
    const caption = escapeHtml((image && image.caption) || "未提供影像說明");
    const source = escapeHtml((image && image.source) || "未提供來源資訊");
    return `
      <div class="image-unavailable" role="status">影像目前無法載入</div>
      <div class="image-caption">${caption}<br><small style="color:#94a3b8">${source}</small></div>`;
  }

  function replaceImageCard(card, image) {
    if (card) {
      card.innerHTML = renderImageFallback(image);
    }
  }

  function replaceFailedImage(imageElement) {
    if (!imageElement) return;

    replaceImageCard(imageElement.closest(".image-card"), {
      caption: imageElement.alt,
      source: imageElement.dataset.source
    });
  }

  return {
    renderSourceLinks,
    renderImageFallback,
    replaceImageCard,
    replaceFailedImage
  };
});
