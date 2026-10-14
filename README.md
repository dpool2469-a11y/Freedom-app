# FREEDOM — Complete Personal Finance App

A mobile-first, installable PWA built with HTML, CSS and vanilla JavaScript. Designed for GitHub Pages and phone-first repository uploads.

## Publish with GitHub Pages
1. Download and extract `FREEDOM-Complete-Finance-App.zip`.
2. Upload the contents of this folder (not the outer folder) into the root of your GitHub repository. Keep the `icons` folder.
3. In the repository, open **Settings → Pages** and publish from the `main` branch and `/ (root)`.
4. Open the Pages URL in Chrome on Android. Use the browser menu → **Install app** or **Add to Home screen** when available.
5. If an older version is stuck, fully close the installed app/browser and reopen after the new Pages deployment completes. The service worker cache name is `freedom-pwa-v3`; bump it when making future changes.

## Included features
- Dashboard with live net worth = assets + investment current values − outstanding debts.
- Add, edit and delete assets, debts, transactions, savings goals, investments and monthly category budgets.
- Debt planner with avalanche/snowball ordering, extra monthly payment estimate, interest and time comparison.
- Savings goal progress and approximate completion dates.
- Manual investment current values and returns; no fabricated live market data.
- Monthly income/expense summary and category budget usage.
- JSON backup/restore and CSV export.
- CIBIL information screen that does not fabricate a score or request PAN/OTP. Real automatic report retrieval is not enabled; it needs an authorized provider integration and verification.
- PWA manifest, icons, service worker cache versioning and offline fallback.

## Local-first data and safety
Records are saved in browser `localStorage` under `freedom-finance-data-v1`. This app does not clear that key during startup. Use **More → Backup data** regularly and keep the backup file somewhere safe. Browser/site-data clearing, changing browser profiles, or uninstalling may make local data unavailable; a backup is the recovery path. Restore replaces current records only after confirmation.

Net worth includes the asset register plus investment records. To avoid double-counting, do not enter the same investment holding in both lists. Savings goals are planning labels and are not added as separate assets; if goal money is already included in a bank balance asset, it is counted only through that asset.

## Limitations / verification
- This is a client-only finance tracker, not a bank-connected account aggregator. Data must be entered by the user.
- The debt planner provides an estimate based on supplied APRs, EMIs and monthly budgets. Actual lender calculations, fees and payment timing may differ.
- Automatic CIBIL score/report display is not connected. The screen links to https://www.cibil.com/freecibilscore and never claims a report was fetched.
- Local storage is not encrypted by this app. Use a device lock and do not use shared/public devices for sensitive records.
- Test checklist is in `TESTING.md`. JavaScript syntax and ZIP integrity are checked when the ZIP is built; actual Android/GitHub Pages behavior still needs device verification.
