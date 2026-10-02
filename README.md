# BungOiAnGi

Ung dung Vite cho khach hang va quan tri vien. Dang nhap, du lieu mon an va chuc nang Admin dung Supabase.

## Chay local

1. Cai dependency: `npm install`
2. Tao `.env` tu `.env.example`, dien `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY`.
3. Chay giao dien: `npm run dev`
4. Mo dia chi Vite hien trong terminal.

Nguoi dung dang ky/dang nhap bang Supabase Auth.

## Cau hinh Supabase Auth

1. Tao project Supabase va bat Email trong Authentication > Providers.
2. Trong Authentication > URL Configuration, dat Site URL la domain Vercel production va them ca domain preview can dung vao Redirect URLs.
3. Them `VITE_SUPABASE_URL` va public anon/publishable key vao `.env` khi chay local va vao Vercel > Settings > Environment Variables cho production/preview.
4. Redeploy Vercel sau khi them bien moi. Neu xac minh email duoc bat, nguoi dung can bam lien ket trong email truoc khi dang nhap; co the doi URL xac nhan ve domain cua app.

Khong dua service-role key len frontend hoac Vercel environment variables co tien to `VITE_`.

## Chuyen Admin va du lieu sang Supabase

1. Trong Supabase SQL Editor, chay toan bo migration `supabase/migrations/20261002000000_admin_platform.sql`.
2. Dang ky tai khoan cua ban tren app va xac nhan email neu Supabase yeu cau.
3. Trong SQL Editor, thay email ben duoi bang email tai khoan cua ban de cap quyen admin dau tien:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('your-email@example.com');
   ```

   Xac nhan truy van cap nhat dung 1 dong. Dang xuat roi dang nhap lai de app tai vai tro moi.
4. Cai Supabase CLI, chay `supabase login`, sau do link project:

   ```powershell
   supabase link --project-ref wmofneummcpxyddupnyt
   supabase functions deploy admin-users
   ```

   Function nay tu xac thuc access token bang Supabase Auth va kiem tra vai tro admin, vi vay `supabase/config.toml` tat lop xac thuc JWT tai gateway chi cho `admin-users`. Khong tat kiem tra token ben trong function.
   Supabase Edge Function dung `SUPABASE_SERVICE_ROLE_KEY` chi tren server de tao/xoa Auth user. Khong them khoa nay vao Vercel hay frontend.
   Xac nhan function da duoc tao tai Supabase > Edge Functions voi ten `admin-users` va trang thai da deploy truoc khi thu tao/xoa user.
5. Tren Vercel, khai bao `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY`, sau do deploy commit moi nhat.

Migration tao bang profile, dishes, favorites va history. RLS ngan khach thuong sua mon/quan ly tai khoan; admin dashboard se tu nap danh sach mon mac dinh neu bang `dishes` rong.

## Deploy Vercel

1. Import repository vao Vercel. Vercel tu nhan Vite; file `vercel.json` khai bao lenh build va thu muc output.
2. Cau hinh `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` trong Vercel.
3. Neu muon chon file anh trong Admin, dat `VITE_CLOUDINARY_CLOUD_NAME` va `VITE_CLOUDINARY_UPLOAD_PRESET`.

## Kiem thu cac luong bao mat va lien ket

- `npm test` kiem tra phan quyen API local, tu choi quyen GPS, URL dich vu tren iOS/Android/PC va dang xuat khi JWT het han.
- GrabFood va ShopeeFood duoc mo bang HTTPS universal-link fallback. Viec he dieu hanh chuyen tiep sang app native phu thuoc app da cai va cau hinh universal/app links cua nha cung cap; can xac nhan them tren iPhone va Android that. Tren PC, link mo trang web dich vu.

## Cloudinary

Tao unsigned upload preset gioi han dinh dang va kich thuoc anh trong Cloudinary, sau do khai bao `VITE_CLOUDINARY_CLOUD_NAME` va `VITE_CLOUDINARY_UPLOAD_PRESET`. Khong dat API secret Cloudinary trong frontend.

## Gioi han

Chuc nang tao/xoa Auth user trong Admin can deploy Supabase Edge Function `admin-users`. Khong bao gio dua service-role key vao frontend. Khi deploy cong khai can email verification, backup DB va quy trinh cap/thu hoi tai khoan admin.
