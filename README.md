# BungOiAnGi

Ung dung Vite cho khach hang va quan tri vien. Dang nhap/dang ky dung Supabase Auth; cac API quan tri va dong bo mon an van dung JSON Server.

## Chay local

1. Cai dependency: `npm install`
2. Tao `.env` tu `.env.example`, dien `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY`.
3. Chay ca API va giao dien: `npm run dev:all`
4. Mo dia chi Vite hien trong terminal. API mac dinh chay tai `http://127.0.0.1:3000`.

Nguoi dung dang ky/ dang nhap bang Supabase Auth. API JSON Server can `ADMIN_PASSWORD` va `JWT_SECRET` rieng neu muon dung cac chuc nang quan tri.

## Cau hinh Supabase Auth

1. Tao project Supabase va bat Email trong Authentication > Providers.
2. Trong Authentication > URL Configuration, dat Site URL la domain Vercel production va them ca domain preview can dung vao Redirect URLs.
3. Them `VITE_SUPABASE_URL` va public anon/publishable key vao `.env` khi chay local va vao Vercel > Settings > Environment Variables cho production/preview.
4. Redeploy Vercel sau khi them bien moi. Neu xac minh email duoc bat, nguoi dung can bam lien ket trong email truoc khi dang nhap; co the doi URL xac nhan ve domain cua app.

Khong dua service-role key len frontend hoac Vercel environment variables co tien to `VITE_`.

## Vai tro va API

- Dang ky: `POST /register`. Server luon gan role `customer`, khong chap nhan client tu nang quyen.
- Dang nhap: `POST /login`.
- API protected di qua `/660/api/...`; JSON Server Auth xac thuc JWT, middleware server kiem tra role va owner.
- Customer: `GET/PATCH /660/api/me`, `GET/PUT /660/api/customer/favorites`, `GET/POST /660/api/customer/history`.
- Admin: `/660/api/admin/stats`, `/660/api/admin/dishes`, `/660/api/admin/users`.
- Mon an cong khai: `GET /api/dishes`.

Dang nhap/dang ky tren Vercel khong can Render; Supabase Auth xu ly tai khoan va phien dang nhap. `VITE_API_URL` chi dung neu muon ket noi API JSON Server cho du lieu mon an dong bo va chuc nang quan tri. Database local `server/db.json` bi ignore va khong duoc day len GitHub.

## Deploy Vercel

1. Import repository vao Vercel. Vercel tu nhan Vite; file `vercel.json` khai bao lenh build va thu muc output.
2. Cau hinh hai bien `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` trong Vercel, sau do redeploy.
3. De dung chuc nang Admin va dong bo mon an, tao Web Service rieng cho JSON Server va cau hinh `VITE_API_URL`; cac chuc nang nay khong duoc cung cap boi Supabase Auth.
4. Neu muon chon file anh trong Admin, dat Vercel environment variables `VITE_CLOUDINARY_CLOUD_NAME` va `VITE_CLOUDINARY_UPLOAD_PRESET`.

## Kiem thu cac luong bao mat va lien ket

- `npm test` kiem tra API Admin voi request an danh/tai khoan customer, tu choi quyen GPS, URL dich vu tren iOS/Android/PC va dang xuat khi JWT het han hoac API tra ve 401.
- GrabFood va ShopeeFood duoc mo bang HTTPS universal-link fallback. Viec he dieu hanh chuyen tiep sang app native phu thuoc app da cai va cau hinh universal/app links cua nha cung cap; can xac nhan them tren iPhone va Android that. Tren PC, link mo trang web dich vu.

## Cloudinary

Tao unsigned upload preset gioi han dinh dang va kich thuoc anh trong Cloudinary, sau do khai bao `VITE_CLOUDINARY_CLOUD_NAME` va `VITE_CLOUDINARY_UPLOAD_PRESET`. Khong dat API secret Cloudinary trong frontend.

## Gioi han

JSON Server Auth phu hop cho prototype/bai tap, khong thay the backend production. Khi deploy cong khai can HTTPS, rate limiting, email verification/reset, backup DB va quy trinh cap/thu hoi tai khoan admin.
