DPPCC OFFICIAL WEBSITE — FINAL FIXED PACKAGE

এই প্যাকেজটি একই GitHub Repository এবং একই Firebase Project-এর জন্য তৈরি।

এইবার যেসব সমস্যা ঠিক করা হয়েছে:
1. সব পেজে Menu সরাসরি HTML-এর মধ্যে আছে — JavaScript বন্ধ থাকলেও Menu দেখা যাবে।
2. সব পেজে Club Logo সরাসরি HTML-এ আছে। Home Page-এর Hero Logo আগের মতোই রাখা হয়েছে (Desktop-এ সর্বোচ্চ 320px, Mobile-এ 220px)।
3. CSS ও JavaScript-এর সঠিক ফোল্ডার/পাথ দেওয়া হয়েছে: css/style.css এবং js/app.js।
4. Owner, Admin, Captain ও Manager-এর আলাদা Dashboard এবং Role যাচাই ঠিক করা হয়েছে।
5. Player, Match ও News Edit; Owner-only Delete; Live Score; Registration Review; Jersey Order Status; Staff Access এবং Owner Backup যুক্ত আছে।
6. Club Established Year 2026। 2003 শুধু Sponsor branding-এ আছে।

গুরুত্বপূর্ণ — ছবি ও Firebase:
- তোমার GitHub Repository-র assets ফোল্ডারে থাকা এই দুটি আগের ছবি অপরিবর্তিত রাখবে:
  assets/dppcc-club-logo.jpg
  assets/dppcc-sponsor-2003.jpg
- এই ZIP-এ assets ফোল্ডার রাখা হয়নি, যাতে আগের ছবিগুলো ভুল করে Replace/Delete না হয়।
- Firebase Project: dppcc-official — আগেরটাই ব্যবহার করা হয়েছে।
- Firestore Collections: players, matches, registrations, jerseyOrders, staff, liveScores, news — আগের নামই রাখা হয়েছে।
- আগের Published Firestore Rules পরিবর্তন করার দরকার নেই। এই প্যাকেজের জন্য নতুন Rules Publish করবে না।
- Firebase Authentication-এর Owner/Admin/Captain/Manager account বা password এই কোডে রাখা হয়নি।

GitHub-এ ফাইল বসানোর নিয়ম:
- ZIP Extract করলে index.html, অন্য HTML পেজ, css ফোল্ডার, js ফোল্ডার এবং এই README পাওয়া যাবে।
- GitHub Repository-র মূল জায়গায় (যেখানে বর্তমান index.html আছে) Extract করা সব ফাইল/ফোল্ডার Upload করবে।
- DPPCC_FINAL নামে আলাদা Folder-এর ভিতরে সব ফাইল রেখে দেবে না। index.html অবশ্যই Repository-র মূল জায়গায় থাকতে হবে।
- আগের assets ফোল্ডার এবং Firestore Rules file মুছবে না।
- পুরোনো root-level style.css থাকলে সেটি থাকলেও সমস্যা নেই; নতুন পেজগুলো css/style.css ব্যবহার করবে।

এই প্যাকেজে আছে:
index.html, about.html, players.html, register.html, jersey.html, matches.html,
news.html, sponsor.html, login.html, owner.html, admin.html, captain.html,
manager.html, css/style.css, js/app.js
