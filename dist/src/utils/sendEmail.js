import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
export const sendEmail = async (email, verificationToken) => {
    // Send a verification email
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env?.EMAIL_USERNAME,
            pass: process.env?.EMAIL_PASSWORD,
        },
    });
    const mailOptions = {
        from: "Hux Contact Manager",
        to: email,
        subject: 'Email Verification',
        html: `
    <html>
      <body>
        <h1>Welcome to Hux Manager</h1>
        <p>Use the code generated below to verify your:</p>
        <h2>${verificationToken}</h2>
      </body>
    </html>
  `,
    };
    await transporter.sendMail(mailOptions);
};
//# sourceMappingURL=sendEmail.js.map