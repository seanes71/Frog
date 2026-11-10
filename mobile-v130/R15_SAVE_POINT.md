# Froggy Match Frenzy MOBILE — R15 Save Point

- **Save point:** V130 R15 — Lighter Skin Mouth Border
- **Date:** 2026-11-10
- **Source archive:** `Froggy_Match_Frenzy_V130_R15_Lighter_Skin_Mouth_Border_TEST_Source.zip`
- **Archive size:** 186,988,523 bytes
- **SHA-256:** `c73c71993955e232b4c72c7c61fc2bd018aa704d075637eb9b0dd7cc3674bdf7`
- **Archive integrity:** ZIP integrity check passed.
- **Build classification:** TEST_ONLY; user-designated development save point, not a production release.
- **Base source:** V130 R14 Boutique Layout / Hair Fix TEST.

## R15 change

The girl's mouth-border/muzzle area uses a separate blue-channel mask. When the frog skin is recolored, the mouth border follows the active skin hue with a lighter treatment (saturation multiplier 0.52; brightness multiplier 1.08). The mouth opening and pink tongue remain unchanged.

## Offline verification

- 333 animation frames checked: clap 50, jump 50, dance 175, victory 58.
- No measured hair-mask or wardrobe-mask overlap with the mouth-border mask.
- No frames below 100 mouth-mask pixels.
- Skin and alpha channels remain byte-identical.
- Critical gameplay scripts, champion portrait scripts, boy assets, and Boutique catalog remain unchanged.
- Website and the other seven games were not touched.
- R14 source remains preserved.

## Not yet verified

Godot runtime/import, Web export, real phone layout, Firebase sign-in/cloud-save on the deployed Faceoff origin, and actual gameplay have not been tested. Keep R14 as a rollback point. Do not call R15 a production-ready release until runtime and phone testing pass.
