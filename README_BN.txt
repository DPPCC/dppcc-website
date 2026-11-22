DPPCC WEBSITE UPDATE – INSTALLATION

এই ZIP-এ আলাদা আলাদা পেজ দেওয়া হয়েছে। একই GitHub repository-তে পুরোনো index.html এবং সংশ্লিষ্ট পুরোনো HTML ফাইলগুলো replace করে ZIP-এর সব ফাইল upload করুন। css এবং js folder-সহ upload করতে হবে। assets folder-এ আগের logo ও sponsor image রাখবেন।

গুরুত্বপূর্ণ: assets/dppcc-club-logo.jpg এবং assets/dppcc-sponsor-2003.jpg আগের repository থেকে assets folder-এ রেখে দিন। ZIP-এ image file নেই।

Firebase project: dppcc-official (আগেরটাই)। Firestore collection names: players, matches, registrations, jerseyOrders, staff, liveScores, news. আগের Firestore Rules অপরিবর্তিত রাখুন।

Staff login: login.html. Role অনুযায়ী owner.html, admin.html, captain.html, manager.html-এ যাবে। Owner email code-এ mdshiponahmed0455@gmail.com। Staff account Firebase Authentication-এ আগে তৈরি থাকতে হবে; Owner Dashboard থেকে role assign করতে হবে।

নোট: Firebase Rules আগের মতো role-based access বজায় রাখে। এই package-এ public data read, public registration/order submission, এবং dashboard actions আগের collection schema অনুসারে করা হয়েছে। GitHub-এ publish করার আগে test করুন।
