# Gurman AI character art

Drop the character illustration here as:

    gurman-ai.png

`GurmanHero` (`apps/web/app/components/gurman-hero.tsx`) references
`/gurman/gurman-ai.png`. Until that file exists the hero renders a branded
monogram fallback instead — it never ships a broken image box, so adding the
file is the only step needed and requires no code change.

Recommended: transparent PNG, portrait orientation, roughly 1080x1440,
under ~400KB so it does not dominate the hero's load on a mobile connection.
