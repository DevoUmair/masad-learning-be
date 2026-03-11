import sendEmail from "../sendMail.js";

export const sendEnrollmentEmail = async (email, name, courseTitle, amount) => {
    const subject = `Successfully Enrolled: ${courseTitle} 🎓`;
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
                background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
            }
            .content {
                padding: 40px 30px;
                line-height: 1.6;
                color: #1e293b;
            }
            .course-card {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
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
                <h1 style="margin: 0; font-size: 28px;">Enrollment Confirmed!</h1>
            </div>
            <div class="content">
                <h2 style="color: #0f172a;">Hi ${name},</h2>
                <p>Congratulations! You have successfully enrolled in the following course:</p>
                <div class="course-card">
                    <h3 style="margin: 0; color: #2563eb;">${courseTitle}</h3>
                    <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">Status: Enrolled & Paid</p>
                </div>
                <p>Your learning journey starts now. Click the button below to access your course content and begin studying.</p>
                <div class="button-container">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/student/courses" class="button">Go to Course</a>
                </div>
                <p>Happy learning!</p>
                <p>Best regards,<br>The Masad Learning Team</p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Masad Learning Academy. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail(email, subject, `Congratulations on enrolling in ${courseTitle}!`, html);
};
