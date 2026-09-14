# TextValue branding assets

These tokens and marks follow Ivan’s existing TextValue working-studio design system.

- `tokens.css`: exact color tokens, local Geist font faces and a few starter primitives. Adapt paths to the application’s public-asset layout.
- `fonts/`: Geist 400/500/600 and Geist Mono 400, with their SIL Open Font Licenses. Preserve both license files when copying.
- `scribbles.svg`: the existing TextValue underline, loop, arrow, spark and wave. Use as an SVG sprite or inline the selected symbol. Marks are decorative and must not intercept input.
- `villa-concept.png`: AI-generated conceptual illustration, 1536 × 1024. Display a concept-illustration label. It is not a photo or verification of any property.

Use the name **Libbie Lab** with a small **by TextValue / Ivan Židov** identifier. Do not imply this is Liberate’s official visual identity. No official Liberate logo is included.

Keep operational information visible. Use a loose underline or circle for an important observation. Use paper layers sparingly. Working tables and forms stay aligned. Respect reduced motion and keep content readable without animation.

Example sprite use after copying the files to public/branding:

```html
<svg class="tv-scribble" viewBox="0 0 310 27" aria-hidden="true">
  <use href="/branding/scribbles.svg#underline"></use>
</svg>
```

For path-drawing animation, inline the selected path and use `pathLength="1"`. Do not assume an external SVG use element supports path animation identically in every browser.
