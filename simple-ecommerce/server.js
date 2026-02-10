const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

// DATABASE CONNECTION
mongoose.connect('mongodb://127.0.0.1:27017/ecommerceDB')
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// MODELS
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String 
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    items: Array,
    totalPrice: Number,
    userEmail: String,
    date: { type: Date, default: Date.now }
}));

// PAGE ROUTES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/store', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/product', (req, res) => res.sendFile(path.join(__dirname, 'product.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'cart.html')));

// API ROUTES
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ message: "User Registered Successfully!" });
    } catch (err) { res.status(400).json({ error: "Registration failed." }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) res.json({ success: true, username: user.username });
        else res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.json({ message: "Order placed successfully!" });
    } catch (err) { res.status(500).json({ error: "Order failed" }); }
});

app.listen(PORT, () => console.log(`🚀 Store Server: http://localhost:${PORT}`));