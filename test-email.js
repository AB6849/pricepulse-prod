import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log("Testing Gmail Nodemailer Integration...");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASSWORD in .env");
    console.log("Please ensure you have added them like this:");
    console.log("EMAIL_USER=traben.help@gmail.com");
    console.log("EMAIL_PASSWORD=your-16-char-app-password");
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function testEmail() {
    try {
        const info = await transporter.sendMail({
            from: `"PricePulse Admin" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self as a test
            subject: "Test Email from PricePulse",
            text: "If you are reading this, your Gmail integration is working!",
            html: "<h3>Success!</h3><p>If you are reading this, your Gmail integration is working!</p>"
        });
        console.log("✅ Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Failed to send email:");
        console.error(error);
    }
}

testEmail();
