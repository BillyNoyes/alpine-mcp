# Site assets

The visual direction combines the restrained typography and full-width shell of the [Easel site](https://github.com/BillyNoyes/Easel/tree/main/site) with the information hierarchy and evidence-led composition in [Vercel's design guidance](https://vercel.com/design.md).

All component and page styling is expressed with Tailwind utility classes in `index.html`. The site does not load Vercel's stylesheet and does not use or recreate its `vbg-*` CSS classes. `src/style.css` contains only Tailwind's import, local font faces, theme tokens, and Alpine's pre-initialization visibility rule.

## Fonts

The regular and bold Inter faces in `public/fonts/` mirror the self-hosted setup used by Easel. Their SIL Open Font License is included as `Inter-LICENSE.txt`. Code and paths use a system-first Geist Mono fallback stack, so the site makes no third-party font requests.

## Visual assets

`public/alpine-mcp.svg` is the original alpine-mcp mark used in the header and as the favicon. Its rounded dark tile and white linework follow the visual language of Easel's mark. A single mountain with a snow line keeps the Alpine reference legible at header and favicon sizes.

The site intentionally uses the working search preview as its primary visual evidence. It does not use stock imagery, decorative illustrations, fake application screenshots, or third-party runtime assets.
