const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Admin name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Admin email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't return password by default
    },
    adminCode: {
        type: String,
        required: [true, 'Admin access code is required'],
        select: false // Don't return admin code by default
    },
    role: {
        type: String,
        enum: ['super-admin', 'admin'],
        default: 'admin'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    permissions: {
        type: [String],
        enum: [
            'manage_users',
            'manage_orders',
            'manage_machines',
            'manage_spare_parts',
            'manage_admins',
            'view_analytics',
            'manage_payments',
            'view_reports'
        ],
        default: [
            'manage_users',
            'manage_orders',
            'manage_machines',
            'manage_spare_parts',
            'view_analytics',
            'manage_payments',
            'view_reports'
        ]
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockedUntil: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt before saving
adminSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Hash admin code before saving
adminSchema.pre('save', async function (next) {
    if (!this.isModified('adminCode')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.adminCode = await bcrypt.hash(this.adminCode, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare admin code
adminSchema.methods.compareAdminCode = async function (candidateCode) {
    return await bcrypt.compare(candidateCode, this.adminCode);
};

// Method to update login attempts
adminSchema.methods.incrementLoginAttempts = async function () {
    this.loginAttempts += 1;

    // Lock account after 5 failed attempts for 15 minutes
    if (this.loginAttempts >= 5) {
        this.isLocked = true;
        this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    return this.save();
};

// Method to reset login attempts
adminSchema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.isLocked = false;
    this.lockedUntil = null;
    this.lastLogin = Date.now();

    return this.save();
};

module.exports = mongoose.model('Admin', adminSchema);
