# Crayon kid drawing: style checks for reference-based work

Use this with `reference-workflow.md`. It lists what the reference brief must capture for crayon scenes, the misses that came up in real sessions, and how to fix them.

## What the brief must capture
- **Each character's identity:** 3–5 features per character (hair shape, glasses, outfit colours, pointy nose, pigtails, body width), mapped to `kid()` spec fields, or a custom figure for non-humans (a robot cat, an animal).
- **What the user wants around them:** the classic sky strip, sun and clouds, or "just the land". Users often ask to remove the extras.
- **The ground shape:** a hill, a strip, or a rectangle of grass.
- **Delivery:** one picture, a looping scene, or a story with pages, captions, bubbles and sound.
- **The frame:** paper sheet with tape, or drawn straight onto the page; how much of the window it fills.

## Common misses (seen in real sessions)
| Miss | What it looked like | Fix |
|---|---|---|
| Characters off-model | The friends didn't read as the reference characters | List the identity features per character, then check each one in a zoomed screenshot (eye style, hair silhouette, collar, bow, colours) |
| Cluttered page | The sun, sky and clouds weren't wanted | Make every motif optional (`skyStrip`, `sun`, `paper: false`); confirm what to keep |
| Empty paper | Big blank areas above the scene | Fit `W`/`H` tightly to the content; crop the sheet |
| Static scene | Characters only running in place | Offer a story flow: pages with captions, poses (`walk`, `wave`, `cheer`, `jump`, `fly`), props, speech bubbles and a clear ending |
| Story beats unclear | Who gives what to whom wasn't shown | Script it explicitly (for example, the cat pulls copters out one by one, each flies to a head, then they lift off in order with small gaps) |
| Too big on screen | The scene filled the window | Expose the `size` option; "40%" means `size: .4` |
| Silent | No sound | Add `story-audio.js` music and cues per beat, started on the first tap |

## Final self-check
- [ ] Every character passes its identity checklist in a zoomed screenshot
- [ ] Only the motifs the user wants are on the page
- [ ] Wobbly waxy lines, scribble fills over the edges, only crayon-box colours
- [ ] The story beats read without explanation; captions and bubbles are legible
- [ ] Framing and size match the request; no console errors
