import { Liquid, Tag, TagToken, TopLevelToken } from "liquidjs";
import { isTagToken } from "../utils/typeGuard";

export class SchemaTag extends Tag {
  public schema: object | null = null;

  constructor(token: TagToken, remainTokens: TopLevelToken[], liquid: Liquid) {
    super(token, remainTokens, liquid);
    const endschemaToken = remainTokens.find(
      (t) => isTagToken(t) && t.name === "endschema"
    );

    if (!endschemaToken) {
      throw new Error("Missing end tag: endschema");
    }

    const content = token.input.slice(token.end, endschemaToken.begin);

    try {
      this.schema = JSON.parse(content);
    } catch (e) {
      throw new Error("Invalid JSON in schema tag");
    }

    // コンテンツを削除
    while (remainTokens.length) {
      const token = remainTokens.shift()!;
      if (isTagToken(token) && token.name === "endschema") return;
    }
  }

  render(): void {}
}

export class EndSchemaTag extends Tag {
  public schema: object | null = null;

  constructor(
    token: TagToken,
    remainingTokens: TopLevelToken[],
    liquid: Liquid
  ) {
    super(token, remainingTokens, liquid);
  }

  render(): void {}
}
