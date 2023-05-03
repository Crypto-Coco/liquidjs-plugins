"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetUrlFilter = void 0;
function assetUrlFilter(value, prefix) {
    const assetUrl = `${prefix || "/assets/"}${value}`;
    return assetUrl;
}
exports.assetUrlFilter = assetUrlFilter;
