import {
  Liquid,
  Tag,
  TagToken,
  TopLevelToken,
  Tokenizer,
  TypeGuards,
  TokenizationError,
  Context,
  Emitter,
  Value,
  Output,
} from "liquidjs";
import { HTML } from "liquidjs/dist/src/template";
import { ethers } from "ethers";
import { ADMIN_API_URL } from "../utils/constant";
import fetch from "node-fetch";

export class FetchTag extends Tag {
  private key: string;
  private tpls: (Tag | Output | HTML)[];
  private functionName: string;
  private chainId?: string;
  private contractAddress?: string;
  private args: string[] = [];

  constructor(
    tagToken: TagToken,
    remainTokens: TopLevelToken[],
    liquid: Liquid
  ) {
    super(tagToken, remainTokens, liquid);
    const tokenizer = new Tokenizer(tagToken.args);
    this.key = tokenizer.readIdentifier().content;

    tokenizer.skipBlank();
    tokenizer.advance();

    const functionName = tokenizer.readValue()?.getText();
    if (!functionName) {
      throw new TokenizationError(
        `illegal argument "${functionName}"`,
        tagToken
      );
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
      } else if (
        key === "contract_address" &&
        TypeGuards.isQuotedToken(value)
      ) {
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
        if (TypeGuards.isNumberToken(arg) || TypeGuards.isQuotedToken(arg)) {
          this.args.push(arg.getText());
        }
      });
    }

    this.tpls = [];
    let closed = false;
    while (remainTokens.length) {
      let token = remainTokens.shift();
      if (token && (token as any).name === "endfetch") {
        closed = true;
        break;
      }
      if (token) {
        let tpl = this.liquid.parser.parseToken(token, remainTokens);
        this.tpls.push(tpl);
      }
    }
    if (!closed) throw new Error(`tag ${tagToken.getText()} not closed`);
  }

  *render(context: Context, emitter: Emitter): any {
    if (this.contractAddress && this.contractAddress.startsWith("{{")) {
      const valueToken = new Value(
        this.contractAddress.slice(2, -2).trim(),
        this.liquid
      );
      this.contractAddress = (yield valueToken.value(context)).toString();
    }

    if (this.chainId && this.chainId.toString().startsWith("{{")) {
      const valueToken = new Value(
        this.chainId.toString().slice(2, -2).trim(),
        this.liquid
      );
      this.chainId = yield valueToken.value(context);
    }

    const chainId = Number(this.chainId);
    const collectionRes = yield fetch(
      ADMIN_API_URL +
        `/collections/byAddress?address=${this.contractAddress}&chainId=${chainId}`
    );
    const collection = yield collectionRes.json();
    const collectionTemplateRes = yield fetch(
      ADMIN_API_URL + `/collectionTemplates/${collection.collectionTemplateId}`
    );
    const collectionTemplate = yield collectionTemplateRes.json();

    const chainRes = yield fetch(ADMIN_API_URL + `/chains/${chainId}`);
    const chain = yield chainRes.json();

    const provider = new ethers.providers.JsonRpcProvider(
      chain.rpcUrl,
      chainId
    );
    const contract = new ethers.Contract(
      collection.contractAddress,
      collectionTemplate.abi,
      provider
    );
    const result = yield contract[this.functionName](...this.args);
    context.push({ [this.key]: result });

    yield this.liquid.renderer.renderTemplates(this.tpls, context, emitter);
  }
}
