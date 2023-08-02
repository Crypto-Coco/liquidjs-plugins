
## 開発

```bash
$ yarn link
```

installしたいプロジェクトで以下のコマンドを叩く

```bash
$ yarn link liquidjs-plugin
```

## デプロイ

```bash
$ npx tsc
```

package.jsonのバージョンをあげてcommitする

```bash
$ git tag v<version>
```

```bash
$ git push origin tag <version>
```