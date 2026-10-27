# Teacher Report Assistant

Build student report comments from shared comment banks. Runs on GitHub Pages with Firebase (Firestore) for the comment banks. Student names stay in the browser and are never saved.

## One-time setup

1. **Firebase project** — at [console.firebase.google.com](https://console.firebase.google.com) create a project (or reuse one).
2. **Firestore** — Build → Firestore Database → Create database (production mode). Then open the **Rules** tab, paste the contents of `firestore.rules`, and Publish.
3. **Web app config** — Project settings → General → Your apps → add a Web app (`</>`). Copy the config values into `src/firebase-config.js` and commit.
4. **GitHub Pages** — repo Settings → Pages → Source: **GitHub Actions**. Every push to `main` builds and publishes the site.

## Moving your Base44 comment banks

Firestore uses four collections with the same fields as the Base44 entities:

| Collection | Fields |
|---|---|
| `departments` | name, sort_order |
| `subjects` | name, department_id, report_type, mock_titles, skill_tabs |
| `comments` | subject_id, category, level, skill_tab, text, period, sort_order |
| `settings` | doc `logo` → value (image data URL) |

## Run locally

```
npm install
npm run dev
```
