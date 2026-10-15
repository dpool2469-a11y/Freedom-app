# FREEDOM
Offline-first finance PWA. Upload all files (keep icons/ folder) to a GitHub repo, enable Pages (main, root), open the URL in Chrome on Android, then Menu > Install app.
- Data: localStorage key `freedom-finance-data-v1` (never cleared by updates). Back up via More > Backup.
- Updates: bump `V` in service-worker.js to ship new versions; network-first fetching avoids stale code.
- CIBIL: not connected. Set `CIBIL_API` in script.js only when you have an authorized provider endpoint returning verified JSON (score 300-900).
- Tessa chat: works offline with built-in rules and your own data. To use a real AI, set `TESSA_API` in script.js to your own backend URL (POST {messages} -> {reply}); never put an API key in the app.
- Gemini: in the app open Tessa, tap `⚙ AI`, paste your own key from aistudio.google.com/apikey. The key is stored only on your device (not in GitHub, not in backups). Default model is `gemini-flash-latest`; change it in the same dialog if Google renames models. 'Share my FREEDOM numbers' is off by default.
