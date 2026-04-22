# CampusConnect — Mock Viva Q&A (30 High‑Probability Questions)

> Answers are based strictly on your codebase (Express + MongoDB + React).

---

## A) Project + architecture (1–8)

### 1) What is your project?
**Answer:** CampusConnect is a MERN mini project: a campus social app where users register/login using JWT and then create posts, like/comment/save, follow users, update profile (including profile photo upload), and see notifications.

### 2) What problem does it solve?
**Answer:** It provides a focused campus-level platform for students to share updates and interact through posts and basic social actions.

### 3) Why did you choose MERN stack?
**Answer:** It keeps JavaScript end-to-end (React + Node/Express), uses JSON naturally, and MongoDB fits social data like posts/comments/likes/follow lists.

### 4) Explain your overall architecture.
**Answer:** React UI calls APIs through Axios (`client/src/api.js`). Axios adds JWT in headers. Express routes in `server/index.js` verify JWT using `server/middleware/auth.js` and then use Mongoose models to read/write MongoDB.

### 5) Which files represent “frontend entry and routing”?
**Answer:** `client/src/App.jsx` defines routes and `PrivateRoute`. `client/src/main.jsx` initializes the app with router (and providers). `App.jsx` is the key viva file.

### 6) Where is your backend entry file?
**Answer:** `server/index.js`.

### 7) Where are your database schemas?
**Answer:** `server/models/User.js`, `server/models/Post.js`, `server/models/Comment.js`, `server/models/Notification.js`.

### 8) What is the most important function/idea in your backend?
**Answer:** JWT auth middleware + CRUD routes. Middleware sets `req.userId`, which is used to create posts, likes, comments, follow and to enforce ownership checks.

---

## B) Authentication + authorization (9–16)

### 9) Explain your login flow step-by-step.
**Answer:**
1. User submits email/password in `client/src/pages/Login.jsx`.
2. Frontend calls `POST /login`.
3. Backend verifies user + bcrypt password compare.
4. Backend returns JWT token + user object.
5. Frontend saves `token` and `user` in localStorage and redirects to `/`.

### 10) Explain your register flow step-by-step.
**Answer:**
1. User submits name/email/password in `client/src/pages/Register.jsx`.
2. Frontend calls `POST /register`.
3. Backend checks required fields + duplicate email.
4. Backend hashes password using bcrypt and stores user.
5. Backend returns JWT + user data.
6. Frontend stores token/user and redirects to home.

### 11) Where is JWT created and what is inside it?
**Answer:** In `server/index.js`, `signToken(userId)` signs `{ userId }` using `JWT_SECRET` with expiry `7d`.

### 12) How does frontend send token automatically?
**Answer:** `client/src/api.js` uses an Axios request interceptor to attach `Authorization: Bearer <token>` from localStorage.

### 13) What does `authMiddleware` do exactly?
**Answer:** It reads `Authorization` header, checks Bearer format, verifies JWT with `JWT_SECRET`, then stores `decoded.userId` into `req.userId`. If invalid/expired, it returns 401.

### 14) What is the difference between authentication and authorization in your app?
**Answer:** Authentication checks “who you are” (JWT valid). Authorization checks “what you are allowed to do” (example: only the post author can edit/delete).

### 15) How do you restrict edit/delete post to only the author?
**Answer:** In `PUT /posts/:id` and `DELETE /posts/:id`, backend compares `String(post.author)` with `String(req.userId)` and returns 403 if not equal.

### 16) Is frontend `PrivateRoute` enough for security?
**Answer:** No. `PrivateRoute` only blocks UI navigation. Real security is backend middleware; without a valid token backend returns 401.

---

## C) CRUD + APIs (17–24)

### 17) Explain your Post CRUD APIs.
**Answer:**
- Create: `POST /post`
- Read feed: `GET /posts`
- Read single: `GET /posts/:id`
- Update: `PUT /posts/:id` (only author)
- Delete: `DELETE /posts/:id` (only author)

### 18) What happens when a user creates a post with an image?
**Answer:**
1. Frontend uploads image to `POST /upload/post` using `FormData`.
2. Backend stores file via multer and returns `imageUrl`.
3. Frontend calls `POST /post` with `{ caption, image }` where `image` is that URL.

### 19) Why did you keep upload separate from post creation?
**Answer:** It makes upload reusable and keeps post API simple. Post creation only stores a URL and text instead of handling multipart in the same route.

### 20) Explain how likes work in your backend.
**Answer:** `toggleLike(postId, userId)` checks whether userId exists in `post.likes`. If not, it pushes; if yes, it removes. It saves and returns updated likes/likeCount and creates a notification only on like.

### 21) How do comments work?
**Answer:** `POST /comment` creates a `Comment` with `post`, `author=req.userId`, and text, populates author info, creates a notification for the post author, and returns the comment.

### 22) What is “save post” and where is it stored?
**Answer:** It toggles saving in the user document: `savedPosts` array in `User` model. API `POST /posts/:id/save` adds/removes the post id.

### 23) How does your feed API return comments together with posts?
**Answer:** `getFeedPosts()` fetches posts and comments separately, groups comments by post id, and merges into each post object as `comments`.

### 24) Why do you use `populate` in many responses?
**Answer:** To include referenced user fields (like author name/avatar) so frontend can render without extra requests.

---

## D) Database + Mongoose (25–28)

### 25) Explain the relationship between User, Post, Comment.
**Answer:** `Post.author` references `User`. `Comment.post` references `Post`. `Comment.author` references `User`. Notifications reference both users and optionally the post/comment.

### 26) What are timestamps and where do you use them?
**Answer:** Schemas use `{ timestamps: true }`, giving `createdAt/updatedAt`. Feed sorts posts by `createdAt` descending.

### 27) What does `.lean()` do and why used in feed building?
**Answer:** `.lean()` returns plain JS objects instead of full Mongoose documents, which is faster and convenient when we only read and transform.

### 28) How do you connect to MongoDB and handle failure?
**Answer:** `server/index.js` checks env variables and fails fast if missing. Then `mongoose.connect(MONGODB_URI)` uses timeouts; on failure it logs and exits.

---

## E) Uploads, security, deployment, improvements (29–30)

### 29) What security features are already implemented?
**Answer:** bcrypt password hashing, JWT auth middleware, authorization checks for editing/deleting, upload type/size limits in multer, and safe regex escaping in search.

### 30) What are your future improvements?
**Answer:** Split `server/index.js` into routes/controllers/services, add request validation library, add pagination for posts/notifications/search, add tests, rate limiting for auth routes, store uploads on cloud storage, and improve token storage strategy.

---

## Bonus: “Teacher trap” quick answers (memorize)

- **Why localStorage token is risky?** It is accessible to JS, so XSS can steal it; in production, safer patterns are needed.
- **401 vs 403?** 401 = not authenticated/invalid token, 403 = authenticated but not allowed.
- **Why backend validation even if frontend validates?** Frontend can be bypassed; backend is final gatekeeper.

