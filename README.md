# Allura — Personalized Gift Platform

MVP React + Node.js/Express dựng theo SRS và bộ mockup Allura.

## Chạy local

```bash
npm install
npm run dev
```

- Web: `http://localhost:5173`
- API demo: `http://localhost:3001/api/health`
- NFC demo: `http://localhost:5173/n/demo`

Hiện API dùng dữ liệu demo để có thể kiểm tra toàn bộ flow trước khi cung cấp Supabase env. Khi nối database, thay các route demo trong `server.js` bằng Supabase client/repository; UI không cần đổi.

## Route chính

- `/` hoặc `/gioi-thieu`: landing page
- `/huong-dan`: hướng dẫn Sender/Receiver
- `/dang-nhap`, `/dang-ky`: auth UI
- `/thiet-lap-mon-qua`: setup gift UI
- `/nhac-thu-gian`: music library
- `/n/:token`: receiver verification + gift experience

## Supabase mapping dự kiến

`auth.users` + `profiles`, `lamps`, `gift_contents`, `voice_files`, `music_moods`, `music`.

SQL migration đầy đủ nằm tại `supabase/migrations/001_initial_schema.sql`. Có thể copy toàn bộ file vào Supabase SQL Editor và bấm Run.

Voice nên để trong private Storage bucket và chỉ trả signed URL có thời hạn sau receiver session hợp lệ. `nfc_token` cần unique index; receiver verification cần normalize email và không trả lộ email thật khi thất bại.
