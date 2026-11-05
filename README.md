# Krishi Sakha – Digital Assistant for Small Farmers (Frontend prototype)

Hackathon problem **DL-SJBIT-HK26-AGR010**. A multilingual (English / हिन्दी / ಕನ್ನಡ) React prototype that brings weather, irrigation advice, crop health, schemes, market prices, a task calendar and expert help into one app.

```bash
npm install
npm run dev
```

All weather, market, scheme and disease-analysis data is **simulated demonstration data**. No backend is used; state lives in React context + `localStorage`.

## Demo journey (demo farmer: Ramesh Gowda, Mandya, Karnataka – ragi, Kannada)
1. **Home** – weather, ragi stage, tasks, prices, schemes (dashboard shows a “Demo journey” shortcut list)
2. **Weather** – rain forecast → “Do not irrigate tomorrow” recommendation
3. **Assistant** – ask “Should I irrigate my ragi crop tomorrow?” (or tap the mic: simulated voice) → Kannada answer; adds a calendar reminder
4. **My Crops** – upload a leaf photo → simulated disease analysis
5. **Schemes** – eligibility, documents, how to apply
6. **Market** – compare mandis, trend chart, selling recommendation
7. **Calendar** – add tasks, mark complete, filter by category

Optional mock login: any valid 10-digit number, OTP `123456`.

## Structure
```
src/
  components/   shared UI (Modal, Toaster, LoginModal, CropArt, charts helpers…)
  context/      AppContext – language, profile, crops, tasks, auth, toasts
  data/         mock datasets + local AI engine (ai.js)
  hooks/        useLocalStorage, useCropViews
  layouts/      AppLayout – desktop sidebar, mobile bottom nav
  pages/        Dashboard, Assistant, Crops, Weather, Schemes, Market, Calendar, Community, Profile
  translations/ en.js, hi.js, kn.js (UI strings) + helpers
  utils/        date helpers
```

## Backend integration points
- `src/data/ai.js` – replace `replyFor` / `analyzeLeaf` with real AI / vision calls.
- `src/data/weather.js`, `markets.js`, `schemes.js` – swap for API fetches.
- `src/context/AppContext.jsx` – persistence and auth are isolated here.
