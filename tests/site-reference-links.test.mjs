import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sites = JSON.parse(
  await readFile(new URL("../data/sites.geojson", import.meta.url), "utf8")
);
const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const styleSource = await readFile(new URL("../css/style.css", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

const retiredUrlPatterns = [
  /dsr\.nii\.ac\.jp\/cgi-bin\/toyobunko\/geta_search\.pl/i,
  /dsr\.nii\.ac\.jp\/geography\/stein-maps\/serindia\//i
];
const allowedStatuses = new Set(["verified", "fallback", "unavailable"]);
const steinSearchUrl = "https://dsr.nii.ac.jp/cgi-bin/digital-maps/list.pl";
const steinGazetteerIndex = "https://dsr.nii.ac.jp/digital-maps/stein/place-names/index.html.en";
const importedSiteDetail = await import("../js/site-detail.js").catch(() => ({}));
const siteDetail = importedSiteDetail.default || importedSiteDetail;

test("every site has one verified reference link", () => {
  assert.equal(sites.features.length, 21);

  for (const feature of sites.features) {
    const { name_zh: siteName, name_en: siteNameEn, stein_id: steinId, search_aliases: searchAliases = [], source_links: sourceLinks } = feature.properties;

    assert.ok(Array.isArray(sourceLinks), `${siteName} must have source links`);
    assert.equal(sourceLinks.length, 1, `${siteName} must have exactly one reference`);
    const [reference] = sourceLinks;
    assert.equal(typeof reference, "object", `${siteName} reference must be an object`);
    assert.equal(typeof reference.label, "string", `${siteName} reference needs a label`);
    assert.ok(reference.label.trim(), `${siteName} reference label cannot be empty`);
    assert.ok(allowedStatuses.has(reference.status), `${siteName} status is invalid`);
    assert.equal(reference.status, "verified", `${siteName} reference must be verified`);

    if (reference.label === "斯坦因地名記錄") {
      const candidates = new Set([siteNameEn, steinId, ...searchAliases]);
      assert.ok(candidates.has(reference.search_term), `${siteName} search term must be an English site candidate`);
      assert.equal(reference.url.startsWith(steinSearchUrl), true, `${siteName} must retain the Stein search endpoint`);
      const searchUrl = new URL(reference.url);
      assert.equal(searchUrl.searchParams.get("lang"), "en", `${siteName} must search in English`);
      assert.equal(searchUrl.searchParams.get("map"), "stein", `${siteName} URL must use its verified search term`);
      assert.equal(typeof reference.record_title, "string", `${siteName} needs a record title`);
      assert.ok(reference.record_title.trim(), `${siteName} record title cannot be empty`);
      assert.equal(typeof reference.record_url, "string", `${siteName} needs a record URL`);
      assert.match(reference.record_url, /^https:\/\/dsr\.nii\.ac\.jp\//, `${siteName} record URL must be an official DSR URL`);
      assert.equal(reference.fallback_url, steinGazetteerIndex, `${siteName} must use the Stein Gazetteer index as fallback`);
    } else {
      assert.equal(reference.label, "公開參考資料", `${siteName} non-Stein reference must use label 公開參考資料`);
      assert.equal(typeof reference.record_url, "string", `${siteName} needs a record URL`);
      assert.match(reference.record_url, /^https:\/\/en\.wikipedia\.org\//, `${siteName} record URL must be a valid Wikipedia URL`);
    }

    for (const url of [reference.url, reference.record_url, reference.fallback_url].filter(Boolean)) {
      assert.ok(
        !retiredUrlPatterns.some((pattern) => pattern.test(url)),
        `${siteName} contains a retired URL: ${url}`
      );
    }
  }
});

test("outputs/stein-gazetteer-site-links.csv 存在且與 geojson 記錄連結一致", async () => {
  let csvText;
  try {
    csvText = await readFile(new URL("../outputs/stein-gazetteer-site-links.csv", import.meta.url), "utf8");
  } catch {
    assert.fail("outputs/stein-gazetteer-site-links.csv 不存在，需從 stein-gazetteer-site-links.xlsx 重建");
  }

  const lines = csvText.trim().split(/\r?\n/);
  assert.deepEqual(
    lines[0].split(","),
    ["地名（中文）", "地名（英文）", "斯坦因地名", "資料庫記錄標題", "資料庫個別記錄連結", "側欄顯示連結"],
    "CSV 標題列應與改名後的 xlsx 欄位一致"
  );

  const dataRows = lines.slice(1);
  assert.equal(dataRows.length, 21, "CSV 應有 21 筆資料列");

  // 逐列比對而非只比集合，才能抓到清冊與資料集的錯位或地名拼寫漂移
  const csvByNameEn = new Map();
  for (const line of dataRows) {
    const cols = line.split(",");
    assert.equal(cols.length, 6, `CSV 每列應為 6 欄，發現異常列：${line}`);
    csvByNameEn.set(cols[1].trim(), cols[5].trim());
  }
  assert.equal(csvByNameEn.size, 21, "CSV 的英文地名不應重複");

  for (const feature of sites.features) {
    const { name_en: nameEn, source_links: sourceLinks } = feature.properties;
    assert.ok(csvByNameEn.has(nameEn), `CSV 缺少英文地名 ${nameEn} 的清冊列`);
    assert.equal(
      csvByNameEn.get(nameEn),
      sourceLinks[0].record_url,
      `${nameEn} 的 CSV 側欄顯示連結與 geojson 的 record_url 不一致`
    );
  }
});

test("每個點位的斯坦因編號符合連結清冊 stein-gazetteer-site-links.xlsx", () => {
  // 8 筆真正的斯坦因圖錄編號維持原樣；其餘 13 筆對照清冊「斯坦因檢索詞」欄修正，
  // 沒有 DSR 個別記錄的小河、陽關則留空，右側面板顯示為「-」。
  const expectedSteinId = {
    "loulan-la": "LA",
    "niya-nxiv": "N.xiv",
    "miran-fort": "M.I",
    "endere-fort": "E.i",
    "dunhuang-mogao": "T.xix",
    "khotan-yotkan": "Yotkan",
    "turpan-gaochang": "K.K.",
    "charkhlik-shanshan": "Charkhlik",
    "charchan-qiemo": "Charchan",
    "karadong-site": "Kara-dong",
    "rawak-stupa": "Rawak",
    "washxari-site": "Vāsh-shahri",
    "lk-fort-site": "L.K.",
    "yingpan-site": "Ying-p'an",
    "tuyin-site": "L. G ",
    "arghan-station": "Arghan",
    "xiaohe-site": "",
    "yangguan-pass": "",
    "yumenguan-pass": "T.xiv",
    "adag-spring": "Ak-tāgh-bulak",
    "chindailik": "Chindailik"
  };

  for (const feature of sites.features) {
    const { id, stein_id: steinId } = feature.properties;
    assert.ok(id in expectedSteinId, `未預期的點位 id：${id}`);
    assert.equal(
      steinId,
      expectedSteinId[id],
      `${id} 的斯坦因編號應為 ${JSON.stringify(expectedSteinId[id])}，實際為 ${JSON.stringify(steinId)}`
    );
  }
});

test("Gaochang uses the user-confirmed two-dimensional GPS location", () => {
  const gaochang = sites.features.find(({ properties }) => properties.id === "turpan-gaochang");

  assert.ok(gaochang, "Gaochang site record must exist");
  assert.deepEqual(gaochang.geometry.coordinates, [89.497286, 42.8004456]);
  assert.equal(gaochang.geometry.coordinates.length, 2);
  assert.equal(gaochang.properties.coordinate_source, "使用者確認 GPS：42.8004456, 89.497286");
});

test("Chindailik uses DSR coordinates and verified Stein link", () => {
  const chindailik = sites.features.find(({ properties }) => properties.id === "chindailik");

  assert.ok(chindailik, "Chindailik site record must exist");
  assert.deepEqual(chindailik.geometry.coordinates, [89.9379, 39.619938]);
  assert.equal(chindailik.properties.name_en, "Chindailik");
  assert.deepEqual(chindailik.properties.period, {
    start_year: 200,
    end_year: 340,
    description: "魏晉時期（西元 200 至 340 年）"
  });
  assert.equal(chindailik.properties.source_links[0].record_url, "https://dsr.nii.ac.jp/digital-maps/stein/place-names/00941.html.en");
});

test("Cartographic marker category keeps evidence level separate from marker color", () => {
  const chindailik = sites.features.find(({ properties }) => properties.id === "chindailik");
  const loulan = sites.features.find(({ properties }) => properties.id === "loulan-la");
  const arghan = sites.features.find(({ properties }) => properties.id === "arghan-station");

  assert.equal(chindailik.properties.marker_category, "cartographic");
  assert.equal(chindailik.properties.evidence_level, "text");
  assert.equal(chindailik.properties.evidence_level_label, "文獻與實地測繪");
  assert.equal(loulan.properties.marker_category, undefined);
  assert.equal(arghan.properties.marker_category, undefined);
  assert.match(appSource, /markerCategory\s*\|\|\s*evidenceLevel/, "標記類別必須優先於考據等級選色");
  assert.match(styleSource, /\.marker-cartographic\s*\{[\s\S]*?background:\s*#c4b5fd;/, "測繪定位聚落必須使用淺紫色");
  assert.match(readme, /淺紫色標記.*斯坦因地圖測繪定位聚落/, "README 必須定義淺紫色圖例");
});

test("site detail renders one labelled Stein Gazetteer record link", () => {
  assert.equal(typeof siteDetail.renderSourceLinks, "function");

  const html = siteDetail.renderSourceLinks([{
    label: "斯坦因地名記錄",
    url: "https://example.test/stein?name=Loulan%20Ancient%20City",
    record_url: "https://dsr.nii.ac.jp/digital-maps/stein/place-names/1234.html.en",
    fallback_url: steinGazetteerIndex,
    status: "verified"
  }]);

  assert.match(html, /斯坦因地名記錄/);
  assert.match(html, /digital-maps\/stein\/place-names\/1234\.html\.en/);
  assert.doesNotMatch(html, /example\.test\/stein/);
  assert.doesNotMatch(html, /考據資料|斯坦因圖資/);
});

test("site detail labels the sole Stein Gazetteer fallback", () => {
  const html = siteDetail.renderSourceLinks([{
    label: "斯坦因地名記錄",
    url: null,
    record_url: null,
    fallback_url: steinGazetteerIndex,
    status: "unavailable"
  }]);

  assert.match(html, /斯坦因地名索引首頁/);
  assert.match(html, /digital-maps\/stein\/place-names\/index\.html\.en/);
  assert.doesNotMatch(html, /考據資料|斯坦因圖資/);
});

test("site detail replaces a failed image with its caption and source", () => {
  assert.equal(typeof siteDetail.renderImageFallback, "function");

  const html = siteDetail.renderImageFallback({
    caption: "尼雅木構宅邸遺構",
    source: "International Dunhuang Project"
  });

  assert.match(html, /影像目前無法載入/);
  assert.match(html, /尼雅木構宅邸遺構/);
  assert.match(html, /International Dunhuang Project/);
});

test("site detail rejects a non-http reference scheme", () => {
  const html = siteDetail.renderSourceLinks([{
    label: "斯坦因地名記錄",
    url: "javascript:alert(1)",
    record_url: "javascript:alert(1)",
    fallback_url: "javascript:alert(1)",
    status: "verified"
  }]);

  assert.match(html, /目前無可用公開連結/);
  assert.doesNotMatch(html, /<a\s/);
  assert.doesNotMatch(html, /javascript:/);
});

test("site detail still renders http and https reference destinations", () => {
  for (const scheme of ["https://dsr.nii.ac.jp/example.html", "http://dsr.nii.ac.jp/example.html"]) {
    const html = siteDetail.renderSourceLinks([{
      label: "公開參考資料",
      url: scheme,
      record_url: scheme,
      fallback_url: steinGazetteerIndex,
      status: "verified"
    }]);

    assert.match(html, /<a /, `${scheme} 應輸出連結`);
    assert.match(html, /target="_blank"/, `${scheme} 應在新分頁開啟`);
    assert.match(html, /rel="noopener noreferrer"/, `${scheme} 應帶 rel 保護`);
  }
});

test("tile attribution and README use the current HTTPS Stein entry point", async () => {
  const retired = "http://dsr.nii.ac.jp/toyobunko/";
  for (const relPath of ["../js/app.js", "../README.md"]) {
    const text = await readFile(new URL(relPath, import.meta.url), "utf8");
    assert.ok(!text.includes(retired), `${relPath} 不應再含已淘汰的 ${retired}`);
    assert.ok(
      text.includes(steinGazetteerIndex),
      `${relPath} 應改指向 ${steinGazetteerIndex}`
    );
  }
});

test("README directs local preview through the no-cache server on port 8001", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /start_map\.bat/, "README 應指示使用專案的預覽啟動檔");
  assert.match(readme, /http:\/\/localhost:8001/, "README 應使用無快取預覽伺服器的 8001 埠");
  assert.doesNotMatch(readme, /python -m http\.server 8000/, "README 不應再建議會快取資料的舊伺服器指令");
  assert.doesNotMatch(readme, /http:\/\/localhost:8000/, "README 不應再指向舊的 8000 埠");
});
