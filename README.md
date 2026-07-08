# CompileBless

Dynamic GitHub Profile SVG for Vercel Serverless API.

## Preview

Traditional Chinese:

![zh-TW demo](demo/zh-TW.svg)

English:

![en demo](demo/en.svg)

Japanese:

![ja demo](demo/ja.svg)

Korean:

![ko demo](demo/ko.svg)

## API

Deploy this repository to Vercel, then call:

```text
https://your-domain.vercel.app/api?meritCount=1024&lang=zh-TW
```

Query parameters:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `meritCount` | integer | `1024` | Merit counter shown in the board text |
| `lang` | `zh-TW` \| `en` \| `ja` \| `ko` | `zh-TW` | UI language |

Accepted language aliases:

- `zh-TW`, `zh`, `zh-Hant`
- `en`
- `ja`, `jp`, `ja-JP`
- `ko`, `ko-KR`

## Markdown Examples

Traditional Chinese:

```md
![CompileBless](https://your-domain.vercel.app/api?meritCount=1024&lang=zh-TW)
```

English:

```md
![CompileBless](https://your-domain.vercel.app/api?meritCount=1024&lang=en)
```

Japanese:

```md
![CompileBless](https://your-domain.vercel.app/api?meritCount=1024&lang=ja)
```

Korean:

```md
![CompileBless](https://your-domain.vercel.app/api?meritCount=1024&lang=ko)
```

## Local Development

```bash
npm install
npm run typecheck
```

To regenerate local preview SVG files:

```bash
npx tsc --outDir .tmp --noEmit false
node scripts/render-demo.mjs
```