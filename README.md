# Hero’s Fortune

A browser-based tabletop dice roller with transparent, optional luck settings. Fair dice are selected on every fresh page load.

## Features

- Named action rows with 1–10 dice, standard die types (d4 through d100), and a modifier applied once per action total.
- Independent roll modes for each action: normal, advantage, or disadvantage.
- Roll one action or all actions separately.
- Light and dark themes: follows your device setting until you choose a theme, then remembers that choice in this browser.
- Adjustable luck: Fair (0%), Gentle (25%), Heroic (50%), and Legendary (100%). The percentage is the chance to roll a second candidate and keep the higher result, for each die before advantage or disadvantage.
- Exact outcome probabilities and target-total chances for the selected action.
- Candidate-die audit details and a recent roll history.
- Action setups and the most recent 30 rolls saved locally in the browser.

Luck is an optional house rule. Agree on it with your table. Legendary currently permits natural 20s; the proposed conversion of 20 to 19 has not been implemented.

## Run locally

No build step, package installation, or external assets are required. Serve `docs/` with a local HTTP server, for example:

```sh
python -m http.server 8000 --directory docs
```

Open `http://localhost:8000`. HTTPS or localhost is required for the browser's secure randomness and UUID APIs.

## GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/docs**. Changes committed to `main` publish automatically through GitHub Pages.

All site files live in `docs/`. `.nojekyll` disables unnecessary Jekyll processing.

## Source layout

- `docs/index.html` — interface and page structure.
- `docs/style.css` — responsive layout and styling.
- `docs/theme.js` — early theme selection and the persistent theme toggle.
- `docs/core.js` — randomness, dice selection, and probability calculations.
- `docs/app.js` — action management, odds display, roll history, and browser storage.

## Privacy and migration

There is no application backend, analytics, external font loading, or third-party asset loading. Application data stays in this browser's local storage. GitHub Pages serves the files and handles its own hosting logs.

Browser storage belongs to each website origin. Setups and history on the previous ChatGPT-hosted URL do not automatically move to the GitHub Pages URL.

This is an unofficial tabletop tool, not affiliated with Dungeons & Dragons or Wizards of the Coast.
