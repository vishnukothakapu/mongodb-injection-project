const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
username: { type: String, unique: true, required: true },
email: { type: String },
password: { type: String }, // select: false in queries by default
createdAt: { type: Date, default: Date.now },
role: { type: String, default: 'user' }
},{timestamps:true});


module.exports = mongoose.model('User', userSchema);