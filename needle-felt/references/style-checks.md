# Needle felt: style checks for reference-based work

Use this with `reference-workflow.md`. It lists what the reference brief must capture for felt scenes, the misses that came up in real sessions, and how to fix them. Recipes are in `felt-code.md`.

## What the brief must capture
- **Characters as shape recipes:** body shape (capsule, sphere), eye count, hair, clothes and their colours.
- **Scene type:** a few characters doing something (felt-football style) or a busy illustration (paper-plane style). That decides how many atmosphere layers you need.
- **Atmosphere inventory with counts:** text, stars, sparkles, glitter, trails, lanterns, floating words.
- **Light:** what glows, and which clouds or objects are lit warm.
- **Delivery:** auto-playing loop, voices and quote bubbles, framing and zoom.

## Common misses (seen in real sessions)
| Miss | What it looked like | Fix |
|---|---|---|
| Plastic, not felt | Smooth surfaces | Fibre density too high: aim for about one fibre texel per screen pixel (body about 3, small parts .5–1.5); fur length .05–.1 |
| Fibres poke through clothes | Yellow fuzz in blue overalls | Make outer layers about 8% bigger, and shorten the inner part's fur |
| Parts hide each other | The smile hidden behind the goggle or bib | Place features by the head geometry (`EYE_Y`, `HR`), and check a zoomed screenshot |
| Feet float | A gap between the feet and the shadow | Compute the lift from the real lowest point of the feet |
| Too sparse for an illustration | Main objects only, the reference was "busy" | Add the storybook layers (painted backdrop, glow, sparkles, glitter, trails, text) to the counts in the brief |
| Rain-like backdrop | Vertical streaks | Swirling brush dabs that follow a flow field |
| Wrong framing | The camera too close, or the moon out of shot | A single `ZOOM` factor along the view direction; place sky objects inside the frame |
| Broken shapes | A crescent moon looked like a ring | Build the crescent from two arcs, not a circle with a hole that crosses the edge |

## Final self-check
- [ ] Fibres visible everywhere at screen size; nothing looks plastic
- [ ] Every character passes its feature list in a zoomed screenshot
- [ ] The atmosphere counts roughly match the reference
- [ ] Glow on the things that glow in the reference; warm and cool balance matches
- [ ] Plays automatically; no console errors
