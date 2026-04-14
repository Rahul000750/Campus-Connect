const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const authMiddleware = require('./middleware/auth');

if (!process.env.MONGODB_URI) {
  console.error(
    '[CampusConnect] Missing MONGODB_URI. Create server/.env (copy from .env.example) and set MONGODB_URI.'
  );
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('[CampusConnect] Missing JWT_SECRET. Set it in server/.env');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 5174;

// Keep it simple for local dev: allow frontend origin + Authorization header.
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
// Explicitly handle preflight so browser "Network Error" becomes real server responses.
app.options('*', cors());
app.use(express.json());

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // #region agent log
    fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac4137'},body:JSON.stringify({sessionId:'ac4137',runId:'cleanup-baseline',hypothesisId:'H1_cleanup_preserves_register_path',location:'server/index.js:/register:entry',message:'Register endpoint reached after cleanup',data:{hasName:!!name,hasEmail:!!email,hasPassword:!!password},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // #region agent log
    fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac4137'},body:JSON.stringify({sessionId:'ac4137',runId:'cleanup-baseline',hypothesisId:'H2_cleanup_preserves_login_path',location:'server/index.js:/login:entry',message:'Login endpoint reached after cleanup',data:{hasEmail:!!email,hasPassword:!!password},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /me — who is logged in (for Profile page)
app.get('/me', authMiddleware, async (req, res) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac4137'},body:JSON.stringify({sessionId:'ac4137',runId:'cleanup-baseline',hypothesisId:'H3_cleanup_preserves_profile_auth',location:'server/index.js:/me:entry',message:'Profile endpoint reached after cleanup',data:{hasUserId:!!req.userId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /posts — feed (protected so we know who liked)
app.get('/posts', authMiddleware, async (req, res) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac4137'},body:JSON.stringify({sessionId:'ac4137',runId:'cleanup-baseline',hypothesisId:'H4_cleanup_preserves_feed_query',location:'server/index.js:/posts:entry',message:'Posts endpoint reached after cleanup',data:{hasUserId:!!req.userId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name email')
      .lean();

    const postIds = posts.map((p) => p._id);
    const comments = await Comment.find({ post: { $in: postIds } })
      .sort({ createdAt: 1 })
      .populate('author', 'name email')
      .lean();

    const byPost = {};
    for (const c of comments) {
      const pid = c.post.toString();
      if (!byPost[pid]) byPost[pid] = [];
      byPost[pid].push(c);
    }

    const result = posts.map((p) => ({
      ...p,
      comments: byPost[p._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /post — create post
app.post('/post', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Post text is required' });
    }
    const post = await Post.create({ text: text.trim(), author: req.userId });
    await post.populate('author', 'name email');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /comment
app.post('/comment', authMiddleware, async (req, res) => {
  try {
    const { postId, text } = req.body;
    if (!postId || !text || !String(text).trim()) {
      return res.status(400).json({ message: 'postId and text are required' });
    }
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await Comment.create({
      post: postId,
      author: req.userId,
      text: text.trim(),
    });
    await comment.populate('author', 'name email');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /like — toggle like on a post
app.post('/like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ message: 'postId is required' });
    }
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.userId.toString();
    const idx = post.likes.map((id) => id.toString()).indexOf(uid);
    if (idx === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();
    await post.populate('author', 'name email');
    res.json({ likes: post.likes, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

console.log('[CampusConnect] Connecting to MongoDB (8s timeout)...');
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  })
  .then(() => {
    console.log('MongoDB connected');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `[CampusConnect] Port ${PORT} is already in use. Stop the other process or set PORT to another value in server/.env`
        );
        process.exit(1);
      }
      throw err;
    });
  })
  .catch((err) => {
    console.error(
      '[CampusConnect] MongoDB connection failed. Start MongoDB and check MONGODB_URI in server/.env\n',
      err.message
    );
    process.exit(1);
  });
