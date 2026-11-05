# AgriSahaya – Digital Assistant for Small Farmers (Frontend prototype)

Hackathon problem **DL-SJBIT-HK26-AGR010**. A multilingual (English / हिन्दी / ಕನ್ನಡ) React prototype that brings weather, irrigation advice, crop health, schemes, market prices, a task calendar and expert help into one app.

```bash
npm install
npm run dev
```

All weather, market, scheme and disease-analysis data is **simulated demonstration data**. No backend is used; state lives in React context + `localStorage`.

## Demo journey (demo farm: Mandya, Karnataka – ragi, Kannada)
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

## Branding & auth
- Product name lives only in `src/config/brand.js` (`APP_NAME`). UI strings use the `{app}` token, which `translate()` fills in automatically.
- Sign-in goes through `src/services/auth.js`:
  - **Email + password**: Supabase when configured and reachable; otherwise on-device accounts in `localStorage` (salted SHA-256 hash – prototype only, not real security).
  - **Mobile + OTP**: simulated locally (no SMS; demo code `1234`). Real phone verification needs Supabase phone auth + an SMS provider (MSG91/Twilio).

## AI features
- **Chat assistant** (`src/services/groq.js`): Groq chat completions via the dev/preview proxy `/proxy/groq`, which adds `GROQ_API_KEY` (or `VITE_GROQ_API_KEY`) from `.env.local` server-side. It tries `llama-3.3-70b-versatile`, then `openai/gpt-oss-120b` and others the account can use. The system prompt includes live weather and the app's verified pest/insurance notes. Any failure falls back to the offline rule-based replies in `src/data/ai.js`.
- **Crop Doctor** uses demo diagnoses (`src/data/diagnosis.js`); replace `diagnose()` with a real vision model to make it live.

## Live official feeds
- **Market → Live mandi prices**: Agmarknet "Current Daily Price of Various Commodities from Various Markets (Mandi)" via data.gov.in (`src/services/agmarknet.js`). Falls back to cached official data, then demo data, with clear labels.
- **Announcements**: live agriculture headlines from Indian publishers via newsdata.io (`src/services/news.js`), in the app language; `NEWSDATA_API_KEY` is added server-side by the `/proxy/newsdata` proxy.
- These sources don't allow direct browser calls (no CORS / secret keys), so `vite.config.js` proxies them at `/proxy/datagov` and `/proxy/newsdata` for `npm run dev` and `npm run preview`.
- Put your data.gov.in key in `.env.local` as `DATA_GOV_API_KEY=...` (see `.env.example`). The proxy adds it server-side, so it is never shipped in the website bundle. **For production hosting, deploy an equivalent proxy** (e.g. a serverless function) – static hosting alone cannot reach these feeds.
