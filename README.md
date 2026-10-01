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

Frontend co the tro toi API host rieng bang `VITE_API_URL`. Database local `server/db.json` bi ignore va khong duoc day len GitHub. De chinh sua qua Admin tren GitHub Pages va giu thay doi, API phai chay rieng va `DATABASE_PATH` phai nam tren persistent storage.

## Deploy GitHub Pages va Render

1. Tao Web Service tu Blueprint `render.yaml` tren Render. Persistent Disk duoc mount tai `/var/data`, nen database dung `/var/data/db.json` va van con sau khi service restart/deploy.
2. Trong Render, dat `ADMIN_PASSWORD` thanh mat khau manh. Blueprint tao `JWT_SECRET` rieng. `CORS_ORIGINS` mac dinh gioi han den origin GitHub Pages cua repository nay; neu dung custom domain, cap nhat origin nay tren Render.
3. Cho Render deploy xong, copy URL service (vi du `https://bungoiangi-api.onrender.com`) va them GitHub Actions repository variable `VITE_API_URL` voi URL do, khong them dau `/` cuoi.
4. Trong Settings → Pages, chon source `GitHub Actions`. Workflow `.github/workflows/deploy-pages.yml` se build va deploy frontend khi push len branch `hiep`; co the chay lai bang `workflow_dispatch`.
5. Neu muon chon file anh trong Admin, them GitHub Actions repository variables `VITE_CLOUDINARY_CLOUD_NAME` va `VITE_CLOUDINARY_UPLOAD_PRESET`. Neu chi dan URL anh, bo qua buoc nay.
6. Doi frontend deploy xong, dang nhap Admin, sua anh va bam “Lưu món”. Tai lai trang hoac vao lai Admin de xac nhan URL anh van con tren API.

Render Persistent Disk can goi tra phi va chi gan voi mot service instance. Neu xoa disk/service, du lieu database tren disk co the mat; hay sao luu dinh ky.

## Kiem thu cac luong bao mat va lien ket

- `npm test` kiem tra API Admin voi request an danh/tai khoan customer, tu choi quyen GPS, URL dich vu tren iOS/Android/PC va dang xuat khi JWT het han hoac API tra ve 401.
- GrabFood va ShopeeFood duoc mo bang HTTPS universal-link fallback. Viec he dieu hanh chuyen tiep sang app native phu thuoc app da cai va cau hinh universal/app links cua nha cung cap; can xac nhan them tren iPhone va Android that. Tren PC, link mo trang web dich vu.

## Cloudinary

Tao unsigned upload preset gioi han dinh dang va kich thuoc anh trong Cloudinary, sau do khai bao `VITE_CLOUDINARY_CLOUD_NAME` va `VITE_CLOUDINARY_UPLOAD_PRESET`. Khong dat API secret Cloudinary trong frontend.

## Gioi han

JSON Server Auth phu hop cho prototype/bai tap, khong thay the backend production. Khi deploy cong khai can HTTPS, rate limiting, email verification/reset, backup DB va quy trinh cap/thu hoi tai khoan admin.
