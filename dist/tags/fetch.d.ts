import { Liquid, Tag, TagToken, TopLevelToken, Context, Emitter } from "liquidjs";
export declare class FetchTag extends Tag {
    private key;
    private tpls;
    private functionName;
    private chainId?;
    private contractAddress?;
    private args;
    private argValues;
    constructor(tagToken: TagToken, remainTokens: TopLevelToken[], liquid: Liquid);
    render(context: Context, emitter: Emitter): any;
}
