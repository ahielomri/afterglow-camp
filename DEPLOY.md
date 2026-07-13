# Afterglow - הפעלה עצמאית (בלי Claude)

זה פרויקט React רגיל. הלוגיקה של כל המערכת (משמרות, תקציב, חברים וכו') **לא השתנתה בכלל** - רק במקום שהנתונים נשמרים אצל Claude, הם נשמרים במסד נתונים אמיתי (Supabase) שבבעלותך.

---

## שלב 1: מסד נתונים (Supabase) - כ-5 דקות

1. כנס ל-**supabase.com** ולחץ "Start your project" (התחברות עם Google/GitHub, חינם)
2. "New project" - תן שם (למשל `afterglow`), בחר סיסמה למסד הנתונים (שמור אותה בצד), ואזור קרוב (Europe)
3. חכה כ-2 דקות שהפרויקט יוקם
4. בתפריט השמאלי: **SQL Editor** → **New query**
5. פתח את הקובץ `supabase-setup.sql` מהתיקייה הזו, העתק את כל התוכן, הדבק, ולחץ **Run**
6. בתפריט השמאלי: **Settings** → **API**
7. תעתיק שני דברים משם:
   - **Project URL** (נראה כמו `https://xxxxx.supabase.co`)
   - **anon public key** (מחרוזת ארוכה)

---

## שלב 2: חיבור המפתחות לפרויקט

1. בתיקיית הפרויקט, תעתיק את הקובץ `.env.example` ותשנה את השם ל-`.env`
2. תפתח אותו ותדביק את שני הערכים משלב 1:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=המפתח-הארוך-שהעתקת
   ```

---

## שלב 3: העלאה ל-GitHub

1. כנס ל-**github.com**, צור חשבון אם אין לך (חינם)
2. "New repository" - שם: `afterglow-camp`, השאר Private אם תרצה
3. בטרמינל/מחשב, בתוך תיקיית הפרויקט:
   ```
   git init
   git add .
   git commit -m "Afterglow camp app"
   git branch -M main
   git remote add origin https://github.com/USERNAME/afterglow-camp.git
   git push -u origin main
   ```
   (אם אין לך git מותקן, אפשר גם לגרור את כל הקבצים דרך ממשק GitHub באתר - "uploading an existing file")

**חשוב**: הקובץ `.env` לא יעלה ל-GitHub (זה בכוונה, מוגדר ב-`.gitignore`) - זה בסדר, נגדיר אותו בנפרד ב-Vercel בשלב הבא.

---

## שלב 4: פרסום (Vercel) - כ-3 דקות

1. כנס ל-**vercel.com**, לחץ "Sign Up", והתחבר **עם GitHub** (הכי פשוט)
2. "Add New" → "Project"
3. תבחר את ה-repository `afterglow-camp` שיצרת
4. לפני שלוחצים Deploy - תפתח "Environment Variables" ותוסיף את שני הערכים מהקובץ `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. לחץ **Deploy**
6. תוך דקה תקבל קישור אמיתי כמו `afterglow-camp.vercel.app` - **זה הקישור הקבוע, עצמאי, לא תלוי ב-Claude**

---

## מה קורה בעתיד

- כל שינוי עתידי בקוד: לוקחים את הקובץ המעודכן, מחליפים את `src/App.jsx`, עושים `git push` - Vercel מפרסם מחדש אוטומטית תוך דקה
- אין תחזוקה שוטפת - Supabase ו-Vercel מתופעלים לבד
- שני השירותים חינמיים בהיקף שימוש של קמפ (30 אנשים) בלי בעיה

## הוספה למסך הבית בנייד

עכשיו, בתור אתר עצמאי, זה גם ייראה קצת יותר "אפליקציה אמיתית" כשמוסיפים למסך הבית (הגדרתי את זה בקוד) - Safari/Chrome → שיתוף → הוסף למסך הבית.
