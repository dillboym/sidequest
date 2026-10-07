# SideQuest direct-code upgrade

This copy was edited directly from the uploaded v0 project.

## Main fixes

- London is now fixed as the only city in the generator; users no longer type a city.
- All 14 current London area catalogues were expanded from 300 to 500 candidate IDs.
- Area pools are rebalanced so parks do not dominate: food, nightlife, active, entertainment and outdoor records are deliberately mixed.
- Address-complete records are prioritised; each area now has hundreds of venues with both formatted address and postcode.
- Added a separate **What do you want to do?** control: Surprise me, Want to eat, Drinks/Bars, Games & Arcades, Shopping, Sport & Active, Culture, Cinema/Shows, Nightlife, Outdoors/Scenic.
- Vibe and activity intent are scored separately.
- Paid budgets no longer reward FREE places above everything else.
- Parks receive strong penalties for Chaotic/Competitive and are excluded from unrelated intents like Food, Drinks, Games and Shopping.
- Existing static catalogue is used first. If Games, Shopping, Culture, etc. are missing locally, the server uses the configured `GEOAPIFY_API_KEY` as a real-place fallback.
- Quest cards now emphasise actual venue name, address, postcode, activity, vibe tags, estimated price and duration.
- Candidate visit duration must fit the requested quest duration.
- Generate Another sends previous place IDs as exclusions, reducing repeated results.
- Added working account-centre UI at `/profile` with profile editing, free-quest status, recent quests and logout.
- Added working `/saved` page backed by Supabase.
- Quest generation attempts to persist successful quests and stops into Supabase and consumes the single free quest only after a successful quest insert.
- Bookmark button now writes to `saved_quests` instead of only changing local UI state.

## Data coverage

The bundled catalogue still contains 7,193 unique real London records. Every current area file now contains 500 candidate IDs. Run:

```bash
node scripts/validate-sidequest-data.mjs
```

for a quick integrity/count check.

## External configuration still required

The project still needs the existing Supabase migrations applied to the connected Supabase project for profile/history/saved/free-quest persistence. Google OAuth also still requires the Google provider/redirect URL to be configured in Supabase if it is not already enabled.

`GEOAPIFY_API_KEY` must remain configured in Vercel server environment variables. Do not hard-code it.
