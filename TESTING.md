# FREEDOM verification checklist

## Automated checks performed for this package
- `node --check script.js` — syntax check.
- ZIP archive integrity check (`unzip -t`).
- File inventory check for the required PWA files and icons.

## Manual acceptance tests to perform after publishing
- [ ] Add ₹2,00,000 assets and ₹80,000 debt; home net worth should show ₹1,20,000.
- [ ] Add, edit, delete an asset; totals should update and records should survive reload.
- [ ] Add a debt with original balance ₹5,00,000 and current balance ₹3,00,000; payoff progress should show 40% cleared.
- [ ] Record a partial debt repayment; outstanding balance, debt progress and net worth should update.
- [ ] Add a savings goal and change current saved amount; progress and estimate should update.
- [ ] Add an investment with ₹10,000 invested and ₹12,000 current value; gain should show ₹2,000 / 20%.
- [ ] Record income and expenses; monthly totals and savings rate should update. Internal transfers should not be recorded as income/expense.
- [ ] Add a category budget and matching expense; budget usage should update.
- [ ] Export JSON, add a test record, restore the backup after confirmation; previous backed-up state should return.
- [ ] Check navigation buttons, swipe navigation, forms, modal close, invalid values and delete confirmation on Android.
- [ ] Verify CIBIL page clearly states no verified score is available until an authorized integration is configured.
- [ ] Install PWA, reload while online and test previously cached app shell while offline.

The manual acceptance checklist is not marked complete by packaging alone.
