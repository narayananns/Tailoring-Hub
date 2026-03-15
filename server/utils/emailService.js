const brevo = require('@getbrevo/brevo');

// Configure API key authorization: api-key
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Professional Email Template
const getEmailTemplate = (content, title) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #2c3e50; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .otp-box { background-color: #e8f5e9; border: 1px dashed #4CAF50; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2e7d32; letter-spacing: 5px; margin: 10px 0; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>TMMS</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Tailoring Machine Management System. All rights reserved.</p>
                <p>This email was sent to you because of an account action on TMMS.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const sendEmail = async (to, subject, htmlContent) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
        name: "TMMS Support",
        email: process.env.BREVO_USER // validation email (ensure this is authorized in Brevo)
    };
    sendSmtpEmail.to = [{ email: to }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Brevo API called successfully. Returned data: ' + JSON.stringify(data));
        return data;
    } catch (error) {
        console.error('Error calling Brevo API:', error);
        throw error;
    }
};

const sendOTP = async (email, otp, type = 'verification') => {
    const title = type === 'verification' ? 'Email Verification' : 'Password Reset';
    const message = type === 'verification'
        ? 'Please use the verification code below to activate your account.'
        : 'You requested a password reset. Use the code below to reset your password.';

    const content = `
        <h2 style="color: #2c3e50; margin-top: 0;">${title}</h2>
        <p>Hello,</p>
        <p>${message}</p>
        <div class="otp-box">
            <div style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 5px;">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #666;">Valid for 10 minutes</div>
        </div>
        <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
    `;

    return sendEmail(email, `${title} - TMMS`, getEmailTemplate(content, title));
};

const sendWelcomeEmail = async (email, name) => {
    const title = 'Welcome to TMMS';
    const content = `
        <h2 style="color: #2c3e50;">Welcome Aboard, ${name}! 🎉</h2>
        <p>Thank you for joining <strong>Tailoring Machine Management System</strong>.</p>
        <p>We are thrilled to have you with us. Your account has been successfully verified and activated.</p>
        <p>You can now:</p>
        <ul style="color: #444;">
            <li>Browse and buy quality tailoring machines</li>
            <li>Sell your used machines</li>
            <li>Book service appointments</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173" class="button" style="color: white;">Go to Dashboard</a>
        </div>
    `;

    return sendEmail(email, 'Welcome to TMMS! 🧵', getEmailTemplate(content, title));
};

const sendOrderStatusUpdate = async (email, orderId, status, additionalInfo = '') => {
    const title = `Order Status Update #${orderId}`;
    const statusColor = status === 'shipped' ? '#3b82f6' : status === 'delivered' ? '#22c55e' : status === 'cancelled' ? '#ef4444' : '#f59e0b';
    
    // Customize message based on status
    let message = '';
    let emoji = '';
    switch(status) {
        case 'confirmed':
            message = 'Great news! Your order has been confirmed and is being processed.';
            emoji = '✅';
            break;
        case 'shipped':
            message = 'Your order is on its way! It has been shipped from our warehouse.';
            emoji = '🚚';
            break;
        case 'delivered':
            message = 'Your order has been delivered! We hope you enjoy your purchase.';
            emoji = '📦';
            break;
        case 'cancelled':
            message = `Your order has been cancelled. ${additionalInfo ? `Reason: ${additionalInfo}` : ''}`;
            emoji = '❌';
            break;
        default:
            message = `Your order status has been updated to: ${status}`;
            emoji = 'ℹ️';
    }

    const content = `
        <h2 style="color: #2c3e50; margin-top: 0;">Order Status Update ${emoji}</h2>
        <p>Your order <strong>#${orderId}</strong> status has changed.</p>
        
        <div style="text-align: center; padding: 25px; background-color: #f8fafc; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">New Status</div>
            <div style="font-size: 28px; font-weight: 800; color: ${statusColor}; text-transform: capitalize; margin-bottom: 15px;">
                ${status}
            </div>
            <div style="height: 1px; background: #e2e8f0; width: 50%; margin: 15px auto;"></div>
            <p style="color: #334155; font-size: 16px; margin: 0;">${message}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/my-orders" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                View Order Details
            </a>
        </div>
        
        <p style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 20px;">
            If you have any questions, please reply to this email.
        </p>
    `;

    return sendEmail(email, `Order #${orderId} is ${status.charAt(0).toUpperCase() + status.slice(1)} ${emoji}`, getEmailTemplate(content, title));
};

module.exports = {
    sendOTP,
    sendWelcomeEmail,
    sendOrderStatusUpdate
};
