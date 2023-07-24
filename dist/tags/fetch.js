"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchTag = void 0;
const liquidjs_1 = require("liquidjs");
const ethers_1 = require("ethers");
const constant_1 = require("../utils/constant");
const node_fetch_1 = __importDefault(require("node-fetch"));
class FetchTag extends liquidjs_1.Tag {
    constructor(tagToken, remainTokens, liquid) {
        var _a;
        super(tagToken, remainTokens, liquid);
        this.args = [];
        this.argValues = [];
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
                this.chainId = value.getText().replace(/"/g, "");
            }
            else if (key === "contract_address" &&
                liquidjs_1.TypeGuards.isQuotedToken(value)) {
                this.contractAddress = value.getText().replace(/"/g, "");
            }
            tokenizer.skipBlank();
            if (tokenizer.peek() === "|") {
                break;
            }
            if (tokenizer.peek() === ",") {
                tokenizer.advance();
            }
        }
        const filterArg = tokenizer.readFilter();
        if (filterArg && filterArg.name === "args") {
            filterArg.args.forEach((arg) => {
                if (liquidjs_1.TypeGuards.isQuotedToken(arg)) {
                    let argText = arg.getText();
                    argText = argText.slice(1, -1);
                    if (argText.startsWith('{{') && argText.endsWith('}}')) {
                        let argName = argText.slice(2, -2).trim();
                        this.argValues.push(new liquidjs_1.Value(argName, this.liquid));
                    }
                    else {
                        this.args.push(argText);
                    }
                }
                else if (liquidjs_1.TypeGuards.isNumberToken(arg)) {
                    let argText = arg.getText();
                    this.args.push(argText);
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
        const collectionRes = yield (0, node_fetch_1.default)(constant_1.ADMIN_API_URL +
            `/collections/byAddress?address=${this.contractAddress}&chainId=${chainId}`);
        console.log("collectionRes", collectionRes);
        const collection = yield collectionRes.json();
        const collectionTemplateRes = yield (0, node_fetch_1.default)(constant_1.ADMIN_API_URL + `/collectionTemplates/${collection.collectionTemplateId}`);
        const collectionTemplate = yield collectionTemplateRes.json();
        const chainRes = yield (0, node_fetch_1.default)(constant_1.ADMIN_API_URL + `/chains/${chainId}`);
        const chain = yield chainRes.json();
        const resolvedArgs = [];
        for (let argValue of this.argValues) {
            let value = (yield argValue.value(context)).toString();
            resolvedArgs.push(value);
        }
        for (let arg of this.args) {
            resolvedArgs.push(arg);
        }
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(chain.rpcUrl, chainId);
        const contract = new ethers_1.ethers.Contract(collection.contractAddress, collectionTemplate.abi, provider);
        const result = yield contract[this.functionName](...resolvedArgs);
        context.push({ [this.key]: result });
        yield this.liquid.renderer.renderTemplates(this.tpls, context, emitter);
    }
}
exports.FetchTag = FetchTag;
