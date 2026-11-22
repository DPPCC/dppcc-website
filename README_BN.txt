DPPCC HOMEPAGE FIX — বাংলা নির্দেশনা

এই প্যাকেজে আছে:
1. index.html — নতুন হোমপেজ
2. styles.css — responsive design
3. app.js — মোবাইল মেনু এবং হোমপেজের তথ্য দেখানোর JavaScript

GitHub-এ বসানোর নিয়ম:
1. ZIP Extract করুন।
2. GitHub repository-এর মূল জায়গায় (root) যান।
3. Add file → Upload files চাপুন।
4. এই প্যাকেজের index.html, styles.css, app.js — তিনটি ফাইল একসঙ্গে আপলোড করুন।
5. আগের index.html ও styles.css থাকলে GitHub Replace/overwrite করতে বললে সেটি নিশ্চিত করুন।
6. Commit changes চাপুন।

গুরুত্বপূর্ণ:
- assets/dppcc-club-logo.jpg এবং assets/dppcc-sponsor-2003.jpg আগের মতো repository-তে রাখবেন।
- images/players ফোল্ডার মুছবেন না।
- মেনুতে About, Players, Matches, News, Gallery, Contact, Staff Login লিংক আছে। সংশ্লিষ্ট HTML পেজগুলো repository-তে থাকতে হবে।
- প্রতিষ্ঠার বছর 2026 রাখা হয়েছে। Sponsor logo-র 2003-কে প্রতিষ্ঠার বছর বলা হয়নি।
- স্পনসরের নাম টেক্সট হিসেবে দেখানো হয়নি; শুধু sponsor logo দেখানোর ব্যবস্থা আছে।
- খেলোয়াড়ের নাম/ছবি, আসল নিউজ, ম্যাচের ফলাফল এবং YouTube ভিডিও ID না পাওয়া পর্যন্ত কোনো বাস্তব তথ্য বানিয়ে দেওয়া হয়নি।

খেলোয়াড় যোগ করা:
app.js খুলে PLAYERS তালিকায় এই ফরম্যাটে তথ্য দিন:
{ name: "খেলোয়াড়ের নাম", role: "Batter", photo: "images/players/player-01.jpg", number: "07" }

YouTube ভিডিও যোগ করা:
app.js-এ YOUTUBE_VIDEO_ID = "" এর ভেতরে YouTube URL-এর 11 অক্ষরের video ID বসান।
উদাহরণ: https://www.youtube.com/watch?v=abcdefghijk হলে ID হলো abcdefghijk।

নিউজ/ম্যাচ:
app.js-এর NEWS এবং MATCHES তালিকায় শুধু নিশ্চিত তথ্য যোগ করবেন।

নিরাপত্তা ও Firebase:
এই তিনটি ফাইল হোমপেজের UI ও menu ঠিক করে। এগুলো Firebase Authentication, Firestore, Storage বা dashboard security rules-এর বিকল্প নয়। Firebase config বা Security Rules এই প্যাকেজে পরিবর্তন করা হয়নি।
