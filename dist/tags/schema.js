"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndSchemaTag = exports.SchemaTag = void 0;
const liquidjs_1 = require("liquidjs");
const typeGuard_js_1 = require("../utils/typeGuard.js");
class SchemaTag extends liquidjs_1.Tag {
    constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        this.schema = null;
        const endschemaToken = remainTokens.find((t) => (0, typeGuard_js_1.isTagToken)(t) && t.name === "endschema");
        if (!endschemaToken) {
            throw new Error("Missing end tag: endschema");
        }
        const content = token.input.slice(token.end, endschemaToken.begin);
        try {
            this.schema = JSON.parse(content);
        }
        catch (e) {
            throw new Error("Invalid JSON in schema tag");
        }
        while (remainTokens.length) {
            const token = remainTokens.shift();
            if ((0, typeGuard_js_1.isTagToken)(token) && token.name === "endschema")
                return;
        }
    }
    render() { }
}
exports.SchemaTag = SchemaTag;
class EndSchemaTag extends liquidjs_1.Tag {
    constructor(token, remainingTokens, liquid) {
        super(token, remainingTokens, liquid);
        this.schema = null;
    }
    render() { }
}
exports.EndSchemaTag = EndSchemaTag;
