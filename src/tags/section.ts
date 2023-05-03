import { ethers } from "ethers";
import {
  Context,
  Emitter,
  Liquid,
  Tag,
  TagToken,
  Template,
  Token,
  Tokenizer,
  TopLevelToken,
  TypeGuards,
  assert,
  evalQuotedToken,
  evalToken,
} from "liquidjs";

export type ParsedFileName = Template[] | Token | string | undefined;

export class SectionTag extends Tag {
  currentFile?: string;
  file: ParsedFileName;
  instanceId: string;

  constructor(token: TagToken, remainTokens: TopLevelToken[], liquid: Liquid) {
    super(token, remainTokens, liquid);
    const args = token.args;
    const tokenizer = new Tokenizer(args, this.liquid.options.operators);
    this.file = parseFilePath(tokenizer, this.liquid);
    this.currentFile = token.file;
    const message = `${this.file}${token.begin}${token.end}`;
    let messageBytes = ethers.utils.toUtf8Bytes(message);
    this.instanceId = ethers.utils.sha256(messageBytes);
  }

  *render(ctx: Context, emitter: Emitter): unknown {
    const { liquid } = this;
    const filepath = (yield renderFilePath(
      this["file"],
      ctx,
      liquid
    )) as string;
    assert(filepath, () => `illegal filename "${filepath}"`);

    const scope = ctx.getAll();
    const localScope = { section: (scope as any)["sections"][this.instanceId] };

    ctx.push(localScope); // ローカルスコープをプッシュ

    const templates = (yield liquid._parsePartialFile(
      filepath,
      ctx.sync,
      this["currentFile"]
    )) as Template[];
    yield liquid.renderer.renderTemplates(templates, ctx, emitter);

    ctx.pop(); // ローカルスコープを元に戻す
  }
}

/**
 * @return null for "none",
 * @return Template[] for quoted with tags and/or filters
 * @return Token for expression (not quoted)
 * @throws TypeError if cannot read next token
 */
export function parseFilePath(
  tokenizer: Tokenizer,
  liquid: Liquid
): ParsedFileName {
  if (liquid.options.dynamicPartials) {
    const file = tokenizer.readValue();
    if (file === undefined)
      throw new TypeError(`illegal argument "${tokenizer.input}"`);
    if (file.getText() === "none") return;
    if (TypeGuards.isQuotedToken(file)) {
      // for filenames like "files/{{file}}", eval as liquid template
      const templates = liquid.parse(evalQuotedToken(file));
      return optimize(templates);
    }
    return file;
  }
  const tokens = [...tokenizer.readFileNameTemplate(liquid.options)];
  const templates = optimize(liquid.parser.parseTokens(tokens));
  return templates === "none" ? undefined : templates;
}

function optimize(templates: Template[]): string | Template[] {
  // for filenames like "files/file.liquid", extract the string directly
  if (templates.length === 1 && TypeGuards.isHTMLToken(templates[0].token))
    return templates[0].token.getContent();
  return templates;
}

export function* renderFilePath(
  file: ParsedFileName,
  ctx: Context,
  liquid: Liquid
): IterableIterator<unknown> {
  if (typeof file === "string") return file;
  if (Array.isArray(file)) return liquid.renderer.renderTemplates(file, ctx);
  return yield evalToken(file, ctx);
}
