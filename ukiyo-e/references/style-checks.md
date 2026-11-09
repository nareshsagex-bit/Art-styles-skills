# Ukiyo-e: style checks for reference-based work

Use this with `reference-workflow.md`. It lists what the reference brief must capture for woodblock scenes, the misses that came up in real sessions, and how to fix them.

## What the brief must capture
- **The print look:** flat colour bands (how many), the outline weight, the bokashi sky colours from top to horizon, and the paper texture.
- **The hero subject and its angle:** for waves, the side view shows the curl; for ships, a ¾ view shows the sails full.
- **Story direction:** where things are heading (ships sailing for the mountain, birds flying across).
- **Crew and life:** people on boats, what they're doing, wakes, spray.
- **Delivery:** explorable, auto-playing, or a timed film for recording (and how long).

## Common misses (seen in real sessions)
| Miss | What it looked like | Fix |
|---|---|---|
| Wave reads as a dome | Seen head-on, a long curling wave looks like a whale's back | Frame waves from the side (the hook silhouette); keep the curl shape at all times; never squash height during animation (sink or surge instead) |
| Giant wave dominates or annoys | The user wanted ships, not a wall of water | Ask or offer to remove or scale big set pieces; open swell with carved lines works on its own |
| Sails seen edge-on | Side view of a square-rigged ship looks thin | Use a ¾ view for the hero shot; sails billow along the ship's axis |
| Ships look static | Floating in place | Keep the ships fixed and flow the water pattern past them (`FLOW`), add wakes, pitch and roll from the water height |
| Empty decks | Ships without people | Add a crew: deck hands hauling, a helmsman, the captain and a lookout pointing at the goal |
| Mountain out of shot | The goal of the story never on screen | Place it on the heading line; give one view that looks past the hero toward it |
| Hard to record | The camera needs the mouse | Auto tour plus a scripted N-second film on load, controls hidden (H toggles, R replays) |
| Foam blobs | Big white patches on the sea | Raise the foam threshold so foam only caps the highest crests |

## Final self-check
- [ ] Flat bands, outline rims, stepped bokashi sky, paper texture over everything
- [ ] The hero is seen from its most readable angle
- [ ] Things move with purpose (heading, wakes, crew at work)
- [ ] The film plays on load with no UI and holds a good final shot
- [ ] No console errors; every view in the tour looks deliberate
