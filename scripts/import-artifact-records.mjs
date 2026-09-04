import { access, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import XLSX from "xlsx";

const REQUIRED_COLUMNS = ["site_id", "title", "record_url", "image_path", "source", "rights", "status"];
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function printHelp() {
  console.log("用法：node scripts/import-artifact-records.mjs --workbook <檔案.xlsx> --geojson <data/sites.geojson>");
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--help" || args[index] === "-h") return { help: true };
    if (args[index] === "--workbook" || args[index] === "--geojson") {
      options[args[index].slice(2)] = args[index + 1];
      index += 1;
    }
  }
  return options;
}

function nonEmpty(value) {
  return String(value ?? "").trim();
}

function isAllowedRecordUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function validateImagePath(imagePath, projectRoot) {
  if (!imagePath || isAbsolute(imagePath) || imagePath.includes("\\") || imagePath.split("/").includes("..")) {
    return "image_path 必須是專案內、使用正斜線的相對路徑";
  }
  if (!IMAGE_EXTENSIONS.has(extname(imagePath).toLowerCase())) {
    return "image_path 副檔名必須是 .png、.jpg、.jpeg、.webp 或 .gif";
  }
  const resolvedPath = resolve(projectRoot, imagePath);
  if (relative(projectRoot, resolvedPath).startsWith(`..${sep}`)) {
    return "image_path 不得離開專案目錄";
  }
  try {
    await access(resolvedPath);
  } catch {
    return "image_path 指向的檔案不存在";
  }
  return null;
}

async function readRecords(workbookPath, projectRoot) {
  const workbook = XLSX.readFile(workbookPath, { raw: false });
  const sheet = workbook.Sheets.records;
  if (!sheet) return { errors: ["找不到 records 工作表"] };

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, blankrows: false })[0] || [];
  const errors = REQUIRED_COLUMNS.filter((column) => !headers.includes(column)).map((column) => `缺少必要欄位：${column}`);
  const records = [];
  const seen = new Set();

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index];
    const normalized = Object.fromEntries(REQUIRED_COLUMNS.map((column) => [column, nonEmpty(row[column])]));
    if (normalized.status !== "ready") continue;

    for (const column of REQUIRED_COLUMNS) {
      if (!normalized[column]) errors.push(`第 ${rowNumber} 列：${column} 不得空白`);
    }
    if (!isAllowedRecordUrl(normalized.record_url)) errors.push(`第 ${rowNumber} 列：record_url 必須是 HTTP 或 HTTPS 網址`);
    const imageError = await validateImagePath(normalized.image_path, projectRoot);
    if (imageError) errors.push(`第 ${rowNumber} 列：${imageError}`);
    const duplicateKey = `${normalized.site_id}\u0000${normalized.image_path}`;
    if (seen.has(duplicateKey)) errors.push(`第 ${rowNumber} 列：site_id 與 image_path 不得重複`);
    seen.add(duplicateKey);
    records.push({ ...normalized, rowNumber });
  }

  return { records, errors, inputRows: rows.length, skippedRows: rows.length - records.length };
}

async function importRecords({ workbookPath, geojsonPath }) {
  const absoluteGeojsonPath = resolve(geojsonPath);
  const projectRoot = resolve(dirname(absoluteGeojsonPath), "..");
  const parsed = await readRecords(workbookPath, projectRoot);
  const geojsonText = await readFile(absoluteGeojsonPath, "utf8");
  const geojson = JSON.parse(geojsonText);
  const sites = new Map((geojson.features || []).map((feature) => [feature.properties?.id, feature]));

  for (const record of parsed.records || []) {
    if (!sites.has(record.site_id)) parsed.errors.push(`第 ${record.rowNumber} 列：找不到 site_id「${record.site_id}」`);
  }
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.join("\n"));
  }

  const grouped = new Map();
  for (const record of parsed.records) {
    const entries = grouped.get(record.site_id) || [];
    entries.push({ title: record.title, image_url: record.image_path, record_url: record.record_url, source: record.source });
    grouped.set(record.site_id, entries);
  }
  for (const [siteId, artifactRecords] of grouped) sites.get(siteId).properties.artifact_records = artifactRecords;

  const temporaryPath = `${absoluteGeojsonPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(geojson, null, 2)}\n`, "utf8");
  await rename(temporaryPath, absoluteGeojsonPath);
  return { inputRows: parsed.inputRows, importedRows: parsed.records.length, skippedRows: parsed.skippedRows, updatedSites: grouped.size };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.workbook || !options.geojson) {
    printHelp();
    process.exitCode = 1;
    return;
  }
  try {
    const summary = await importRecords({ workbookPath: options.workbook, geojsonPath: options.geojson });
    console.log(`輸入列數：${summary.inputRows}`);
    console.log(`匯入列數：${summary.importedRows}`);
    console.log(`略過列數：${summary.skippedRows}`);
    console.log(`更新地標數：${summary.updatedSites}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

export { importRecords };

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
