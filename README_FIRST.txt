DPPCC FINAL CODE PACKAGE

Files:
- index.html: complete single-file public website and Owner/Admin/Captain/Manager dashboard.
- DPPCC_FIRESTORE_RULES_FINAL.txt: matching Firestore Security Rules.

Important:
1. Keep your existing GitHub repository and Firebase project.
2. Do not delete Firestore data, Authentication users, or the assets folder.
3. The index.html uses these existing image paths:
   assets/dppcc-club-logo.jpg
   assets/dppcc-sponsor-2003.jpg
4. Replace the repository's root index.html only if you want to refresh the website source.
5. In Firebase Console > Firestore Database > Rules, replace the entire Rules editor content with the complete contents of DPPCC_FIRESTORE_RULES_FINAL.txt, then Publish.
6. Staff Firebase Authentication accounts must already exist. Owner assigns their roles in the website's Staff Account & Role Management panel.
7. Staff role documents use lowercase email addresses as document IDs, matching the website source.
8. Owner email: mdshiponahmed0455@gmail.com
9. Admin email: shiponahmed5710@gmail.com (must be created in Firebase Authentication and assigned Admin role by Owner).
10. Test public registration, jersey order, and each role after publishing.

Role permissions:
Owner: full control, staff management, delete, backup, all operations.
Admin: players, matches, live score, news, registrations, jersey orders.
Captain: players, matches, live score.
Manager: matches, registrations, jersey orders.

Security:
- Public can read public club data and submit the two public forms only.
- Staff can read only their own role document.
- Only Owner can list/change staff roles and delete records.
- Passwords are never stored in website code or Firestore.
