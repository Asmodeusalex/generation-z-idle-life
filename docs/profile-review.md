# Player profile — targeted review

Implemented as an extension of the existing modal, avatar header and SaveManager. No new backend, currency or game loop. Frames and titles have no income/XP modifiers. New save schema is v4; storage key remains generation-z.save.v2. Schemas 1, 2 and 3 migrate without changing prior state values. Existing Starter Pack Mint is still available to its owners and remains the default for existing owners until they select a frame.

Eight requested frames: Standard (free), Career climber (claim existing Moving up achievement), My own place (housing index >= 1), Neon 50, Cyber 100, Gold 150, Diamond 250, Hologram 400 gems. Five progression titles: Newbie free, Hard worker after 10 side jobs, Career climber after 5 unlocked jobs, Collector after 10 purchases, Millionaire after total earnings reach 1,000,000. Paid titles: Zoomer 30, Main Character 50, Boss 75, CEO 100, Legend 200 gems. Conditions are displayed in all three languages and use existing persistent statistics.

Every purchase opens a preview on the player's current avatar/nickname. Purchase validates balance and ownership synchronously, charges once, saves and equips. Re-selecting owned cosmetics is free. Only one frame and title is active. Nicknames are escaped and limited to 20 Unicode characters. CSS finishes are static; interaction feedback reuses existing Motion and sound/haptic code.

## Checks completed

- `node --test tests/profile.test.js`: 6 targeted tests passed, including all 10 gem prices, duplicate purchase, insufficient/invalid balances, exact balance, progression conditions, selection, save/restart, v1/v2/v3 migration, Starter Mint preservation and nickname sanitation.
- Existing commerce migration test expectation advanced to schema v4; only that single migration test rerun and passed.
- `node scripts/check.mjs`: imports, syntax, translations and service-worker resource manifest passed.
- Real browser at 360 px: 10 gems rejects Neon; test-only QA credit gives 110; Neon purchase leaves 60; Main Character leaves 10. Equipped button disabled; title can change to Newbie and back without spending. Reload retains Nova Z, Neon, Main Character and 10 gems.
- RU/UK/EN: frame and title grids have no horizontal overflow or overflowing text. Gold preview shows actual avatar, nickname, active title, price 150 and balance 10 before any purchase.
- No new application errors observed; browser-extension metadata messages are unrelated.
- Screenshots: profile.jpg, frames.jpg, titles.jpg, preview.jpg in screenshots-profile/.

Only targeted feature checks were run, not the full game suite. No physical Android-device claim. Existing careers, items, housing, achievements, prices, rewards, progression, Starter Pack and rewarded ad implementation unchanged. Game core only adds default profile state; existing save handling accepts v4 and sanitizes profile. Service worker cache updated for new modules/CSS.
