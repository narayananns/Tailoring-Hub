const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"TMMS Support" <${process.env.BREVO_USER}>`, // sender address
            to, 
            subject, 
            html 
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
};

const sendOTP = async (email, otp, type = 'verification') => {
    const subject = type === 'verification' 
        ? 'Verify Your Email - TMMS' 
        : 'Password Reset OTP - TMMS';
        
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${type === 'verification' ? 'Email Verification' : 'Password Reset'}</h2>
            <p>Your OTP is: <strong style="font-size: 24px; color: #4CAF50;">${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

const sendWelcomeEmail = async (email, name) => {
    const subject = 'Welcome to TMMS!';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for registering with Tailoring Machine Management System.</p>
            <p>We are excited to have you on board.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

module.exports = {
    sendOTP,
    sendWelcomeEmail
};
