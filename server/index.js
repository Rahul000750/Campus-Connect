const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

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

// #region agent log (reliable NDJSON via local file append)
const DEBUG_LOG_PATH =
  '/Users/kunalupadhyay/Campus Connect/.cursor/debug-b3a111.log';
function agentLog(hypothesisId, location, message, data) {
  const payload = {
    sessionId: 'b3a111',
    runId: 'initial',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  try {
    const dir = require('path').dirname(DEBUG_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify(payload) + '\n');
  } catch {
    // Never crash the app due to logging failure.
  }
}
// #endregion

const app = express();
// Default 5001: macOS often reserves 5000 for AirPlay Receiver (EADDRINUSE).
const PORT = Number(process.env.PORT) || 5001;

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

// #region agent log
// #region register request trace
app.use((req, res, next) => {
  if (req.path === '/register' && (req.method === 'POST' || req.method === 'OPTIONS')) {
    agentLog('H6_registerPostOrPreflight', 'server/index.js:registerReqTrace', 'Incoming /register request', {
      method: req.method,
    });
  }
  next();
});
// #endregion
// #endregion

// #region agent log
agentLog(
  'H0_serverStart',
  'server/index.js',
  'Server booted (health endpoint available)',
  { port: PORT }
);
// #endregion

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err.message));

// #region agent log
app.get('/health', (req, res) => {
  agentLog('H5_healthHit', 'server/index.js:/health', 'Health endpoint called', {
    origin: req.headers.origin || null,
    userAgentPrefix: (req.headers['user-agent'] || '').slice(0, 40) || null,
  });
  res.json({ ok: true, port: PORT });
});
// #endregion

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // #region agent log
    agentLog(
      'H1_frontendToWrongPortOrNoBackend',
      'server/index.js:/register:entry',
      'POST /register hit (route reached)',
      {
        hasName: !!name,
        hasEmail: !!email,
        passwordLen: password ? String(password).length : 0,
      }
    );
    // #endregion

    fetch('http://127.0.0.1:7791/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'b3a111',
      },
      body: JSON.stringify({
        sessionId: 'b3a111',
        location: 'server/index.js:/register:entry',
        message: 'Register hit + request shape (no PII)',
        data: {
          hasName: !!name,
          hasEmail: !!email,
          passwordLen: password ? String(password).length : 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!name || !email || !password) {
      // #region agent log
      agentLog(
        'H4_missingFields',
        'server/index.js:/register:validationFail',
        'Validation failed: missing required fields',
        { hasName: !!name, hasEmail: !!email, hasPassword: !!password }
      );
      fetch('http://127.0.0.1:7791/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'b3a111',
        },
        body: JSON.stringify({
          sessionId: 'b3a111',
          location: 'server/index.js:/register:validationFail',
          message: 'Register validation failed (missing fields)',
          data: { hasName: !!name, hasEmail: !!email, hasPassword: !!password },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existing = await User.findOne({ email });
    // #region agent log
    agentLog(
      'H2_existingEmailOrValidation400',
      'server/index.js:/register:existingCheck',
      'Checked existing user by email',
      { foundExisting: !!existing }
    );
    fetch('http://127.0.0.1:7791/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'b3a111',
      },
      body: JSON.stringify({
        sessionId: 'b3a111',
        location: 'server/index.js:/register:afterFindOne',
        message: 'Register existing-user check result',
        data: { foundExisting: !!existing },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
    agentLog(
      'H3_backend500',
      'server/index.js:/register:catch',
      'Register handler threw',
      { errName: err?.name || null, errMessage: err?.message || null }
    );
    // #region agent log
    fetch('http://127.0.0.1:7791/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'b3a111',
      },
      body: JSON.stringify({
        sessionId: 'b3a111',
        location: 'server/index.js:/register:catch',
        message: 'Register handler threw (no PII)',
        data: {
          errName: err?.name || null,
          errCode: err?.code || null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
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
