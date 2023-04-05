import { Context, Emitter, Liquid, Tag, TagToken, Template, Token, Tokenizer, TopLevelToken } from "liquidjs";
export type ParsedFileName = Template[] | Token | string | undefined;
export declare class SectionTag extends Tag {
    currentFile?: string;
    file: ParsedFileName;
    instanceId: string;
    constructor(token: TagToken, remainTokens: TopLevelToken[], liquid: Liquid);
    render(ctx: Context, emitter: Emitter): unknown;
}
/**
 * @return null for "none",
 * @return Template[] for quoted with tags and/or filters
 * @return Token for expression (not quoted)
 * @throws TypeError if cannot read next token
 */
export declare function parseFilePath(tokenizer: Tokenizer, liquid: Liquid): ParsedFileName;
export declare function renderFilePath(file: ParsedFileName, ctx: Context, liquid: Liquid): IterableIterator<unknown>;
