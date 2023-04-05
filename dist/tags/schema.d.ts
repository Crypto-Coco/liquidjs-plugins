import { Liquid, Tag, TagToken, TopLevelToken } from "liquidjs";
export declare class SchemaTag extends Tag {
    schema: object | null;
    constructor(token: TagToken, remainTokens: TopLevelToken[], liquid: Liquid);
    render(): void;
}
export declare class EndSchemaTag extends Tag {
    schema: object | null;
    constructor(token: TagToken, remainingTokens: TopLevelToken[], liquid: Liquid);
    render(): void;
}
