# FREEDOM
Offline-first finance PWA. Upload all files (keep icons/ folder) to a GitHub repo, enable Pages (main, root), open the URL in Chrome on Android, then Menu > Install app.
- Data: localStorage key `freedom-finance-data-v1` (never cleared by updates). Back up via More > Backup.
- Updates: bump `V` in service-worker.js to ship new versions; network-first fetching avoids stale code.
- CIBIL: not connected. Set `CIBIL_API` in script.js only when you have an authorized provider endpoint returning verified JSON (score 300-900).
