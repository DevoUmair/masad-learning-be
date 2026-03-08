import sendEmail from "../sendMail.js";

export const sendWelcomeEmail = async (email, name) => {
    const subject = "Welcome to Masad Learning Academy! 🚀";
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
            }
            .content {
                padding: 40px 30px;
                line-height: 1.6;
                color: #1e293b;
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            .button {
                background-color: #2563eb;
                color: white !important;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;
            }
            .footer {
                background-color: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
            }
        </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Welcome to Masad Learning!</h1>
            </div>
            <div class="content">
                <h2 style="color: #0f172a;">Hi ${name},</h2>
                <p>We're thrilled to have you join our community of learners. At Masad Learning Academy, we're dedicated to helping you achieve your professional goals through high-quality courses and expert instruction.</p>
                <p>Start exploring our course catalog and take the first step towards mastering your next skill.</p>
                <div class="button-container">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/student/courses" class="button">Explore Courses</a>
                </div>
                <p>If you have any questions, feel free to reply to this email. Our support team is here to help!</p>
                <p>Best regards,<br>The Masad Learning Team</p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Masad Learning Academy. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail(email, subject, `Welcome to Masad Learning, ${name}!`, html);
};