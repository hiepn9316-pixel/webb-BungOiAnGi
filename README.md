# BungOiAnGi

Ung dung Vite cho khach hang va quan tri vien, voi API JSON Server Auth.

## Chay local

1. Cai dependency: `npm install`
2. Tao `.env` tu `.env.example`, sau do doi `ADMIN_PASSWORD` va `JWT_SECRET`.
3. Chay ca API va giao dien: `npm run dev:all`
4. Mo dia chi Vite hien trong terminal. API mac dinh chay tai `http://127.0.0.1:3000`.

Tai khoan admin duoc tao lan dau khi API khoi dong. Neu DB da ton tai, hay xoa DB local khi can seed lai admin; file `server/db.json` khong duoc commit.

## Vai tro va API

- Dang ky: `POST /register`. Server luon gan role `customer`, khong chap nhan client tu nang quyen.
- Dang nhap: `POST /login`.
- API protected di qua `/660/api/...`; JSON Server Auth xac thuc JWT, middleware server kiem tra role va owner.
- Customer: `GET/PATCH /660/api/me`, `GET/PUT /660/api/customer/favorites`, `GET/POST /660/api/customer/history`.
- Admin: `/660/api/admin/stats`, `/660/api/admin/dishes`, `/660/api/admin/users`.
- Mon an cong khai: `GET /api/dishes`.

Frontend co the tro toi API host rieng bang `VITE_API_URL`. De dong bo du lieu giua thiet bi, deploy API va DB tren host co persistent storage; JSON Server local chi luu vao file may dang chay.

## Kiem thu cac luong bao mat va lien ket

- `npm test` kiem tra API Admin voi request an danh/tai khoan customer, tu choi quyen GPS, URL dich vu tren iOS/Android/PC va dang xuat khi JWT het han hoac API tra ve 401.
- GrabFood va ShopeeFood duoc mo bang HTTPS universal-link fallback. Viec he dieu hanh chuyen tiep sang app native phu thuoc app da cai va cau hinh universal/app links cua nha cung cap; can xac nhan them tren iPhone va Android that. Tren PC, link mo trang web dich vu.

## Cloudinary

Tao unsigned upload preset gioi han dinh dang va kich thuoc anh trong Cloudinary, sau do khai bao `VITE_CLOUDINARY_CLOUD_NAME` va `VITE_CLOUDINARY_UPLOAD_PRESET`. Khong dat API secret Cloudinary trong frontend.

## Gioi han

JSON Server Auth phu hop cho prototype/bai tap, khong thay the backend production. Khi deploy cong khai can HTTPS, rate limiting, email verification/reset, backup DB va quy trinh cap/thu hoi tai khoan admin.
