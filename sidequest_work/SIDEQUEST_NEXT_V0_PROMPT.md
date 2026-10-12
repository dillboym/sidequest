# SIDEQUEST — ADD 1,000 MORE REAL OPTIONS + REMEMBER ME + VIBIER REDESIGN

Work on the existing SideQuest project. Do not start a new app and do not replace the working Geoapify/Leaflet/Supabase architecture.

## 1. IMPORT THE 1,000 EXTRA REAL VENUES

A prepared CSV already exists in this repository at:

`data/sidequest/additional-1000.csv`

It contains EXACTLY 1,000 real London venue assignments with:
- id
- name
- assignedArea
- full address
- postcode
- activity
- activityGroup
- genres
- price band
- estimated price min/max
- typical duration
- latitude
- longitude
- adultRestricted
- source dataset

The batch contains:
- 410 restaurants
- 200 cafes
- 300 pubs
- 90 bars

The 1,000 rows are spread roughly evenly across all 14 active London areas.

IMPORTANT:
- Do not invent any place names, addresses or postcodes.
- Do not duplicate canonical place records.
- These IDs already exist in `data/sidequest/places.json`.
- For each row, append its `id` to the correct `data/sidequest/areas/<slug>.json` file based on `assignedArea`.
- Deduplicate every area list.
- Do not remove the existing 500 candidates.
- The point is to increase the candidate pool beyond the current 500 and improve food/drink depth.
- Validate that every imported ID resolves to a real record in `places.json`.

After import, output a report for every area:
AREA NAME
BEFORE COUNT
ADDED COUNT
AFTER COUNT
RESTAURANT COUNT
CAFE COUNT
PUB COUNT
BAR COUNT
WITH ADDRESS
WITH POSTCODE

## 2. KEEP ENTERTAINMENT / SHOPPING / CULTURE OPTIONS

The extra 1,000 CSV rows are intentionally food/nightlife-heavy.

DO NOT let the recommendation engine become only restaurants and pubs.

Keep and improve the existing Geoapify fallback for:
- Games & Arcades
- Bowling
- Mini golf
- Escape rooms
- Cinema
- Sport / active
- Shopping centres
- Department stores
- Markets
- Culture / museums / galleries / theatres
- Nightlife
- Outdoors / scenic

The primary intent must continue to dominate scoring.

If the user selects Games & Arcades, a restaurant/pub must not become the primary stop unless it is only a secondary food stop after the game.

If the user selects Want to Eat, the primary stop must be a real restaurant/cafe/food venue.

If the user selects Drinks / Bars, primary must be a real pub/bar/taproom and age rules must apply.

If the user selects Shopping, primary must be shopping-related.

## 3. REMEMBER ME / KEEP USERS SIGNED IN

Fix authentication so a user does NOT need to keep signing in.

Add a clear checkbox/toggle on both Log In and Sign Up:

[✓] Keep me signed in on this device

Default: checked.

Requirements:
- Use Supabase's existing session system.
- Do NOT store passwords.
- Browser auth must use persistent sessions and automatic refresh.
- Keep sessions across refreshes, normal navigation, closing/reopening the browser, and returning to the site later while the Supabase refresh session is still valid.
- Google OAuth must have the same persistence.
- Email/password login must have the same persistence.
- The account/profile icon should immediately know the user is signed in after refresh.
- Generate must not ask a signed-in user to log in again.
- Only sign the user out when:
  1. they explicitly click Log Out,
  2. the session is genuinely expired/revoked,
  3. they chose not to be remembered and start a genuinely new browser session.

This is Next.js 16, so keep the existing `proxy.ts` approach for Supabase SSR cookie refresh.

Make the browser Supabase client a singleton and ensure session persistence / auto refresh are enabled.

If "Keep me signed in" is unchecked:
- keep the user signed in for the current browser session,
- but do not treat it as a long-term remembered login on a later browser session.

Do not make any auth check capable of leaving the UI on an infinite spinner.

## 4. SIGNED-IN NAVIGATION

When signed out:
- profile/account button should say or imply "Sign in".

When signed in:
- show a small avatar / initials chip.
- clicking it opens Account Centre.
- account menu should include:
  - Profile
  - Previous SideQuests
  - Saved
  - Preferences
  - Log out

Do not make the user re-authenticate just to view Saved or Profile if their existing session is valid.

## 5. MAKE THE DESIGN MUCH MORE VIBEY

Keep the SideQuest identity:
- deep navy
- acid/lime yellow
- off-white
- bold typography

But make the website feel like a young London discovery app, not a generic SaaS template.

Design direction:
- nightlife / city-energy feel
- subtle neon lime glow
- grain/noise texture
- soft glass panels over dark sections
- slightly irregular cards / stickers
- animated map-route motifs
- subtle dotted/dashed path graphics
- micro-animations on hover/tap
- category icons
- stronger photography/image placeholders where real photos are available
- more visual separation between vibe and activity intent
- mobile-first

DO NOT make it childish.
DO NOT make it look like a gaming website.
DO NOT overuse gradients.
DO NOT destroy readability.

## 6. HERO REDESIGN

Keep the message "BORED? GO ON A SIDEQUEST."

Improve the hero with:
- stronger visual hierarchy
- a subtle animated London route/path graphic behind the content
- small floating "mission" chips such as:
  - £20 · 2H · SOHO
  - CHAOTIC
  - WANT TO EAT
  - 3 STOPS
- a soft lime glow behind the generator
- more movement on desktop, but restrained on mobile

Generator card should feel premium:
- clearer sections
- better spacing
- selected options feel tactile
- active chips have a lime edge/glow
- buttons have smooth press/hover motion

## 7. VIBE + ACTIVITY FILTERS

Keep "What's the vibe?"

Then directly underneath use a stronger section:

"WHAT ARE WE ACTUALLY DOING?"

Options:
- Surprise me
- Want to eat
- Drinks / Bars
- Games & Arcades
- Shopping
- Sport & Active
- Culture
- Cinema / Shows
- Nightlife
- Outdoors / Scenic

Each should have a distinctive icon and selected state.

"Want to eat" must be highly visible.

## 8. QUEST RESULT DESIGN

Make generated quest results feel like a real mission.

For each stop show:

01
GO TO

VENUE NAME
FULL ADDRESS
POSTCODE

CATEGORY

vibe chips

PRICE
TIME HERE

Then route to next stop.

Improve the visual route between cards:
- dashed vertical connector on mobile
- route-line motif
- numbered stop circles
- map pins use same number/color system

No generic "Make this your main stop" text.

## 9. MAP

Keep the existing working Leaflet/Geoapify map.

Improve presentation:
- numbered markers matching quest cards
- start marker visually distinct
- selected marker opens a clean popup with:
  - venue name
  - address
  - postcode
  - category
  - estimated price
- fit map bounds around the whole quest
- keep route line visible and clear

Do not replace the working map with a mock.

## 10. BUDGET BEHAVIOUR

Budget is a maximum / preference, not "always choose free."

Examples:
- £50 should consider paid restaurants, arcades, bars, bowling, etc.
- free parks should not automatically outrank paid venues.
- for a paid social/chaotic/competitive quest, aim to make sensible use of the budget.

Keep the existing rule that parks cannot dominate unrelated intents.

## 11. RANDOMNESS / GENERATE ANOTHER

Generate Another must:
- keep the same filters
- strongly exclude the current venue IDs
- strongly exclude recently used venue IDs
- produce a genuinely different combination

## 12. NO INFINITE LOADING

Every network operation must time out and show a human-readable error.

Never leave:
- Generate
- Profile
- Saved
- Sign in
- Google OAuth callback

on an endless spinner.

## 13. ACCEPTANCE TESTS

Test all of these in the browser:

A.
Camden
£50
4 hours
Chaotic
Games & Arcades

Must not be park + park.

B.
Soho
£40
2 hours
Social
Want to Eat

Must show a real named food venue with full address + postcode.

C.
Soho
£50
3 hours
Social
Drinks / Bars
18+ test user

Must show real pubs/bars.

D.
Victoria
£50
2 hours
Competitive
Games & Arcades

Primary must be a game/activity venue if available.

E.
Sign in with email/password.
Refresh 3 times.
Navigate Home -> Generate -> Explore -> Account -> Saved.
User must still be signed in.

F.
Close and reopen the browser with "Keep me signed in" checked.
User should still be signed in while the Supabase refresh session is valid.

G.
Google sign-in should also remain signed in.

## 14. FINAL REPORT

Do not just say "build passes."

Report:
- additional CSV rows read: 1000
- additional rows successfully assigned: X
- duplicates skipped: X
- total candidate count for each area after import
- Remember Me: PASS/FAIL
- email login persistence: PASS/FAIL
- Google login persistence: PASS/FAIL
- Generate navigation: PASS/FAIL
- Explore navigation: PASS/FAIL
- Saved page: PASS/FAIL
- Account page: PASS/FAIL
- Want to Eat: PASS/FAIL
- Drinks/Bars: PASS/FAIL
- Games/Arcades: PASS/FAIL
- Shopping: PASS/FAIL
- address/postcode display: PASS/FAIL
- map: PASS/FAIL
- mobile layout: PASS/FAIL
- no infinite loading: PASS/FAIL

Do not claim completion if a browser test fails.
