DPPCC OFFICIAL WEBSITE — FINAL PROJECT PACKAGE

প্রজেক্টে আছে: Home, About, Players, Registration, Jersey Order, Match Centre, News, Gallery, Contact, Staff Login, Owner, Admin, Manager ও Captain dashboard।

ব্র্যান্ডিং: Club established 2026। Sponsor logo-র 2003 বছরটি ক্লাবের প্রতিষ্ঠাবর্ষ নয়। Sponsor-এর নাম টেক্সট হিসেবে দেখানো হয় না; শুধু logo image দেখানো হয়।

গুরুত্বপূর্ণ পুরোনো ছবি: আগের GitHub repository-তে থাকা এই ফাইলগুলো অক্ষত রাখুন এবং নতুন ZIP আপলোডের সময় assets ফোল্ডার মুছবেন না:
- assets/dppcc-club-logo.jpg
- assets/dppcc-sponsor-2003.jpg

PLAYER PHOTO: Registration form-এ JPG/PNG/WEBP, সর্বোচ্চ 5MB ছবি আবশ্যক। Preview ও Players list-এ 7:9 passport-style crop ব্যবহার হয়। Manager application approve করলে private application photo-র download URL approved public player profile-এ যুক্ত হয়; অনুমোদনের আগে photo read শুধু authorized staff করতে পারে।

FIREBASE CONFIG (অবশ্যই করতে হবে):
1. Firebase Console → Project settings → General → Your apps → Web app config নিন।
2. firebase-config.js খুলে apiKey, authDomain, projectId, storageBucket (Firebase Console-এ দেখানো হুবহু value), messagingSenderId, appId বসান।
3. Firebase Console-এ Authentication → Sign-in method → Email/Password enable করুন।
4. Firestore Database এবং Storage চালু করুন।
5. Firebase Console-এ firestore.rules-এর সব কোড Firestore Rules-এ publish করুন।
6. storage.rules-এর সব কোড Storage Rules-এ publish করুন।

OWNER EMAIL: বর্তমান GitHub repository-র DPPCC_FIRESTORE_RULES_REFERENCE.txt-এ Owner email হিসেবে mdshiponahmed0455@gmail.com দেওয়া আছে; এই প্যাকেজে সেটিই রাখা হয়েছে। আগের Staff Access পেজে shiponahmed5710@gmail.com-কে Admin দেখানো হয়েছিল—সেই account-টি Owner Dashboard থেকে Admin role পাবে, Owner নয়। Firebase Authentication-এ Owner email-এর account থাকতে হবে। যদি Owner account অন্য email হয়, firebase-config.js এবং firestore.rules/storage.rules-এ একই owner email পরিবর্তন করতে হবে।

STAFF ACCOUNT: Firebase Authentication → Add user দিয়ে প্রথমে Admin/Manager/Captain-এর email/password account তৈরি করুন। এরপর Owner dashboard → Staff account roles থেকে একই email-কে role দিন। Dashboard থেকে নতুন Firebase Auth user/password তৈরি করা হয় না।

GITHUB PAGES: সব HTML, CSS, JS, rules, config এবং assets folder repository root-এ রাখুন। GitHub Pages শুধু static hosting করে; Firebase Firestore/Storage আলাদাভাবে Firebase Console-এ configure করতে হবে। Firebase Hosting-এ deploy করতে Firebase CLI দিয়ে `firebase deploy --only hosting,firestore:rules,storage` চালান।

SECURITY NOTES:
- firebase-config.js-এর Firebase web config public client config; এখানে service account private key/API secret দেবেন না।
- Firestore/Storage rules হলো প্রকৃত access control; শুধু dashboard URL গোপন রাখা নিরাপত্তা নয়।
- Public registration create করা যায়, কিন্তু submissions শুধু active Admin/Manager/Owner দেখতে পারে। Registration photo read private staff roles-এ সীমাবদ্ধ।
- Auto email notification এই প্যাকেজে নেই। Forms Firebase-এ save হয়; email alert চাইলে আলাদা Cloud Function/Email extension লাগবে। Production public forms চালুর আগে Firebase App Check চালু করার পরামর্শ দেওয়া হচ্ছে।

TESTING: HTML parse, JavaScript syntax, JSON config এবং ZIP integrity স্থানীয়ভাবে যাচাই করা হবে। Firebase config ও live project credentials ছাড়া বাস্তব Firebase login/upload/security deployment test করা যায় না।
