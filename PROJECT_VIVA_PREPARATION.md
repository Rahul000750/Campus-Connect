# Project Viva Preparation

## 1. Project Summary

### Project introduction
- **Project name:** CampusConnect
- **Type:** MERN-based college social networking mini project
- **One-line idea:** A platform where students can register, login, create posts, like/comment, follow users, and manage profiles.

### Problem statement
- In college environments, students need a simple space to share updates and interact.
- Existing generic social platforms are noisy and not focused on campus-level communication.
- This project solves that by giving core social features in one focused app.

### Why this project was made
- To learn full-stack development using React + Node + MongoDB.
- To implement real-world features: authentication, CRUD, media upload, notifications, and protected routes.
- To demonstrate end-to-end engineering for viva/interview (frontend + backend + DB + API integration).

### Core flow in simple words
1. User registers/logs in and gets a JWT token.
2. Token is stored in frontend localStorage.
3. Frontend sends token in API headers.
4. Backend verifies token before protected actions.
5. User can create/read/update/delete posts and interact with other users.

---

## 2. Tech Stack Explanation

### Frontend
- **React (Vite):** UI and routing
- **React Router:** page navigation and protected route logic
- **Axios:** API calls with auth interceptor
- **Tailwind CSS:** styling
- **Framer Motion + React Icons:** UI polish/animations/icons

### Backend
- **Node.js + Express:** REST APIs
- **Mongoose:** MongoDB object modeling
- **bcryptjs:** password hashing
- **jsonwebtoken (JWT):** authentication tokens
- **multer:** image upload handling
- **cors + dotenv:** cross-origin config and env config

### Database
- **MongoDB** with collections for `User`, `Post`, `Comment`, `Notification`

### Build/Run
- Root scripts run server and build client.
- Vite proxy forwards `/api/*` to backend in local development.

---

## 3. Important Files to Study

### Study these first (highest priority)
1. `server/index.js` - complete backend architecture, routes, auth, CRUD, upload, notifications
2. `server/middleware/auth.js` - JWT verification logic
3. `server/models/User.js` - user schema and relationships
4. `server/models/Post.js` - post schema (caption/text/likes/image)
5. `server/models/Comment.js` - comment schema
6. `server/models/Notification.js` - notifications design
7. `client/src/App.jsx` - route setup + `PrivateRoute`
8. `client/src/api.js` - Axios base URL + token injection
9. `client/src/pages/Home.jsx` - feed load + create post + upload integration
10. `client/vite.config.js` - proxy/development API routing

### Next important UI files
- `client/src/pages/Login.jsx`
- `client/src/pages/Register.jsx`
- `client/src/pages/Profile.jsx`
- `client/src/components/PostCard.jsx`
- `client/src/components/ImageUploader.jsx`
- `client/src/components/NotificationsDropdown.jsx`

### Project docs/config
- `README.md`
- `server/.env.example`
- `client/.env.example`
- root `package.json`

---

## 4. Important Code Snippets with Explanation

> These are high-probability viva snippets. Learn these deeply.

### Snippet 1: Private route protection (Frontend)
**File:** `client/src/App.jsx`

```jsx
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
```

**What it does**
- Blocks unauthenticated users from protected pages.

**Why it is used**
- Prevents direct UI access to pages like home/profile without login.

**Line by line**
- `const token = ...` reads JWT token from browser storage.
- `if (!token)` checks if user is logged out.
- `<Navigate to="/login" replace />` redirects user.
- `return children` allows page render when token exists.

**Possible viva questions**
- Is this enough security by itself? (No, backend auth is still mandatory.)
- What if token exists but is expired? (Backend will reject with 401.)

---

### Snippet 2: Axios interceptor for auth header
**File:** `client/src/api.js`

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**What it does**
- Automatically adds JWT token to outgoing API requests.

**Why it is used**
- Avoids repeating auth header logic in every component.

**Line by line**
- Interceptor runs before each request.
- Reads token from localStorage.
- Adds `Authorization: Bearer <token>` header when token exists.
- Returns updated config.

**Possible viva questions**
- Why interceptor instead of manual headers in every API call?
- What is risk of storing token in localStorage?

---

### Snippet 3: Auth middleware in backend
**File:** `server/middleware/auth.js`

```js
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
```

**What it does**
- Verifies JWT and injects authenticated user ID into request.

**Why it is used**
- Protects private APIs and connects request to current user.

**Line by line**
- Reads `Authorization` header.
- Validates Bearer format.
- Extracts token part.
- Verifies token signature using secret key.
- Stores user id in `req.userId`.
- Calls `next()` to continue route handler.
- Returns 401 on invalid/expired token.

**Possible viva questions**
- Why use middleware pattern in Express?
- Difference between authentication and authorization?

---

### Snippet 4: Register flow (hash + token)
**File:** `server/index.js`

```js
app.post(['/register', '/auth/register'], async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  const token = signToken(user._id);
  res.status(201).json({ message: 'Registered successfully', token, user: serializeUser(user) });
});
```

**What it does**
- Creates a new user securely and returns auth token immediately.

**Why it is used**
- Passwords must never be stored in plain text.

**Line by line**
- Reads input fields.
- Validates required fields.
- Checks duplicate email.
- Hashes password using bcrypt salt rounds.
- Saves user in MongoDB.
- Generates JWT token with user id.
- Returns success + token + sanitized user data.

**Possible viva questions**
- Why bcrypt?
- Why issue JWT during register?

---

### Snippet 5: Login flow
**File:** `server/index.js`

```js
app.post(['/login', '/auth/login'], async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = signToken(user._id);
  res.json({ message: 'Login successful', token, user: serializeUser(user) });
});
```

**What it does**
- Authenticates existing user and returns JWT.

**Why it is used**
- Secure login with hashed password comparison.

**Line by line**
- Validates email/password.
- Finds user by email.
- Uses bcrypt compare with stored hash.
- Returns generic failure to avoid leaking which field is wrong.
- Signs token and sends response.

**Possible viva questions**
- Why same error for wrong email and wrong password?
- Stateless JWT vs session-based auth?

---

### Snippet 6: Multer file upload restrictions
**File:** `server/index.js`

```js
return multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    return cb(null, true);
  },
});
```

**What it does**
- Accepts only image uploads up to 5MB.

**Why it is used**
- Prevents huge/unwanted file uploads and basic misuse.

**Line by line**
- Uses configured disk storage.
- Sets max file size.
- Validates mimetype starts with `image/`.
- Rejects invalid file with callback error.

**Possible viva questions**
- Why validate on backend if frontend also validates?
- Is mimetype-only check fully secure?

---

### Snippet 7: Create post route (CRUD - Create)
**File:** `server/index.js`

```js
app.post(['/post', '/posts/create'], authMiddleware, async (req, res) => {
  const { text, caption, imageUrl = '', image = '' } = req.body;
  const finalCaption = String(caption || text || '').trim();
  const finalImage = String(image || imageUrl || '').trim();
  if (!finalCaption && !finalImage) {
    return res.status(400).json({ message: 'Post caption or image is required' });
  }
  const post = await Post.create({
    text: finalCaption,
    caption: finalCaption,
    imageUrl: finalImage,
    image: finalImage,
    author: req.userId,
  });
  await post.populate('author', 'name email avatarUrl');
  res.status(201).json(post);
});
```

**What it does**
- Creates a new post (text or image) for logged-in user.

**Why it is used**
- Main social feature: posting in feed.

**Line by line**
- Protected by `authMiddleware`.
- Accepts both old/new field names (`text/caption`, `image/imageUrl`) for compatibility.
- Normalizes and trims data.
- Rejects empty post.
- Saves post with authenticated `author`.
- Populates author details for immediate UI rendering.

**Possible viva questions**
- Why allow both `text` and `caption`?
- Why populate before sending response?

---

### Snippet 8: Update/Delete ownership check (CRUD - Update/Delete security)
**File:** `server/index.js`

```js
const post = await Post.findById(req.params.id);
if (!post) return res.status(404).json({ message: 'Post not found' });
if (String(post.author) !== String(req.userId)) {
  return res.status(403).json({ message: 'Not allowed' });
}
```

**What it does**
- Ensures only post author can edit or delete.

**Why it is used**
- Prevents unauthorized changes to others' data.

**Line by line**
- Finds target post by ID.
- Returns 404 if not found.
- Compares post author with authenticated user.
- Returns 403 forbidden for non-owner.

**Possible viva questions**
- Why convert ObjectId to string before comparison?
- 401 vs 403 difference?

---

### Snippet 9: Like toggle helper
**File:** `server/index.js`

```js
async function toggleLike(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) return null;
  const uid = String(userId);
  const idx = post.likes.map((id) => String(id)).indexOf(uid);
  let liked = true;
  if (idx === -1) post.likes.push(userId);
  else {
    post.likes.splice(idx, 1);
    liked = false;
  }
  await post.save();
  if (liked) {
    await createNotification({ recipient: post.author, actor: userId, type: 'like', post: post._id });
  }
  return { likes: post.likes, likeCount: post.likes.length, liked };
}
```

**What it does**
- Handles both like and unlike in one shared function.

**Why it is used**
- Avoids duplicate code across like endpoints.

**Line by line**
- Fetches post.
- Returns null if post missing.
- Finds whether user already liked.
- Adds/removes user id from likes array.
- Saves post.
- Creates notification only on new like.
- Returns updated like info.

**Possible viva questions**
- Why helper function instead of route-level duplicate logic?
- Any concurrency issue with array-based likes?

---

### Snippet 10: Feed building with grouped comments
**File:** `server/index.js`

```js
async function getFeedPosts() {
  const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'name email avatarUrl').lean();
  const postIds = posts.map((p) => p._id);
  const comments = await Comment.find({ post: { $in: postIds } })
    .sort({ createdAt: 1 })
    .populate('author', 'name email avatarUrl')
    .lean();

  const byPost = {};
  for (const c of comments) {
    const pid = c.post.toString();
    if (!byPost[pid]) byPost[pid] = [];
    byPost[pid].push(c);
  }

  return posts.map((p) => ({ ...p, comments: byPost[p._id.toString()] || [] }));
}
```

**What it does**
- Returns feed posts with comments attached in response shape needed by UI.

**Why it is used**
- Reduces frontend complexity by sending ready-to-render objects.

**Line by line**
- Gets latest posts with author populated.
- Collects post IDs.
- Fetches comments for those posts.
- Groups comments by `postId`.
- Merges grouped comments into each post object.

**Possible viva questions**
- Why use `.lean()`?
- Why not fetch comments separately on frontend?

---

### Snippet 11: Frontend create post flow with upload
**File:** `client/src/pages/Home.jsx`

```js
let imageUrl = '';
if (postImageFile) {
  const formData = new FormData();
  formData.append('image', postImageFile);
  const uploadRes = await api.post('/upload/post', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  imageUrl = uploadRes.data.imageUrl;
}
await api.post('/post', { caption: text.trim(), image: imageUrl });
```

**What it does**
- Uploads image first, then creates post with uploaded image URL.

**Why it is used**
- Keeps post creation API simple and reusable.

**Line by line**
- Initializes `imageUrl`.
- If user selected file: make `FormData`.
- Sends file to upload endpoint.
- Reads public image URL from response.
- Creates post with caption + image URL.

**Possible viva questions**
- What if upload succeeds but post creation fails?
- Why not send file and caption in one endpoint?

---

### Snippet 12: Database connection and startup safety
**File:** `server/index.js`

```js
if (!process.env.MONGODB_URI) {
  console.error('[CampusConnect] Missing MONGODB_URI...');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('[CampusConnect] Missing JWT_SECRET...');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  })
```

**What it does**
- Fails fast on missing env config and connects MongoDB with timeout.

**Why it is used**
- Prevents app from running in broken/unsecure state.

**Line by line**
- Checks required env variables.
- Prints readable error.
- Exits process if missing config.
- Connects Mongo with explicit timeouts.

**Possible viva questions**
- Why fail fast?
- Why add connection timeout values?

---

## 5. Most Asked Teacher Questions with Answers

1. **What is your project in one line?**  
   CampusConnect is a MERN-based campus social app where users can authenticate and interact through posts, likes, comments, follow, and notifications.

2. **Why did you choose MERN stack?**  
   It gives JavaScript on both frontend and backend, fast development, easy JSON data flow, and MongoDB works naturally with dynamic social data.

3. **How is authentication implemented?**  
   Register/login returns JWT token. Frontend stores token and sends it in `Authorization` header. Backend middleware verifies token and identifies user.

4. **How do you secure user passwords?**  
   Passwords are hashed with `bcryptjs` before storing. Login compares hash using `bcrypt.compare`.

5. **How do protected routes work?**  
   Frontend `PrivateRoute` protects UI navigation. Backend `authMiddleware` protects actual APIs.

6. **Explain one complete CRUD cycle.**  
   Create: `POST /post`, Read: `GET /posts`, Update: `PUT /posts/:id`, Delete: `DELETE /posts/:id`. Update/delete allowed only for post author.

7. **How does file upload work?**  
   Client sends `multipart/form-data`; backend `multer` stores image locally; backend returns public URL; post/profile stores that URL.

8. **What relationships are in your database?**  
   `Post.author -> User`, `Comment.post -> Post`, `Comment.author -> User`, `Notification` links recipient/actor/post/comment.

9. **How is error handling done?**  
   Backend uses try/catch and proper status codes. Frontend catches API errors and displays messages/toasts.

10. **How can this project be improved?**  
   Split monolithic backend file, add validation library, tests, pagination, rate limiting, better token storage, cloud storage for uploads.

---

## 6. Backend Questions

- **Why is `server/index.js` very important?**  
  It currently holds most backend logic: route handlers, helper functions, upload handling, notification logic, and DB startup.

- **What middleware are used?**  
  `cors`, `express.json`, static files for `/uploads`, and custom `authMiddleware`.

- **How do you enforce authorization?**  
  In update/delete routes, author ID and `req.userId` are compared. Non-owner gets `403`.

- **Why use helper functions like `toggleLike`, `getFeedPosts`, `serializeUser`?**  
  Reusability, cleaner route handlers, and consistent response format.

- **How are notifications generated?**  
  `createNotification` is called after like/comment/follow events; self-notifications are skipped.

---

## 7. Frontend Questions

- **How is routing handled?**  
  React Router in `App.jsx` with `Routes` and `Route`; protected pages wrapped in `PrivateRoute`.

- **State management approach?**  
  Local component state (`useState`, `useEffect`) + Context providers (`ThemeProvider`, `ToastProvider`).

- **How does frontend call backend?**  
  Through centralized Axios instance in `api.js`; token is injected using request interceptor.

- **How does Home page work?**  
  On mount, `/posts` is called. User can submit post text/image, then feed reloads.

- **What happens on logout?**  
  Token/user removed from localStorage, so protected routes redirect to login.

---

## 8. Database Questions

- **Why MongoDB for this project?**  
  Flexible schema and fast iteration for social features.

- **Explain User schema fields.**  
  Name/email/password + profile data + arrays for followers, following, and saved posts.

- **Explain Post schema.**  
  Post text/caption, author reference, likes array, optional image fields.

- **How are relations loaded?**  
  Using Mongoose `populate` for author/post references.

- **Why store timestamps?**  
  Useful for feed ordering and activity history.

---

## 9. Deployment Questions

### Current setup from code
- Frontend dev runs on `5173` (Vite).
- Backend runs on `5174` (Express).
- Vite proxy forwards `/api` to backend.
- Backend depends on env vars: `MONGODB_URI`, `JWT_SECRET`, optional `PUBLIC_BASE_URL`.

### Teacher-friendly deployment explanation
1. Build frontend using `npm --prefix client run build`.
2. Start backend with proper environment variables.
3. Point frontend API to backend domain (`VITE_API_URL` or same-origin `/api`).
4. Ensure MongoDB is reachable and uploads path is writable.

### Real limitation to mention honestly
- No Docker/CI/CD configuration is currently included in repository.

---

## 10. Weak Points Teacher May Catch

- Backend is mostly in one file (`server/index.js`) - harder to scale/maintain.
- JWT token is stored in localStorage (XSS risk discussion can come in viva).
- No formal schema validation library (like Joi/Zod/express-validator) is used.
- No automated tests present.
- Local disk storage for images may not scale for production.
- No explicit rate limiting/brute-force protection on auth endpoints.

---

## 11. Best Answers to Impress Teacher

- **On architecture choice:**  
  "I kept backend in one file for fast iteration, then I separated logic using helper functions. My next refactor is route/controller/service split for maintainability."

- **On security:**  
  "I implemented layered security: password hashing, JWT verification middleware, route-level authorization checks, and upload validation on backend."

- **On API design:**  
  "I designed response payloads to be frontend-ready, like feed posts with comments and populated author data, reducing extra UI processing."

- **On error handling:**  
  "I used consistent HTTP status codes and user-friendly error messages so frontend can show meaningful feedback."

- **On future work:**  
  "I would add validation, tests, pagination, cloud storage, and CI/CD to make it production-grade."

---

## 12. 2-Minute Project Introduction Speech

Hello sir/ma'am, my project is **CampusConnect**, a MERN stack college social networking application.  
The main problem I focused on is that students need a simple, focused platform for sharing updates and interacting with peers.

In this project, users can register and login securely, create posts with text or images, like and comment on posts, follow other users, and get notifications for social activity.  
For authentication, I used JWT. Passwords are hashed with bcrypt, and protected APIs are secured using middleware that verifies the token.

On the frontend, I used React with React Router and Axios. I created a centralized API layer where token headers are automatically attached.  
On the backend, I used Express and Mongoose with MongoDB models for User, Post, Comment, and Notification.  
I implemented full CRUD for posts and added authorization checks so only the post owner can edit or delete.

I also implemented image upload using multer with type and size checks, and the app serves uploaded files through a static route.

Overall, this project helped me learn complete full-stack integration: database modeling, API design, authentication flow, and frontend-backend coordination.  
If I extend this further, I would modularize backend architecture, add tests, stronger validation, and deploy with CI/CD and cloud storage.

---

## 13. Final Revision Notes

### Last-day quick checklist
- Memorize auth flow: register/login -> token -> interceptor -> middleware.
- Revise all post CRUD routes and ownership check.
- Understand each MongoDB schema and relationships.
- Revise upload flow (frontend `FormData` -> backend multer -> URL saved).
- Learn 10 key API endpoints with method + purpose.
- Be ready to explain why both frontend and backend validation are needed.

### 10 endpoints you should remember
1. `POST /register`
2. `POST /login`
3. `GET /me`
4. `GET /posts`
5. `POST /post`
6. `PUT /posts/:id`
7. `DELETE /posts/:id`
8. `POST /comment`
9. `POST /like`
10. `POST /upload/post`

### Final viva strategy
- Start with problem statement and architecture.
- Explain one complete user journey (login -> create post -> like/comment).
- Show security + authorization confidently.
- Honestly mention limitations and future improvements.
- Speak in clear steps; do not jump randomly between frontend/backend.
