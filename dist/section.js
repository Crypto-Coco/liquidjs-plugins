"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFilePath = exports.parseFilePath = exports.SectionTag = void 0;
const ethers_1 = require("ethers");
const liquidjs_1 = require("liquidjs");
class SectionTag extends liquidjs_1.Tag {
    constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        const args = token.args;
        const tokenizer = new liquidjs_1.Tokenizer(args, this.liquid.options.operators);
        this.file = parseFilePath(tokenizer, this.liquid);
        this.currentFile = token.file;
        const message = `${this.file}${token.begin}${token.end}`;
        let messageBytes = ethers_1.ethers.toUtf8Bytes(message);
        this.instanceId = (0, ethers_1.sha256)(messageBytes);
    }
    *render(ctx, emitter) {
        const { liquid } = this;
        const filepath = (yield renderFilePath(this["file"], ctx, liquid));
        (0, liquidjs_1.assert)(filepath, () => `illegal filename "${filepath}"`);
        const scope = ctx.getAll();
        const localScope = { section: scope["sections"][this.instanceId] };
        const globalScope = ctx.globals;
        const localCtx = new liquidjs_1.Context(Object.assign(Object.assign({}, localScope), globalScope), ctx.opts);
        const templates = (yield liquid._parsePartialFile(filepath, ctx.sync, this["currentFile"]));
        yield liquid.renderer.renderTemplates(templates, localCtx, emitter);
    }
}
exports.SectionTag = SectionTag;
/**
 * @return null for "none",
 * @return Template[] for quoted with tags and/or filters
 * @return Token for expression (not quoted)
 * @throws TypeError if cannot read next token
 */
function parseFilePath(tokenizer, liquid) {
    if (liquid.options.dynamicPartials) {
        const file = tokenizer.readValue();
        if (file === undefined)
            throw new TypeError(`illegal argument "${tokenizer.input}"`);
        if (file.getText() === "none")
            return;
        if (liquidjs_1.TypeGuards.isQuotedToken(file)) {
            // for filenames like "files/{{file}}", eval as liquid template
            const templates = liquid.parse((0, liquidjs_1.evalQuotedToken)(file));
            return optimize(templates);
        }
        return file;
    }
    const tokens = [...tokenizer.readFileNameTemplate(liquid.options)];
    const templates = optimize(liquid.parser.parseTokens(tokens));
    return templates === "none" ? undefined : templates;
}
exports.parseFilePath = parseFilePath;
function optimize(templates) {
    // for filenames like "files/file.liquid", extract the string directly
    if (templates.length === 1 && liquidjs_1.TypeGuards.isHTMLToken(templates[0].token))
        return templates[0].token.getContent();
    return templates;
}
function* renderFilePath(file, ctx, liquid) {
    if (typeof file === "string")
        return file;
    if (Array.isArray(file))
        return liquid.renderer.renderTemplates(file, ctx);
    return yield (0, liquidjs_1.evalToken)(file, ctx);
}
exports.renderFilePath = renderFilePath;
