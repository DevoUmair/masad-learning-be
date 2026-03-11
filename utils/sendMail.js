import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, text, html) => {
    // 1. Move the transporter INSIDE the function
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `Masad Learning <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
    };

    // Return the promise so the server can await it
    return transporter.sendMail(mailOptions);
};

export default sendEmail;