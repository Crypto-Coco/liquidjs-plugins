"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTagToken = void 0;
const liquidjs_1 = require("liquidjs");
function getKind(val) {
    return val ? val.kind : -1;
}
function isTagToken(val) {
    return getKind(val) === liquidjs_1.TokenKind.Tag;
}
exports.isTagToken = isTagToken;
