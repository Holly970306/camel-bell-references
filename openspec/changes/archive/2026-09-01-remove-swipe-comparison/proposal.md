## Summary

移除未能提供有效地圖差異的左右卷簾比對需求，讓正式規格與目前採用的透明度疊合操作一致。

## Motivation

卷簾控制項雖可出現，但無法可靠呈現歷史圖磚與現代底圖的有效差異，增加介面複雜度而未提供考據價值。使用者已決定以穩定的歷史圖磚透明度控制作為唯一的古今對照方式。

## Proposed Solution

- 從 `silk-road-map` 規格移除 Swipe comparison mode 需求及其情境。
- 保留 IIIF 深縮放、古水系與商路獨立圖層、時間軸篩選，以及斯坦因圖磚透明度疊合功能。

## Non-Goals

- 不移除或變更斯坦因歷史圖磚、現代底圖和透明度滑桿。
- 不變更 IIIF 檢視器與向量圖層功能。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `silk-road-map`: 移除左右卷簾比對需求，正式以透明度疊合作為古今地圖比對方式。

## Impact

- Affected specs: `silk-road-map`
- Affected code:
  - Modified: `index.html`, `js/app.js`, `css/style.css`
  - New: (none)
  - Removed: (none)
