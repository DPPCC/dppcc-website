DPPCC WEBSITE — PUBLISH PACKAGE
================================
This package contains the complete static front-end source for GitHub Pages:
- 19 HTML pages (including home, players, match centre, news, gallery, dashboards)
- styles.css and app.js
- Firebase config template and starter Firestore rules
- asset folder placeholders

PUBLISH:
1. Extract this ZIP.
2. Upload the CONTENTS of this folder to the ROOT of the GitHub repository (main branch).
3. Keep your existing assets/ and images/players/ folders. Do not overwrite them with empty folders.
4. Make sure your real images are named:
   assets/dppcc-club-logo.jpg
   assets/dppcc-sponsor-2003.jpg
   Player portraits remain in images/players/.
5. GitHub Settings > Pages > Deploy from branch > main > /(root).
6. Open https://dppcc.github.io/dppcc-website/ after deployment.

IMPORTANT:
This publishes the static website pages. Firebase Authentication, database saving, secure role-based dashboards, registration submission, jersey orders and image uploads are NOT connected/working yet. The Firebase config is only a placeholder; Firestore rules are starter rules and must be reviewed/tested before production. Do not claim private dashboard security until server-side authorization is implemented.
No real player names, match scores, news, rankings or awards are invented.
Men's cricket only. Club establishment year is 2026. Sponsor is shown only by logo; 2003 is sponsor branding only.
