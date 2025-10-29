import nodemailer from 'nodemailer';
import { getForgotPasswordTemplate } from './emailTemplates.js';


export const sendPasswordResetEmail = async (email, resetLink, userName) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: 'Code Commit',
        address: process.env.SENDER_EMAIL
      },
      to: email,
      subject: 'Reset Your Code Commit Password',
      html: getForgotPasswordTemplate(resetLink, userName),
    };

    const result = await transporter.sendMail(mailOptions);
    return result;

  } catch (error) {
    throw error;
  }
};
