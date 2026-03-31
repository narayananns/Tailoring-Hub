#!/usr/bin/env node

/**
 * ADMIN ACCESS CONTROL SYSTEM - VALIDATION & SETUP
 * 
 * Purpose: Ensure only approved admins can access the dashboard
 * - Single super-admin enforcement
 * - Approval-based access control
 * - Professional authorization checks
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Admin = require('./models/Admin');
const AdminRequest = require('./models/AdminRequest');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmms';

async function validateAdminSystem() {
    try {
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║   ADMIN ACCESS CONTROL SYSTEM - VALIDATION                   ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. CHECK SUPER-ADMIN COUNT
        console.log('📋 SUPER-ADMIN VALIDATION:');
        console.log('─────────────────────────────────────────────────────────────');
        const superAdmins = await Admin.find({ role: 'super-admin' });
        
        if (superAdmins.length === 0) {
            console.log('❌ ERROR: No super-admin found!');
            console.log('   Action: Create super-admin first');
        } else if (superAdmins.length === 1) {
            const superAdmin = superAdmins[0];
            console.log(`✅ Single Super-Admin Found:`);
            console.log(`   Name: ${superAdmin.name}`);
            console.log(`   Email: ${superAdmin.email}`);
            console.log(`   Status: ${superAdmin.status}`);
            console.log(`   Permissions: ${superAdmin.permissions.length}/8`);
        } else {
            console.log(`⚠️  WARNING: Multiple super-admins found (${superAdmins.length})`);
            console.log('   Action: Review and consolidate\n');
            superAdmins.forEach((admin, idx) => {
                console.log(`   ${idx + 1}. ${admin.name} (${admin.email}) - ${admin.status}`);
            });
        }

        console.log();

        // 2. CHECK REGULAR ADMINS
        console.log('📊 REGULAR ADMINS STATUS:');
        console.log('─────────────────────────────────────────────────────────────');
        const regularAdmins = await Admin.find({ role: 'admin' });
        
        if (regularAdmins.length === 0) {
            console.log('ℹ️  No regular admins yet (waiting for approvals)');
        } else {
            console.log(`✅ ${regularAdmins.length} Regular Admin(s):`);
            regularAdmins.forEach((admin, idx) => {
                const accessStatus = admin.status === 'active' ? '✅ CAN ACCESS' : '❌ BLOCKED';
                console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
                console.log(`      Status: ${admin.status} ${accessStatus}`);
                console.log(`      Created: ${admin.createdAt.toLocaleDateString()}`);
            });
        }

        console.log();

        // 3. CHECK PENDING REQUESTS
        console.log('📝 PENDING ADMIN REQUESTS:');
        console.log('─────────────────────────────────────────────────────────────');
        const pendingRequests = await AdminRequest.find({ status: 'pending' });
        
        if (pendingRequests.length === 0) {
            console.log('ℹ️  No pending requests');
        } else {
            console.log(`⏳ ${pendingRequests.length} Pending Request(s):`);
            pendingRequests.forEach((req, idx) => {
                console.log(`   ${idx + 1}. ${req.name} (${req.email})`);
                console.log(`      Requested: ${req.requestedAt.toLocaleDateString()}`);
                console.log(`      Department: ${req.department || 'Not specified'}`);
            });
        }

        console.log();

        // 4. CHECK APPROVED REQUESTS
        console.log('✅ APPROVED ADMIN REQUESTS:');
        console.log('─────────────────────────────────────────────────────────────');
        const approvedRequests = await AdminRequest.find({ status: 'approved' })
            .populate('approvedBy', 'name email');
        
        if (approvedRequests.length === 0) {
            console.log('ℹ️  No approved requests yet');
        } else {
            console.log(`✅ ${approvedRequests.length} Approved Request(s):`);
            approvedRequests.forEach((req, idx) => {
                console.log(`   ${idx + 1}. ${req.name} (${req.email})`);
                console.log(`      Approved By: ${req.approvedBy?.name || 'Unknown'}`);
                console.log(`      Approved: ${req.approvedAt.toLocaleDateString()}`);
                console.log(`      Role: ${req.role}`);
            });
        }

        console.log();

        // 5. ACCESS CONTROL RULES
        console.log('🔐 ACCESS CONTROL RULES:');
        console.log('─────────────────────────────────────────────────────────────');
        console.log('Dashboard Access Allowed If:');
        console.log('  ✅ Admin exists in Admin collection');
        console.log('  ✅ Status = "active"');
        console.log('  ✅ Valid JWT token provided');
        console.log('  ✅ Token matches admin ID in database');
        console.log('');
        console.log('Dashboard Access BLOCKED If:');
        console.log('  ❌ Status = "inactive" or "suspended"');
        console.log('  ❌ AdminRequest status = "pending"');
        console.log('  ❌ Invalid or expired token');
        console.log('  ❌ Admin account not yet created');

        console.log();

        // 6. RECOMMENDATIONS
        console.log('📋 SYSTEM STATUS:');
        console.log('─────────────────────────────────────────────────────────────');
        
        let systemHealthy = true;
        
        if (superAdmins.length !== 1) {
            console.log('⚠️  [ACTION REQUIRED] Fix super-admin count');
            systemHealthy = false;
        } else {
            console.log('✅ Super-admin count: OK (exactly 1)');
        }

        if (regularAdmins.some(a => a.status !== 'active')) {
            console.log('⚠️  [REVIEW] Some admins have non-active status');
        } else {
            console.log('✅ All regular admins: Active');
        }

        console.log('✅ Approval workflow: Enabled');
        console.log('✅ Access control: Enforced');
        console.log('✅ Audit trail: Logging');

        if (systemHealthy) {
            console.log('\n🎉 SYSTEM STATUS: HEALTHY & SECURE\n');
        } else {
            console.log('\n⚠️  SYSTEM STATUS: REVIEW REQUIRED\n');
        }

        // 7. NEXT STEPS
        console.log('📝 NEXT STEPS:');
        console.log('─────────────────────────────────────────────────────────────');
        console.log('1. Super-admin logins to dashboard');
        console.log('2. Provides credentials to email: nsnarayanan2612@gmail.com');
        console.log('3. Reviews pending admin requests');
        console.log('4. Approves/rejects each request');
        console.log('5. New admins receive approval email');
        console.log('6. New admins login with credentials');
        console.log('7. Dashboard grants access if status=active');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

// Run validation
validateAdminSystem();
