const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
<<<<<<< HEAD
    accountId: {
        type: String,
        unique: true
    },
=======
>>>>>>> origin/main
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
<<<<<<< HEAD
    profilePhoto: {
        type: String,
        default: ''
    },
=======
>>>>>>> origin/main
    createdAt: {
        type: Date,
        default: Date.now
    }
});

<<<<<<< HEAD
// Generate Account ID before saving
userSchema.pre('save', async function (next) {
    if (!this.accountId) {
        // Generate unique Account ID: TMMS + timestamp suffix (last 6 digits)
        // This ensures uniqueness better than just random 4 digits
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(10 + Math.random() * 90); // 2 random digits
        this.accountId = `TMMS-${timestamp}${random}`;
    }
    next();
});

=======
>>>>>>> origin/main
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
