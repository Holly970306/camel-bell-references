import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import XLSX from "xlsx";

const projectRoot = new URL("..", import.meta.url);
const importedSiteDetail = await import("../js/site-detail.js");
const siteDetail = importedSiteDetail.default || importedSiteDetail;

test("匯入工具提供範本活頁簿與命令說明", async () => {
  const templateUrl = new URL("data/artifact-records-template.xlsx", projectRoot);
  await assert.doesNotReject(access(templateUrl));
  const template = XLSX.readFile(templateUrl);
  assert.ok(template.Sheets.records);
  assert.deepEqual(XLSX.utils.sheet_to_json(template.Sheets.records, { header: 1 })[0], [
    "site_id", "title", "record_url", "image_path", "source", "rights", "status"
  ]);

  const result = spawnSync(process.execPath, [
    "scripts/import-artifact-records.mjs",
    "--help"
  ], {
    cwd: new URL(".", projectRoot),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /--workbook/);
  assert.match(result.stdout, /--geojson/);
});

async function createFixture(rows, sheetName = "records") {
  const root = await mkdtemp(join(tmpdir(), "artifact-import-"));
  const dataDirectory = join(root, "data");
  const imageDirectory = join(root, "images", "artifacts");
  await mkdir(dataDirectory, { recursive: true });
  await mkdir(imageDirectory, { recursive: true });
  await writeFile(join(imageDirectory, "beads.png"), "image");
  await writeFile(join(imageDirectory, "second.jpg"), "image");

  const geojsonPath = join(dataDirectory, "sites.geojson");
  const originalGeojson = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: { type: "Point", coordinates: [89.919, 40.523] },
      properties: {
        id: "loulan-la",
        description: "既有說明",
        period: { start_year: -176, end_year: 630 },
        source_links: [{ label: "既有來源" }]
      }
    }]
  };
  await writeFile(geojsonPath, `${JSON.stringify(originalGeojson)}\n`);

  const workbookPath = join(root, "records.xlsx");
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["site_id", "title", "record_url", "image_path", "source", "rights", "status"],
    ...rows
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, workbookPath);
  return { geojsonPath, workbookPath };
}

function runImport(workbookPath, geojsonPath) {
  return spawnSync(process.execPath, [
    "scripts/import-artifact-records.mjs",
    "--workbook", workbookPath,
    "--geojson", geojsonPath
  ], { cwd: new URL(".", projectRoot), encoding: "utf8" });
}

test("匯入 ready 文物並保留地標的非文物欄位與列順序", async () => {
  const { workbookPath, geojsonPath } = await createFixture([
    ["loulan-la", "第一件文物", "https://example.org/first", "images/artifacts/beads.png", "IDP", "public_domain", "ready"],
    ["loulan-la", "待確認資料", "https://example.org/draft", "images/artifacts/beads.png", "IDP", "public_domain", "draft"],
    ["loulan-la", "第二件文物", "https://example.org/second", "images/artifacts/second.jpg", "IDP", "public_domain", "ready"]
  ]);

  const result = runImport(workbookPath, geojsonPath);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /輸入列數：3/);
  assert.match(result.stdout, /匯入列數：2/);
  assert.match(result.stdout, /略過列數：1/);
  assert.match(result.stdout, /更新地標數：1/);

  const imported = JSON.parse(await readFile(geojsonPath, "utf8")).features[0];
  assert.deepEqual(imported.properties.artifact_records, [
    { title: "第一件文物", image_url: "images/artifacts/beads.png", record_url: "https://example.org/first", source: "IDP" },
    { title: "第二件文物", image_url: "images/artifacts/second.jpg", record_url: "https://example.org/second", source: "IDP" }
  ]);
  assert.equal(imported.properties.description, "既有說明");
  assert.deepEqual(imported.properties.period, { start_year: -176, end_year: 630 });
  assert.deepEqual(imported.properties.source_links, [{ label: "既有來源" }]);
  const cardHtml = siteDetail.renderArtifactRecords(imported.properties.artifact_records);
  assert.match(cardHtml, /images\/artifacts\/beads\.png/);
  assert.match(cardHtml, /https:\/\/example\.org\/first/);
  assert.match(cardHtml, /rel="noopener noreferrer"/);
});

test("匯入遇到未知地標時不會部分寫入 GeoJSON", async () => {
  const { workbookPath, geojsonPath } = await createFixture([
    ["loulan-la", "有效資料", "https://example.org/valid", "images/artifacts/beads.png", "IDP", "public_domain", "ready"],
    ["new-site", "無效地標", "https://example.org/unknown", "images/artifacts/second.jpg", "IDP", "public_domain", "ready"]
  ]);
  const before = await readFile(geojsonPath, "utf8");

  const result = runImport(workbookPath, geojsonPath);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /第 3 列：找不到 site_id「new-site」/);
  assert.equal(await readFile(geojsonPath, "utf8"), before);
});

test("匯入拒絕不安全圖片、非 HTTP 連結與重複紀錄，且不寫入資料", async () => {
  const { workbookPath, geojsonPath } = await createFixture([
    ["loulan-la", "不安全圖片", "ftp://example.org/item", "../private/image.png", "IDP", "public_domain", "ready"],
    ["loulan-la", "重複紀錄", "https://example.org/item", "images/artifacts/beads.png", "IDP", "public_domain", "ready"],
    ["loulan-la", "另一個重複紀錄", "https://example.org/item", "images/artifacts/second.jpg", "IDP", "public_domain", "ready"]
  ]);
  const before = await readFile(geojsonPath, "utf8");

  const result = runImport(workbookPath, geojsonPath);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /record_url 必須是 HTTP 或 HTTPS 網址/);
  assert.match(result.stderr, /image_path 必須是專案內、使用正斜線的相對路徑/);
  assert.match(result.stderr, /site_id 與 record_url 不得重複/);
  assert.equal(await readFile(geojsonPath, "utf8"), before);
});

test("匯入拒絕缺少 records 工作表的活頁簿", async () => {
  const { workbookPath, geojsonPath } = await createFixture([
    ["loulan-la", "有效資料", "https://example.org/item", "images/artifacts/beads.png", "IDP", "public_domain", "ready"]
  ], "drafts");
  const before = await readFile(geojsonPath, "utf8");

  const result = runImport(workbookPath, geojsonPath);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /找不到 records 工作表/);
  assert.equal(await readFile(geojsonPath, "utf8"), before);
});
