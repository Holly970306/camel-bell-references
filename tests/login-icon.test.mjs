import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const authOverlay = indexHtml.match(/<div id="auth-overlay"[\s\S]*?<\/div>\s*<!-- 頂部標題列 -->/)?.[0] || "";
const header = indexHtml.match(/<header>[\s\S]*?<\/header>/)?.[0] || "";
const styles = await readFile(new URL("../css/style.css", import.meta.url), "utf8");

test("Bactrian camel login icon replaces the authentication temple symbol", () => {
  assert.ok(authOverlay, "登入遮罩必須存在");
  assert.match(authOverlay, /<img\b(?=[^>]*class="auth-camel-icon")(?=[^>]*src="images\/camel\.png")(?=[^>]*alt="")(?=[^>]*aria-hidden="true")[^>]*>/, "登入圖標必須是無障礙標記完整的本機駱駝圖片");
  assert.doesNotMatch(authOverlay, /<svg\b/, "登入遮罩不應保留 SVG 駱駝圖標");
  assert.doesNotMatch(authOverlay, /🏛️/, "登入遮罩不應保留神殿字元");
});

test("Bactrian camel login icon leaves the authentication controls intact", () => {
  assert.match(authOverlay, /id="auth-password"/, "登入密碼輸入欄必須保留");
  assert.match(authOverlay, /id="auth-submit-btn"/, "登入按鈕必須保留");
});

test("Bactrian camel header icon replaces the header temple symbol", () => {
  assert.ok(header, "地圖頁首必須存在");
  assert.match(header, /<img\b(?=[^>]*class="header-camel-icon")(?=[^>]*src="images\/camel\.png")(?=[^>]*alt="")(?=[^>]*aria-hidden="true")[^>]*>/, "頁首必須使用同一張本機駱駝圖片");
  assert.doesNotMatch(header, /🏛️/, "頁首不應保留神殿字元");
});

test("Bactrian camel icons use distinct responsive size rules", () => {
  assert.match(styles, /\.auth-camel-icon\s*\{[\s\S]*?width:\s*5rem;/, "登入駱駝必須有 5rem 寬度規則");
  assert.match(styles, /\.header-camel-icon\s*\{[\s\S]*?width:\s*2rem;/, "頁首駱駝必須有較小的 2rem 寬度規則");
});
