# Inner Space Admin Dashboard (Starter)

This project is **only** for your admin dashboard.

## Step-by-step setup (non-technical)

### 1) Open your project folder in terminal

If you're already in this folder, skip this.

### 2) Install dependencies

```bash
npm install
```

### 3) Add your Supabase keys

1. In this project folder, create a new file named `.env.local`
2. Copy the content from `.env.example`
3. Paste your real Supabase values:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### 4) Exactly where to get these in Supabase

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click your project (example: **Inner Space**)
3. In the left sidebar, click **Project Settings**
4. Click **API**
5. Under **Project URL**, click the copy button and paste it into `VITE_SUPABASE_URL`
6. Under **Project API keys**, find **anon public**, click copy, and paste into `VITE_SUPABASE_ANON_KEY`

### 5) Start your admin dashboard

```bash
npm run dev
```

Then open the URL shown in terminal (usually `http://localhost:5173`).

## Notes

- This starter tries to read from a table called `profiles` to check if connection works.
- If your table names are different, we will adjust them in the next step.
