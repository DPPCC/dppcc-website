DPPCC WEBSITE — FINAL SOURCE PACKAGE (বাংলা নির্দেশনা)

১৫টি আলাদা HTML পেজ: index, about, players, registration, jersey, matches, news, gallery, contact, staff, login, owner, admin, manager, captain।

গুরুত্বপূর্ণ ব্র্যান্ডিং: Club Established 2026. Sponsor-এর নাম কোনো টেক্সট হিসেবে দেখানো হয় না; sponsor logo image path assets/dppcc-sponsor-2003.jpg। Club logo assets/dppcc-club-logo.jpg। আপনার আগের GitHub assets/ এবং images/players/ ফোল্ডার এই প্যাকেজের .gitkeep দিয়ে overwrite করবেন না; আগের আসল ছবি সংরক্ষণ করে ফোল্ডার merge করবেন।

GitHub Pages: Settings > Pages > Deploy from branch > main > /(root)। সব HTML, CSS, JS, Firebase config, rules এবং firebase.json Repository Root-এ রাখুন।

Firebase Project: dppcc-official. Web App configuration firebase-config.js-এ আগের কথোপকথনে দেওয়া তথ্য থেকে রাখা হয়েছে। Web API key browser-এ দৃশ্যমান হওয়া স্বাভাবিক; নিরাপত্তা Firestore/Storage Rules দিয়ে প্রয়োগ হয়। Firebase Console-এ Project Settings-এর Web App config-এর সঙ্গে মিলিয়ে নেবেন।

Firebase setup checklist:
1) Authentication > Sign-in method > Email/Password enable করুন।
2) Firestore Database চালু রাখুন (আগের তথ্য অনুযায়ী asia-south1)।
3) Storage bucket চালু/তৈরি করুন এবং firebase-config.js-এর storageBucket-এর সঙ্গে মিলিয়ে নিন।
4) Authentication > Settings > Authorized domains-এ dppcc.github.io যোগ করুন।
5) firestore.rules সম্পূর্ণ কপি করে Firestore Rules-এ Publish করুন।
6) storage.rules সম্পূর্ণ কপি করে Storage Rules-এ Publish করুন।
7) Owner account: mdshiponahmed0455@gmail.com; Admin account: shiponahmed5710@gmail.com — এই ইমেইল দিয়ে Firebase Authentication-এ account থাকতে হবে।
8) Manager/Captain: Authentication user UID অনুযায়ী staff collection-এ document তৈরি করুন; role field manager বা captain দিন। staff role document কেবল Owner তৈরি/পরিবর্তন করতে পারবেন।

ফাংশন: Player Registration photo Firebase Storage-এ upload এবং Firestore registrations collection-এ pending আবেদন তৈরি করে। Manager/উচ্চতর অনুমোদন করলে players collection-এ approved profile তৈরি হয়। Jersey order Firestore-এ জমা হয়। Public website approved player, matches, news, gallery দেখায়। Manager/উচ্চতর news/gallery পরিচালনা করতে পারে; Captain/উচ্চতর match পরিচালনা করতে পারে। Dashboard-এ Registration approval এবং submission list আছে।

সীমাবদ্ধতা ও নিরাপত্তা নোট: GitHub Pages static hosting; Cloud Functions/Email extension ছাড়া email notification পাঠানো হয় না। Public registration endpoint-এ spam/abuse কমাতে Firebase App Check ও rate-limiting/Cloud Function পরবর্তীতে যোগ করুন। Firebase live project-এ publish/test না করা পর্যন্ত authentication, Storage bucket, Firestore/Storage rules live কার্যকর হয়েছে বলে ধরে নেবেন না। Rules publish করার পর owner/admin account দিয়ে পরীক্ষা করুন।

Demo: index.html। Firebase config অনুপস্থিত/নিষ্ক্রিয় থাকলে data form submit হবে না; এটি নিরাপদ failure state।
