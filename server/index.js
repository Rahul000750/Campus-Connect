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
const Notification = require('./models/Notification');
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
// Explicitly handle preflight so browser "Network Error" becomes real server responses.
app.options('*', cors());
app.use(express.json());

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function getTags(text) {
  const matches = String(text || '').match(/#[a-zA-Z0-9_]+/g) || [];
  return [...new Set(matches.map((tag) => tag.toLowerCase()))];
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
  };
}

async function createNotification({ recipient, actor, type, post, comment }) {
  if (String(recipient) === String(actor)) return;
  await Notification.create({ recipient, actor, type, post, comment });
}

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

  return posts.map((p) => ({
    ...p,
    comments: byPost[p._id.toString()] || [],
  }));
}

async function getPostById(postId, userId) {
  const post = await Post.findById(postId).populate('author', 'name email avatarUrl').lean();
  if (!post) return null;
  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: 1 })
    .populate('author', 'name email avatarUrl')
    .lean();
  const me = await User.findById(userId).select('savedPosts').lean();
  const savedSet = new Set((me?.savedPosts || []).map((id) => String(id)));
  return { ...post, comments, isSaved: savedSet.has(String(post._id)) };
}

// POST /register and /auth/register
app.post(['/register', '/auth/register'], async (req, res) => {
  try {
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
    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /login and /auth/login
app.post(['/login', '/auth/login'], async (req, res) => {
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
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /me and /users/me
app.get(['/me', '/users/me'], authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(serializeUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// PUT /users/profile
app.put('/users/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof bio === 'string') updates.bio = bio.trim().slice(0, 240);
    if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl.trim();

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json({ message: 'Profile updated', user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /users/suggestions
app.get('/users/suggestions', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId).lean();
    const excluded = [req.userId, ...(me.following || [])];
    const users = await User.find({ _id: { $nin: excluded } })
      .select('name email avatarUrl bio followers')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    res.json(users.map((u) => serializeUser(u)));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /users/:id
app.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(serializeUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /users/follow/:id (toggle)
app.post('/users/follow/:id', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (String(targetId) === String(req.userId)) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    const [me, target] = await Promise.all([User.findById(req.userId), User.findById(targetId)]);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const followingIdx = me.following.map((id) => String(id)).indexOf(String(targetId));
    let following = true;
    if (followingIdx === -1) {
      me.following.push(targetId);
      target.followers.push(req.userId);
      await createNotification({ recipient: targetId, actor: req.userId, type: 'follow' });
    } else {
      me.following.splice(followingIdx, 1);
      target.followers = target.followers.filter((id) => String(id) !== String(req.userId));
      following = false;
    }
    await Promise.all([me.save(), target.save()]);

    res.json({
      following,
      myFollowingCount: me.following.length,
      targetFollowersCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /posts and /posts/feed
app.get(['/posts', '/posts/feed'], authMiddleware, async (req, res) => {
  try {
    const posts = await getFeedPosts();
    const me = await User.findById(req.userId).select('savedPosts').lean();
    const savedSet = new Set((me.savedPosts || []).map((id) => String(id)));
    res.json(
      posts.map((p) => ({
        ...p,
        isSaved: savedSet.has(String(p._id)),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /posts/:id
app.get('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await getPostById(req.params.id, req.userId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /post and /posts/create
app.post(['/post', '/posts/create'], authMiddleware, async (req, res) => {
  try {
    const { text, imageUrl = '' } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Post text is required' });
    }
    const post = await Post.create({ text: text.trim(), imageUrl: imageUrl.trim(), author: req.userId });
    await post.populate('author', 'name email avatarUrl');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// PUT /posts/:id (edit own post)
app.put('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { text, imageUrl } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.author) !== String(req.userId)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (typeof text === 'string' && text.trim()) post.text = text.trim();
    if (typeof imageUrl === 'string') post.imageUrl = imageUrl.trim();
    await post.save();
    res.json({ message: 'Post updated', post });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// DELETE /posts/:id
app.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.author) !== String(req.userId)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await Promise.all([
      Comment.deleteMany({ post: req.params.id }),
      Notification.deleteMany({ post: req.params.id }),
      User.updateMany({}, { $pull: { savedPosts: req.params.id } }),
      Post.findByIdAndDelete(req.params.id),
    ]);

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /comment and /posts/comment/:id
app.post(['/comment', '/posts/comment/:id'], authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id || req.body.postId;
    const { text } = req.body;
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
    await comment.populate('author', 'name email avatarUrl');
    await createNotification({
      recipient: post.author,
      actor: req.userId,
      type: 'comment',
      post: post._id,
      comment: comment._id,
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /like and PUT /posts/like/:id
app.post('/like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: 'postId is required' });
    const result = await toggleLike(postId, req.userId);
    if (!result) return res.status(404).json({ message: 'Post not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

app.put('/posts/like/:id', authMiddleware, async (req, res) => {
  try {
    const result = await toggleLike(req.params.id, req.userId);
    if (!result) return res.status(404).json({ message: 'Post not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /posts/:id/save
app.post('/posts/:id/save', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const me = await User.findById(req.userId);
    const idx = me.savedPosts.map((id) => String(id)).indexOf(String(req.params.id));
    let saved = true;
    if (idx === -1) me.savedPosts.push(req.params.id);
    else {
      me.savedPosts.splice(idx, 1);
      saved = false;
    }
    await me.save();
    res.json({ saved, savedCount: me.savedPosts.length });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /search?q=
app.get('/search', authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ users: [], posts: [] });
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [users, posts] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }] }).select('name email avatarUrl bio').limit(8).lean(),
      Post.find({ text: regex }).populate('author', 'name avatarUrl').sort({ createdAt: -1 }).limit(8).lean(),
    ]);
    res.json({ users: users.map((u) => serializeUser(u)), posts });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /trending
app.get('/trending', authMiddleware, async (_req, res) => {
  try {
    const posts = await Post.find().select('text').sort({ createdAt: -1 }).limit(120).lean();
    const counts = {};
    for (const post of posts) {
      for (const tag of getTags(post.text)) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    const trending = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));
    res.json(trending);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// GET /notifications
app.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('actor', 'name avatarUrl')
      .populate('post', 'text')
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// PUT /notifications/read
app.put('/notifications/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (id) {
      await Notification.updateOne({ _id: id, recipient: req.userId }, { $set: { isRead: true } });
    } else {
      await Notification.updateMany({ recipient: req.userId, isRead: false }, { $set: { isRead: true } });
    }
    res.json({ message: 'Notifications updated' });
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
