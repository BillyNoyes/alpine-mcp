# alpine-mcp site design

The design authority for this site is [Vercel's design guidance](https://vercel.com/design.md), adapted to the alpine-mcp identity and informed by the typography and shell of the [Easel site](https://github.com/BillyNoyes/Easel/tree/main/site).

## Implementation rules

- Use Tailwind utility classes directly in semantic HTML for layout, typography, color, responsive behavior, focus states, and dark mode.
- Do not load Vercel's brand stylesheet or use `vbg-*` classes. This is an independent alpine-mcp site, not an official Vercel property.
- Keep the palette monochrome and let hierarchy, alignment, and spacing carry the design.
- Use self-hosted Inter for interface text and the system Geist Mono fallback stack only for commands, paths, and identifiers.
- Treat the interactive documentation search as the primary visual evidence. Do not add stock media, fake screenshots, decorative gradients, glows, or ornamental motion.
- Preserve one continuous light or dark canvas based on the visitor's system preference.
- Keep every interaction keyboard accessible, visibly focused, and complete without animation.
