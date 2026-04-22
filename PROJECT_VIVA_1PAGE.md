# CampusConnect — 1‑Page Viva Rapid Revision

## 1) 15‑second intro (say this first)
CampusConnect is a **MERN** mini project: a campus social app where users **register/login (JWT)**, create **posts** (text or image), **like/comment/save**, manage **profile + photo**, **follow/unfollow**, and receive **notifications**.

---

## 2) Problem + why this project
- **Problem:** students need a focused place to share updates and interact inside campus.
- **Why:** to learn end‑to‑end full stack: **React UI + API integration + Express routes + MongoDB schemas + auth + uploads**.

---

## 3) Tech stack (examiner keywords)
- **Frontend:** React (Vite), React Router, Axios, Tailwind, Framer Motion
- **Backend:** Node.js, Express, Mongoose, JWT (`jsonwebtoken`), bcrypt (`bcryptjs`), multer, CORS, dotenv
- **DB:** MongoDB

---

## 4) Architecture in one diagram (memorize)
React pages/components  
→ `client/src/api.js` (Axios + token)  
→ Express API (`server/index.js`)  
→ `authMiddleware` verifies JWT (`server/middleware/auth.js`)  
→ Mongoose models (`server/models/*`)  
→ MongoDB

Uploads: React `FormData` → `POST /upload/*` (multer) → stored under `server/uploads/*` → public URL via `/uploads/...`

---

## 5) Auth flow (most asked)
### Login/Register (frontend)
- `client/src/pages/Login.jsx`: `POST /login` → store `token` + `user` in localStorage → navigate `/`
- `client/src/pages/Register.jsx`: `POST /register` → store `token` + `user` → navigate `/`

### Token sending
- `client/src/api.js` interceptor adds `Authorization: Bearer <token>` to every request.

### Backend verification
- `server/middleware/auth.js` checks header, verifies JWT, sets `req.userId`.

### UI protection
- `client/src/App.jsx` `PrivateRoute` redirects to `/login` if token missing.

**Best viva line:** Frontend protection is for UX; **real security is backend middleware**.

---

## 6) Most important APIs (method + purpose)
### Auth/User
- `POST /register` → create user + return JWT
- `POST /login` → verify credentials + return JWT
- `GET /me` or `GET /users/me` → current user
- `PUT /users/profile` → update name/bio/profile pic URL
- `POST /upload/profile` → upload profile image (multer)
- `PUT /users/profile-photo` → store uploaded profile image URL
- `POST /users/follow/:id` → toggle follow/unfollow
- `GET /users/:id` → view a user profile

### Posts (CRUD)
- **Create:** `POST /post` (auth required)
- **Read (feed):** `GET /posts`
- **Read (single):** `GET /posts/:id`
- **Update:** `PUT /posts/:id` (only author)
- **Delete:** `DELETE /posts/:id` (only author)

### Social interactions
- `POST /like` (toggle like by postId)
- `POST /comment` (create comment)
- `POST /posts/:id/save` (toggle save)
- `GET /notifications`, `PUT /notifications/read`
- `GET /search?q=`, `GET /trending`

---

## 7) DB schemas (1‑line each)
- `User`: name/email/password(hash) + bio + avatar/profilePic + followers/following + savedPosts
- `Post`: text/caption + author ref + likes[] + imageUrl
- `Comment`: text + post ref + author ref
- `Notification`: recipient + actor + type(like/comment/follow) + post/comment refs + isRead

---

## 8) Security points (say confidently)
- Passwords hashed with **bcrypt**
- JWT middleware verifies tokens on protected routes
- Authorization: edit/delete only if `post.author === req.userId`
- Upload checks: mimetype `image/*` + size limit 5MB (backend) + type/size validation (frontend)
- Search escapes regex special chars before building RegExp

---

## 9) Error handling pattern (simple)
- Backend routes use `try/catch` and return status codes (`400/401/403/404/500`) + JSON `{message}`
- Frontend catches errors, shows message + toast

---

## 10) Deployment (what you can honestly claim from repo)
- Dev: Vite `5173`, Express `5174`, Vite proxy `/api → 5174`
- Needs env: `MONGODB_URI`, `JWT_SECRET`, optional `PUBLIC_BASE_URL`
- No Docker/CI/CD configs in repo (say as “future improvement”)

---

## 11) Weak points teacher may catch (be ready)
- Backend is mostly in one file (`server/index.js`) → needs route/controller split
- Token stored in localStorage (XSS risk discussion)
- No schema validation library and no tests
- Local disk storage for uploads (not cloud‑ready)
- No rate limiting on auth endpoints

---

## 12) 60‑second quick speech (short version)
My project CampusConnect is a MERN campus social app. Users authenticate using JWT, then create posts with text/images, like/comment/save, manage profile, follow others, and receive notifications. Frontend uses React Router with private routes and Axios interceptor for token headers. Backend uses Express + Mongoose with MongoDB schemas for User/Post/Comment/Notification, and middleware verifies JWT. I also implemented file uploads using multer with type and size limits. If I improve it further, I’ll modularize backend, add validation, tests, pagination, and production deployment practices.

