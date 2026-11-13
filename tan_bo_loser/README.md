# tan_bo_loser

A two-deck YouTube mix of 等無 (Deck A) and 魯之歌 (Deck B). The page plays both videos through YouTube's embedded player and keeps Deck B in time with Deck A.

## Files

- `index.html`: the page and its YouTube sync engine
- `mix-core.js`: the mix plan, timeline and controls (shared with the hosted-audio version)
- `grid.json`: beat positions, keys and waveform outlines measured from the songs (no audio)

## Run locally

YouTube's player won't run from a file opened directly, so serve the folder:

```sh
cd tan_bo_loser
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Publish on GitHub Pages

1. Push this folder's contents to a GitHub repository (as the repo root, or as a `tan_bo_loser/` folder).
2. In the repo, open **Settings → Pages**, set **Source** to "Deploy from a branch", and pick the branch and folder.
3. The page appears at `https://<user>.github.io/<repo>/` (add `tan_bo_loser/` if it's in a subfolder).

Pages sites are public. No audio is hosted here: every visitor streams the songs from YouTube.

## Limits

- Deck B chases Deck A's clock with seeks, so expect small slips (roughly 50–300 ms) after jumping or buffering. The Sync readouts show the current error.
- YouTube volume tops out at 100%.
- Ads or buffering on either video can interrupt the mix.
- The beat data matches these two uploads exactly: 等無 `I9LDJl7SfIw` and 魯之歌 `6pGcWmHKaqE`. Another upload of either song needs new measurements.
