# R15 — Froggy Faceoff Mobile integration draft

**Status: integration prepared in a draft branch; not merged or deployed.**

R15 is the new Froggy Match Frenzy MOBILE save point. This branch replaces the existing mobile launch destination with a same-origin path inside the Froggy Faceoff mobile site:

- Lobby: `https://froggy-faceoff-mobile.web.app/`
- Game: `https://froggy-faceoff-mobile.web.app/froggy-match-frenzy/`

The mobile home already has a Froggy Match Frenzy tile. It now routes to the new same-origin path rather than the old separate `froggy-match-frenzy-mobile.web.app` host. This avoids adding a duplicate game tile and lets the Godot game's Firebase Auth bridge restore the existing browser session on the same origin.

## Why same-origin

R15's `FrogHubBridge.gd` uses the existing Firebase project `frog-match`. Serving the game below the Faceoff mobile site's own origin lets Firebase Auth reuse the browser's existing session. The game's match progress is still stored in its own field on the same signed-in user's Firestore document; it does not create another login service.

The Godot game already returns to `../mobile.html`; the added `‹ Faceoff` control also returns to the validated Faceoff URL passed in `returnTo`.

## Build and deploy

1. Download and extract `Froggy_Match_Frenzy_V130_R15_Lighter_Skin_Mouth_Border_TEST_Source.zip`.
2. Open its `project.godot` in Godot 4.
3. Export the **Mobile Web** preset. The preset writes to `build/web`.
4. Clone this branch and run:

   ```bash
   R15_EXPORT_DIR="/absolute/path/to/R15/build/web" ./mobile-v130/deploy-mobile-only.sh
   ```

5. The script checks the export, preserves any existing local game folder, copies the R15 Web export into `dist/froggy-match-frenzy/`, adds the Faceoff return control, and prepares a Firebase Hosting config for the existing `froggy-faceoff-mobile` site.
6. The script requires typing `YES` before deployment.

The deployment script targets only the **Froggy Faceoff mobile Hosting site** in Firebase project `frog-match`. It does not deploy the separate website or any other Hosting site. The previous standalone Vegas host `froggy-match-frenzy-mobile.web.app` is not modified and remains available as a rollback.

## Validation still required

- Godot import and Web export of the R15 source.
- Mobile browser load, touchscreen play, audio, and portrait fit.
- Sign in to Froggy Faceoff first, open Match Frenzy, and verify the same Firebase account is recognized.
- Verify the R15 account save and reload on the same user.
- Verify the Faceoff return button and in-game return control.
- Confirm the other seven mobile games still open.

**Do not merge to `main` or publish until these checks pass and the user approves the mobile test.** The website and other seven games remain outside this change.
