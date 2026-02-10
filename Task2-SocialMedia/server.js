const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect('mongodb://127.0.0.1:27017/socialAppDB')
    .then(() => console.log("✅ Social Media DB Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// 2. DATA MODELS
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    followers: { type: Array, default: [] },
    following: { type: Array, default: [] }
});

const PostSchema = new mongoose.Schema({
    username: String,
    content: String,
    likes: { type: Array, default: [] },
    comments: [{ username: String, text: String }],
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// 3. PAGE ROUTES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));

// 4. AUTH API
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ message: "Success!" });
    } catch (err) { res.status(400).json({ error: "User exists." }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) res.json({ success: true, username: user.username });
    else res.status(401).json({ success: false, message: "Invalid login" });
});

// 5. SOCIAL API (Updated to include follower data)
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 }).lean();
    const users = await User.find({}, 'username followers').lean();
    
    const postsWithFollowData = posts.map(post => {
        const author = users.find(u => u.username === post.username);
        return { ...post, authorFollowers: author ? author.followers : [] };
    });
    res.json(postsWithFollowData);
});

app.post('/api/posts', async (req, res) => {
    const newPost = new Post(req.body);
    await newPost.save();
    res.json({ message: "Posted!" });
});

app.post('/api/posts/:id/like', async (req, res) => {
    const post = await Post.findById(req.params.id);
    const { username } = req.body;
    if (post.likes.includes(username)) post.likes = post.likes.filter(u => u !== username);
    else post.likes.push(username);
    await post.save();
    res.json(post);
});

app.post('/api/posts/:id/comment', async (req, res) => {
    const post = await Post.findById(req.params.id);
    post.comments.push(req.body);
    await post.save();
    res.json(post);
});

// 6. FOLLOW LOGIC
app.post('/api/follow', async (req, res) => {
    const { currentUser, targetUser } = req.body;
    const target = await User.findOne({ username: targetUser });
    const self = await User.findOne({ username: currentUser });

    if (target.followers.includes(currentUser)) {
        target.followers = target.followers.filter(u => u !== currentUser);
        self.following = self.following.filter(u => u !== targetUser);
    } else {
        target.followers.push(currentUser);
        self.following.push(targetUser);
    }
    await target.save(); await self.save();
    res.json({ followers: target.followers.length });
});

// Get profile stats
app.get('/api/user/:username', async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    res.json(user);
});

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));