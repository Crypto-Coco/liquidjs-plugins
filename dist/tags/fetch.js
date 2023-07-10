"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchTag = void 0;
const liquidjs_1 = require("liquidjs");
const ethers_1 = require("ethers");
const constant_1 = require("../utils/constant");
class FetchTag extends liquidjs_1.Tag {
    constructor(tagToken, remainTokens, liquid) {
        var _a;
        super(tagToken, remainTokens, liquid);
        this.args = [];
        const tokenizer = new liquidjs_1.Tokenizer(tagToken.args);
        this.key = tokenizer.readIdentifier().content;
        tokenizer.skipBlank();
        tokenizer.advance();
        const functionName = (_a = tokenizer.readValue()) === null || _a === void 0 ? void 0 : _a.getText();
        if (!functionName) {
            throw new liquidjs_1.TokenizationError(`illegal argument "${functionName}"`, tagToken);
        }
        this.functionName = functionName;
        tokenizer.advance();
        tokenizer.skipBlank();
        while (!tokenizer.end()) {
            const key = tokenizer.readIdentifier().content;
            tokenizer.skipBlank();
            tokenizer.advance();
            const value = tokenizer.readValue();
            if (key === "chain_id" && value) {
                console.log("chain_id", `aaa${value.getText()}aaa`);
                this.chainId = value.getText().replace(/"/g, "");
            }
            else if (key === "contract_address" &&
                liquidjs_1.TypeGuards.isQuotedToken(value)) {
                this.contractAddress = value.getText().replace(/"/g, "");
            }
            tokenizer.skipBlank();
            if (tokenizer.peek() === "|") {
                console.log("break!!!");
                break;
            }
            if (tokenizer.peek() === ",") {
                tokenizer.advance();
            }
        }
        const filterArg = tokenizer.readFilter();
        if (filterArg && filterArg.name === "args") {
            filterArg.args.forEach((arg) => {
                if (liquidjs_1.TypeGuards.isNumberToken(arg) || liquidjs_1.TypeGuards.isQuotedToken(arg)) {
                    this.args.push(arg.getText());
                }
            });
        }
        this.tpls = [];
        let closed = false;
        while (remainTokens.length) {
            let token = remainTokens.shift();
            if (token && token.name === "endfetch") {
                closed = true;
                break;
            }
            if (token) {
                let tpl = this.liquid.parser.parseToken(token, remainTokens);
                this.tpls.push(tpl);
            }
        }
        if (!closed)
            throw new Error(`tag ${tagToken.getText()} not closed`);
    }
    *render(context, emitter) {
        if (this.contractAddress && this.contractAddress.startsWith("{{")) {
            const valueToken = new liquidjs_1.Value(this.contractAddress.slice(2, -2).trim(), this.liquid);
            this.contractAddress = (yield valueToken.value(context)).toString();
        }
        if (this.chainId && this.chainId.toString().startsWith("{{")) {
            const valueToken = new liquidjs_1.Value(this.chainId.toString().slice(2, -2).trim(), this.liquid);
            this.chainId = yield valueToken.value(context);
        }
        const chainId = Number(this.chainId);
        const collectionRes = yield fetch(constant_1.ADMIN_API_URL +
            `/collections/byAddress?address=${this.contractAddress}&chainId=${chainId}`);
        const collection = yield collectionRes.json();
        const collectionTemplateRes = yield fetch(constant_1.ADMIN_API_URL + `/collectionTemplates/${collection.collectionTemplateId}`);
        const collectionTemplate = yield collectionTemplateRes.json();
        const chainRes = yield fetch(constant_1.ADMIN_API_URL + `/chains/${chainId}`);
        const chain = yield chainRes.json();
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(chain.rpcUrl, chainId);
        const contract = new ethers_1.ethers.Contract(collection.contractAddress, collectionTemplate.abi, provider);
        const result = yield contract[this.functionName](...this.args);
        context.push({ [this.key]: result });
        yield this.liquid.renderer.renderTemplates(this.tpls, context, emitter);
    }
}
exports.FetchTag = FetchTag;