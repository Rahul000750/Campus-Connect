# CampusConnect (MERN mini project)

A simple college social app: register, login, posts feed, likes, comments, profile.

**Structure**

```
Campus Connect/
├── client/          # React (Vite) frontend
│   ├── src/
│   │   ├── components/   Navbar, PostCard, CommentBox
│   │   ├── pages/        Login, Register, Home, Profile
│   │   ├── api.js        Axios instance + JWT header
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/          # Node + Express backend
│   ├── models/      User, Post, Comment
│   ├── middleware/  auth.js (JWT)
│   ├── index.js     routes
│   └── package.json
└── README.md
```

---

## Part A — Build order (why backend first?)

1. **Database and API first** — The frontend only talks to HTTP endpoints. If the server and MongoDB models exist first, you can test with Postman or `curl` before writing any React UI.
2. **Then frontend** — React pages call the same URLs you already tested.

---

## Part B — Prerequisites (MacBook Air M1)

1. **Node.js** (LTS): [https://nodejs.org](https://nodejs.org) — install the Apple Silicon build.
2. **MongoDB** — pick one:
   - **Local:** `brew tap mongodb/brew && brew install mongodb-community` then `brew services start mongodb-community` (or run `mongod` manually).
   - **Cloud:** [MongoDB Atlas](https://www.mongodb.com/atlas) — create a free cluster, get a connection string, use it as `MONGODB_URI` in `server/.env`.

---

## Part C — Backend setup (step by step)

### Step 1: Install dependencies

```bash
cd "/Users/kunalupadhyay/Campus Connect/server"
npm install
```

### Step 2: Environment variables

Copy the example file and edit values:

```bash
cp .env.example .env
```

- `MONGODB_URI` — local: `mongodb://127.0.0.1:27017/campusconnect` — or your Atlas URI.
- `JWT_SECRET` — any long random string (used to sign tokens).
- `PORT` — default `5174` (avoids macOS system-reserved ports).

### Step 3: Start the server

```bash
npm start
```

You should see `MongoDB connected` and `Server running on ${import.meta.env.VITE_API_URL}`.

### Step 4: What each backend piece does (teacher-style)

| File | Role |
|------|------|
| `models/User.js` | Stores name, email, hashed password. |
| `models/Post.js` | Post text, author ref, list of user ids who liked. |
| `models/Comment.js` | Comment text, post ref, author ref. |
| `middleware/auth.js` | Reads `Authorization: Bearer <token>`, verifies JWT, sets `req.userId`. |
| `index.js` | Registers routes: `/register`, `/login`, `/posts`, `/post`, `/comment`, `/like`, plus `/me` for profile. |

**JWT idea:** On register/login, the server creates a token with `userId` inside. The client sends it on every protected request. The middleware checks the signature so only your server could have created it.

---

## Part D — Test backend features (one by one)

With the server running, use **Terminal** (replace `YOUR_TOKEN` after login).

### 1) Register

```bash
curl -s -X POST ${import.meta.env.VITE_API_URL}/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@college.edu","password":"secret12"}'
```

Copy `token` from the JSON response.

### 2) Login

```bash
curl -s -X POST ${import.meta.env.VITE_API_URL}/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","password":"secret12"}'
```

### 3) Get profile (needs token)

```bash
curl -s ${import.meta.env.VITE_API_URL}/me -H "Authorization: Bearer YOUR_TOKEN"
```

### 4) Create post

```bash
curl -s -X POST ${import.meta.env.VITE_API_URL}/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text":"Hello from CampusConnect!"}'
```

### 5) List posts

```bash
curl -s ${import.meta.env.VITE_API_URL}/posts -H "Authorization: Bearer YOUR_TOKEN"
```

### 6) Like (use a real `postId` from step 5)

```bash
curl -s -X POST ${import.meta.env.VITE_API_URL}/like \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"postId":"PASTE_POST_ID_HERE"}'
```

### 7) Comment

```bash
curl -s -X POST ${import.meta.env.VITE_API_URL}/comment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"postId":"PASTE_POST_ID_HERE","text":"Nice post!"}'
```

---

## Part E — Frontend setup

### Step 1: Install and run

```bash
cd "/Users/kunalupadhyay/Campus Connect/client"
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Step 2: API URL (optional)

By default the client uses `${import.meta.env.VITE_API_URL}`. To override, create `client/.env`:

```env
VITE_API_URL=${import.meta.env.VITE_API_URL}
```

### Step 3: What each frontend piece does

| Piece | Role |
|-------|------|
| `api.js` | Axios with `baseURL`; adds `Authorization` from `localStorage.token`. |
| `App.jsx` | Routes; `PrivateRoute` sends guests to `/login`. |
| `Navbar` | Links + logout (clears token and `user`). |
| `Home` | Loads `/posts`, form posts to `/post`. |
| `PostCard` | Shows one post; like → `/like`; `CommentBox` → `/comment`. |
| `Login` / `Register` | Save `token` and `user` JSON in `localStorage`. |
| `Profile` | `/me` + filters feed posts for the current user. |

**Hooks:** Only `useState` and `useEffect` as requested.

---

## Part F — Test the full app (checklist)

1. Start MongoDB (local or Atlas).
2. Start server: `cd server && npm start`.
3. Start client: `cd client && npm run dev`.
4. **Register** a new account → should land on Feed.
5. **Create a post** → should appear in the list.
6. Open another browser (or incognito), **register another user**, **like** and **comment** on the first user’s post.
7. **Profile** → should show your name, email, and only your posts.
8. **Logout** → should require login again for Feed.

---

## Part G — Routes summary (backend)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/register` | No | Create user, return JWT |
| POST | `/login` | No | Login, return JWT |
| GET | `/me` | Yes | Current user (profile header) |
| GET | `/posts` | Yes | Feed with comments |
| POST | `/post` | Yes | Create post |
| POST | `/comment` | Yes | Add comment |
| POST | `/like` | Yes | Toggle like on post |

---

## Troubleshooting

- **`MongoDB connection error`** — Mongo not running, or wrong `MONGODB_URI`.
- **`401` on `/posts`** — Missing or invalid token; login again.
- **CORS errors** — Server must be on the URL in `api.js` (`cors()` is enabled in `index.js`).
- **Port in use** — Change `PORT` in `server/.env` or stop the other process.

---

## Academic honesty

Use this project to learn: type the code yourself, change variable names, add your own comments.

Updated by Gautam Kumar.
