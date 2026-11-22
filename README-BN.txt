DPPCC WEBSITE SOURCE PACKAGE — বাংলা নির্দেশনা

১৫টি আলাদা পেজ: index, about, players, registration, jersey, matches, news, gallery, contact, staff, login, owner, admin, manager, captain.

GitHub Pages: main branch / root থেকে publish করুন। সব ফাইল Repository-এর Root-এ রাখুন। assets/ ও images/players/ ফোল্ডার রাখুন। আগের আসল ছবি এই নামেই assets-এ রাখুন: dppcc-club-logo.jpg এবং dppcc-sponsor-2003.jpg। Sponsor-এর নাম কোনো টেক্সট হিসেবে দেখানো হয় না; শুধু logo image path আছে। Club established 2026.

Firebase config: firebase-config.js-এ আগের DPPCC Web App configuration বসানো আছে। Firebase Web API key browser-এ দৃশ্যমান হওয়া স্বাভাবিক; Security Rules-ই data access রক্ষা করে।

Firebase Console checklist:
1. Authentication > Sign-in method > Email/Password enable.
2. Firestore Database তৈরি/চালু রাখুন।
3. Storage bucket তৈরি/চালু রাখুন।
4. Authentication > Settings > Authorized domains-এ dppcc.github.io যোগ করুন।
5. firestore.rules সম্পূর্ণ copy করে Firestore Rules-এ Publish করুন।
6. storage.rules সম্পূর্ণ copy করে Storage Rules-এ Publish করুন।
7. President account: mdshiponahmed0455@gmail.com; Admin account: shiponahmed5710@gmail.com — Firebase Authentication-এ account থাকতে হবে।
8. Manager/Captain-এর Auth UID দিয়ে Firestore staff collection-এ document তৈরি করুন; field role = manager অথবা captain। Staff role document কেবল President তৈরি/পরিবর্তন করতে পারবেন।

Registration: player photo JPG/PNG/WEBP, maximum 5MB, 7:9 passport-style preview; image Firebase Storage-এ এবং application Firestore registrations collection-এ Pending হিসেবে জমা হয়। Jersey order jerseyOrders-এ Pending হিসেবে জমা হয়। Email notification স্বয়ংক্রিয় নয়; email sending-এর জন্য Cloud Function/Email Extension দরকার।

গুরুত্বপূর্ণ সীমাবদ্ধতা: Firebase project-এর live access ছাড়া deployed login/upload/rules test করা যায়নি। Dashboard-এ request list read-only; approval/edit interface, news editor, gallery uploader ও live scoring input এই package-এ নেই। Public photo upload-এ abuse প্রতিরোধে App Check/rate limiting/Cloud Function যোগ করা উচিত। Storage rules-এ file size/type সীমা আছে।

Demo: index.html খুলুন। অথবা computer-এ folder থেকে `python3 -m http.server 8000` চালিয়ে http://localhost:8000 খুলুন। Firebase connect না থাকলে empty/demo state দেখাবে।
