# Asset source and rights record

## M1-04 original vector artwork

Created for this repository on 2026-11-10. The SVG geometry, colors, shapes,
and character treatments were authored from scratch for the Construction Site
RPS Adventure project. No reference artwork, stock library, online image,
font, or external asset was copied or embedded. There are no third-party
attribution or license conditions for these files. The project may use and
modify these original assets with the application.

| Local asset | Depiction | Fixed key |
|---|---|---|
| `public/assets/characters/captain-dozer.svg` | Friendly bulldozer with blade and tracks | `rock` |
| `public/assets/characters/snip-snip.svg` | Friendly excavator with hydraulic shear attachment | `scissors` |
| `public/assets/characters/cover-crane.svg` | Friendly crane holding a soft cloth | `paper` |
| `public/assets/scenes/warm-construction-site.svg` | Warm daylight construction site with distant buildings, dirt ground, cones, and a shallow excavation | Decorative scene |

Names and gesture mapping are content requirements maintained in
`src/rps-domain.ts`. Asset path-to-gesture mapping is typed in
`src/character-assets.ts`. SVG `<title>` text describes the character/art only;
the bilingual game labels remain HTML text. Future changes or replacements
must update this record and identify any third-party license or attribution.

This is an internal source record, not a legal review or a claim of child /
parent acceptance. Formal release asset audit remains in M3-07.
