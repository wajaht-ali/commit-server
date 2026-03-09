import express from "express";
import { generateCode } from "../controllers/aiController.js";
import sgMail from "@sendgrid/mail";

const router = express.Router();


// Set SendGrid API key from env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/report-bug", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json('All fields are required');
    }

    if (!process.env.SENDGRID_API_KEY || !process.env.RECEIVER_EMAIL) {
      return res.status(500).json('Email service not configured');
    }

    const value = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    };

    console.log("receiver email: ", process.env.RECEIVER_EMAIL);
    const msg = {
      to: process.env.RECEIVER_EMAIL,
      from: {
        name: 'Commit Bug Reporter',
        email: process.env.SENDER_EMAIL || 'noreply@yourdomain.com',
      },
      subject: `New Bug Report from ${value.name}`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">New Bug Report from Commit</h1>
          </div>
          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Sender Info -->
            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #4a5568;">
                <strong style="display: inline-block; width: 60px;">Name:</strong> ${value.name}
              </p>
              <p style="margin: 0; font-size: 15px; color: #4a5568;">
                <strong style="display: inline-block; width: 60px;">Email:</strong> 
                <a href="mailto:${value.email}" style="color: #667eea; text-decoration: none;">${value.email}</a>
              </p>
            </div>
            <!-- Message -->
            <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #4a5568; line-height: 1.6; white-space: pre-line;">${value.message}</p>
            </div>
            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="mailto:${value.email}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                Reply to ${value.name}
              </a>
            </div>
          </div>
        </div>
    `,
    };

    let send = await sgMail.send(msg);
    console.log("Email sent: ", send);

    res.status(200).send({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.log("Error sending message: ", error);
    res.status(500).json('Cannot send message');
  }
});

router.post("/code-generation", generateCode);

export { router as aiRoutes };
