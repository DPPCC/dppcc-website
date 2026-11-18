DPPCC WEBSITE DEMO — BANGLADESH-INSPIRED CRICKET CLUB STYLE

FILES
- index.html: the website
- assets/dppcc-club-logo.jpg: your original club logo
- assets/dppcc-sponsor-2003.jpg: your original sponsor image

PUBLISH FREE WITH GITHUB PAGES
1. Open https://github.com in Chrome and create/sign in to a free account.
2. Tap + > New repository. Name it: dppcc-website. Set Public and create it.
3. Upload index.html and the complete assets folder (keep the folder name exactly "assets").
   On GitHub mobile website, use Add file > Upload files. If selecting folders is difficult,
   upload the two image files into an assets folder using Add file > Create new file and
   create assets/.gitkeep first, then upload images into that folder.
4. Open repository Settings > Pages.
5. Under Build and deployment, choose Deploy from a branch; select main and /(root), then Save.
6. Wait a few minutes and open the published URL shown in Settings > Pages.
   It will look like https://YOUR-USERNAME.github.io/dppcc-website/

CONNECT REAL REGISTRATION AND JERSEY FORMS
1. On your phone open https://forms.google.com and create a blank form.
2. Registration form fields: Full name, Date of birth/age, Phone/WhatsApp, Playing role,
   Batting style, Bowling style, Previous team/experience, Address, Photo (optional).
3. Create another form for jersey orders: Full name, Phone/WhatsApp, Jersey size,
   Name to print, Jersey number, Quantity, Delivery/pickup details.
4. In each form, use Responses > Link to Sheets (or select a response destination) to save answers.
5. Copy each form's responder link.
6. Edit index.html in GitHub. Find REGISTRATION_FORM_URL and JERSEY_ORDER_FORM_URL near
   the bottom, paste the two links between the quotation marks, and save/commit.
7. Test both buttons from the live website.

DESIGN NOTE
- The layout uses a modern international cricket-team style with green/red accents inspired by Bangladesh cricket presentation.
- Your supplied DPPCC crest and black 2003 sponsor artwork are used as-is; they are not redrawn.

IMPORTANT
- This is a static demo. The registration/order buttons do not collect data until you connect
  your own Google Forms links.
- Do not publish players' private phone numbers, addresses, birth dates or personal photos
  without their permission. Keep form response Sheets private to club admins.
- Replace sample player names, fixture details, club history and contact email before launch.
- GitHub Pages sites from public repositories are publicly visible. Do not upload private data.
