import { TagToken, TokenKind } from "liquidjs";

function getKind(val: any) {
  return val ? val.kind : -1;
}

export function isTagToken(val: any): val is TagToken {
  return getKind(val) === TokenKind.Tag;
}
