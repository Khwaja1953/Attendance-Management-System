const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
name: {type: String, required: true, trim: true},
parentage: {type: String, required: true, trim: true},
phone: {type: String, required: true, unique: true},
email: {type: String, required: true, unique: true},
isVerified: {type: Boolean, default: false},
address: {type: String, required: true},
course: {type: String},
batch: {type: String},
attendance: {type: mongoose.Schema.Types.ObjectId, ref: "Attendance"}
},{timestamps: true});
const User = mongoose.model("User",userSchema);
module.exports = User;