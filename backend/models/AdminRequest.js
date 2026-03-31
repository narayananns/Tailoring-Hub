const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminRequestSchema = new mongoose.Schema({
    // Request Information
    name: {
        type: String,
        required: [true, 'Admin name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Admin email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
        unique: true
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
    
    // Request Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    // Approval Information
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    
    // Role Assignment
    role: {
        type: String,
        enum: ['admin', 'super-admin'],
        default: 'admin'
    },
    
    // Permissions (for approved admins)
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
    
    // Request Details
    requestedAt: {
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    department: {
        type: String,
        trim: true
    },
    
    // Activity Tracking
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt before saving
adminRequestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Hash password before saving
adminRequestSchema.pre('save', async function (next) {
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
adminRequestSchema.pre('save', async function (next) {
    if (!this.isModified('adminCode')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.adminCode = await bcrypt.hash(this.adminCode, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password
adminRequestSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Compare admin code
adminRequestSchema.methods.compareAdminCode = async function (adminCode) {
    return await bcrypt.compare(adminCode, this.adminCode);
};

// Get request summary (for admin review)
adminRequestSchema.methods.getSummary = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        status: this.status,
        reason: this.reason,
        department: this.department,
        requestedAt: this.requestedAt,
        approvedBy: this.approvedBy,
        approvedAt: this.approvedAt,
        rejectionReason: this.rejectionReason,
        rejectedAt: this.rejectedAt,
        permissions: this.permissions
    };
};

module.exports = mongoose.model('AdminRequest', adminRequestSchema);
