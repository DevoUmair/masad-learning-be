import sendEmail from "../sendMail.js";

export const sendCertificateEmail = async (email, name, courseTitle) => {
    const subject = `Certification Achievement: ${courseTitle} 🏆`;
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
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
            }
            .content {
                padding: 40px 30px;
                line-height: 1.6;
                color: #1e293b;
            }
            .achievement-box {
                border: 2px dashed #f59e0b;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                background-color: #fffbeb;
                margin: 25px 0;
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            .button {
                background-color: #f59e0b;
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
                <h1 style="margin: 0; font-size: 28px;">Achievement Unlocked!</h1>
            </div>
            <div class="content">
                <h2 style="color: #0f172a;">Bravo, ${name}!</h2>
                <p>Your hard work and dedication have paid off. We're incredibly proud to announce that you have successfully completed:</p>
                <div class="achievement-box">
                    <h3 style="margin: 0; color: #92400e;">${courseTitle}</h3>
                    <p style="margin: 10px 0 0 0; color: #b45309; font-weight: 500;">Official Certificate Earned</p>
                </div>
                <p>Your professional certificate is now available in your dashboard. You can download it as a high-quality PDF or share it directly on LinkedIn to showcase your milestone.</p>
                <div class="button-container">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/student/certificates" class="button">View My Certificate</a>
                </div>
                <p>Keep up the great momentum!</p>
                <p>Best regards,<br>The Masad Learning Team</p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Masad Learning Academy. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail(email, subject, `Congratulations on earning your certificate for ${courseTitle}!`, html);
};
