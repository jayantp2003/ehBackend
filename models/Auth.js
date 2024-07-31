const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    posts: [{ type: String }] // stores the IDs of the posts created by the user
});

module.exports = mongoose.model('User', authSchema);
