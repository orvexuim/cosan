import nodemailer from 'nodemailer';
import config from '../config/env.js';
import { logger } from '../utils/logger.js';

// Setup Transporter using SMTP configs
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const BRAND_NAME = 'COSMAN';
const COLOR_GOLD = '#C9A84C';
const COLOR_BLACK = '#0A0A0A';
const COLOR_CREAM = '#F5F0E8';

/**
 * Generate a luxury HTML wrapper with COSMAN branding
 * @param {string} title - Email section title
 * @param {string} bodyContent - Email unique HTML content
 * @returns {string} Fully responsive styled HTML
 */
const getLuxuryTemplate = (title, bodyContent) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: ${COLOR_CREAM};
          font-family: 'Cinzel', 'Didot', 'Playfair Display', 'Helvetica Neue', Arial, sans-serif;
          color: ${COLOR_BLACK};
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: ${COLOR_CREAM};
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #FFFFFF;
          border: 1px solid #E5DCC6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: ${COLOR_BLACK};
          padding: 30px;
          text-align: center;
          border-bottom: 2px solid ${COLOR_GOLD};
        }
        .logo {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 6px;
          color: #FFFFFF;
          text-decoration: none;
          text-transform: uppercase;
        }
        .tagline {
          font-size: 10px;
          color: ${COLOR_GOLD};
          letter-spacing: 4px;
          margin-top: 5px;
          text-transform: uppercase;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.8;
          font-size: 15px;
          letter-spacing: 0.5px;
        }
        .title {
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
          border-bottom: 1px solid #F0EAE1;
          padding-bottom: 15px;
          margin-top: 0;
          margin-bottom: 25px;
          text-align: center;
        }
        .btn-container {
          text-align: center;
          margin: 35px 0;
        }
        .btn {
          background-color: ${COLOR_BLACK};
          color: #FFFFFF !important;
          padding: 15px 35px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: bold;
          text-decoration: none;
          border: 1px solid ${COLOR_GOLD};
          display: inline-block;
          transition: all 0.3s ease;
        }
        .footer {
          background-color: #FBF9F6;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #F0EAE1;
          font-size: 11px;
          color: #777777;
          letter-spacing: 1px;
        }
        .footer-logo {
          font-size: 16px;
          color: ${COLOR_BLACK};
          letter-spacing: 3px;
          font-weight: 400;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .divider {
          height: 1px;
          background-color: ${COLOR_GOLD};
          width: 50px;
          margin: 20px auto;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">${BRAND_NAME}</div>
            <div class="tagline">Haute Couture & Luxury Living</div>
          </div>
          <div class="content">
            <h1 class="title">${title}</h1>
            ${bodyContent}
          </div>
          <div class="footer">
            <div class="footer-logo">${BRAND_NAME}</div>
            <p>You are receiving this email because you registered on our luxury platform.</p>
            <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME} Maison. All Rights Reserved.</p>
            <div class="divider"></div>
            <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px;">Paris &bull; Milan &bull; London &bull; New York</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const emailService = {
  /**
   * Send Email helper
   */
  async sendEmail({ to, subject, html }) {
    try {
      const mailOptions = {
        from: `"${BRAND_NAME} Maison" <${config.email.user}>`,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`📧 Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('❌ Failed to send email via Nodemailer:', error);
      // We do not block thread execution but log the error
    }
  },

  /**
   * Send Email verification token
   */
  async sendVerificationEmail(email, token, firstName) {
    const verifyUrl = `${config.app.url}/api/auth/verify-email?token=${token}`;
    const subject = `Verify Your ${BRAND_NAME} Account`;
    const title = 'Confirm Your Registry';
    const content = `
      <p>Dear ${firstName},</p>
      <p>Thank you for registering at ${BRAND_NAME} Maison. We are pleased to welcome you into our elite circle of distinguished patrons.</p>
      <p>To finalize the creation of your account, please confirm your email address by clicking the luxurious button below:</p>
      <div class="btn-container">
        <a href="${verifyUrl}" class="btn">Verify Account</a>
      </div>
      <p>Or copy and paste this link into your private browser:</p>
      <p style="font-size: 12px; color: #888888; word-break: break-all;">${verifyUrl}</p>
      <p>Warmest regards,<br><strong>The ${BRAND_NAME} Client Relations Team</strong></p>
    `;

    const html = getLuxuryTemplate(title, content);
    await this.sendEmail({ to: email, subject, html });
  },

  /**
   * Send password reset request email
   */
  async sendPasswordResetEmail(email, token, firstName) {
    const resetUrl = `${config.app.url}/api/auth/reset-password?token=${token}`;
    const subject = `${BRAND_NAME} - Password Reset Request`;
    const title = 'Reset Your Password';
    const content = `
      <p>Dear ${firstName},</p>
      <p>We received a request to reset the password associated with your ${BRAND_NAME} membership.</p>
      <p>To safely choose a new password, please click the secure button below within the next hour:</p>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p>Or copy and paste this URL into your browser:</p>
      <p style="font-size: 12px; color: #888888; word-break: break-all;">${resetUrl}</p>
      <p>If you did not request this change, you can safely ignore this email; your security credentials remain perfectly secure.</p>
      <p>Sincerely yours,<br><strong>${BRAND_NAME} Security Operations</strong></p>
    `;

    const html = getLuxuryTemplate(title, content);
    await this.sendEmail({ to: email, subject, html });
  },

  /**
   * Notify that the password changed successfully
   */
  async sendPasswordChangedNotification(email, firstName) {
    const subject = `${BRAND_NAME} - Security Alert: Password Updated`;
    const title = 'Security Confirmation';
    const content = `
      <p>Dear ${firstName},</p>
      <p>This is a formal confirmation that the password for your ${BRAND_NAME} account has been updated successfully.</p>
      <p>If you authorized this change, no further action is required.</p>
      <p><strong>If you did not make this modification, please contact our Elite Client Services immediately.</strong></p>
      <p>With appreciation,<br><strong>${BRAND_NAME} Security Operations</strong></p>
    `;

    const html = getLuxuryTemplate(title, content);
    await this.sendEmail({ to: email, subject, html });
  },

  /**
   * Send welcoming email
   */
  async sendWelcomeEmail(email, firstName) {
    const subject = `Welcome to ${BRAND_NAME} Maison`;
    const title = 'Welcome to the Maison';
    const content = `
      <p>Dear ${firstName},</p>
      <p>It is an honor to welcome you to <strong>${BRAND_NAME} Maison</strong>. As a registered patron, you now hold private access to our curated collections of pure luxury, bespoke pieces, and seasonal private sales.</p>
      <p>Our digital styling concierge is available to assist you in curating an extraordinary wardrobe tailored exclusively to your tastes.</p>
      <div class="btn-container">
        <a href="${config.app.url}" class="btn">Explore the Collections</a>
      </div>
      <p>If there is any manner in which we may elevate your shopping experience, do not hesitate to reach out.</p>
      <p>With our highest compliments,<br><strong>The ${BRAND_NAME} Director</strong></p>
    `;

    const html = getLuxuryTemplate(title, content);
    await this.sendEmail({ to: email, subject, html });
  },

  /**
   * Send Order Confirmation
   */
  async sendOrderConfirmation(email, order, firstName) {
    const subject = `Your ${BRAND_NAME} Order Confirmation - ${order.orderNumber}`;
    const title = 'Order Confirmed';
    const content = `
      <p>Dear ${firstName},</p>
      <p>We are delighted to confirm that your luxury order has been received and is currently being processed with the utmost attention and discretion by our boutique staff.</p>
      <p style="font-size: 16px; font-weight: bold; color: ${COLOR_GOLD}; text-align: center; margin: 20px 0;">
        Order Reference: ${order.orderNumber}
      </p>
      <div style="border: 1px solid #F0EAE1; padding: 20px; background-color: #FAFAFA; margin: 20px 0;">
        <h3 style="margin-top: 0; font-weight: normal; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Summary of Charges</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0; color: #555555;">Subtotal</td>
            <td style="padding: 5px 0; text-align: right;">$${order.subtotal.toFixed(2)}</td>
          </tr>
          ${order.discount > 0 ? `
          <tr>
            <td style="padding: 5px 0; color: #555555;">Maison Discount</td>
            <td style="padding: 5px 0; text-align: right; color: #B33A3A;">-$${order.discount.toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 5px 0; color: #555555;">Shipping & Insured Delivery</td>
            <td style="padding: 5px 0; text-align: right;">$${order.shippingCost.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 1px solid #CCCCCC; font-weight: bold;">
            <td style="padding: 10px 0; font-size: 16px;">Total Charged</td>
            <td style="padding: 10px 0; text-align: right; font-size: 16px; color: ${COLOR_GOLD};">$${order.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <p>We will notify you immediately once your luxury pieces have been dispatched under fully insured, high-security transit.</p>
      <p>With warm regards,<br><strong>${BRAND_NAME} Logistics Division</strong></p>
    `;

    const html = getLuxuryTemplate(title, content);
    await this.sendEmail({ to: email, subject, html });
  },

  /**
   * Send Order Status Update
   */
  async sendOrderStatusUpdate(email, order, firstName) {
    const subject = `Your ${BRAND_NAME} Order Status Update - ${order.orderNumber}`;
    const title = 'Order Status Updated';
    const content = `
      <p>Dear ${firstName},</p>
      <p>We wish to provide you with a status update regarding your order with reference number <strong>${order.orderNumber}</strong>.</p>
      <p>The current status of your order is:</p>
      <p style="font-size: 20px; font-weight: bold; color: ${COLOR_GOLD}; text-align: center; text-transform: uppercase; margin: 25px 0; letter-spacing: 2px;">
        ${order.status}
      </p>
      ${order.trackingNumber ? `
      <div style="border: 1px solid #F0EAE1; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #777777;">Tracking Information</p>
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${COLOR_BLACK};">Carrier: ${order.carrier || 'Global Luxury Courier'}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">Tracking Code: <span style="color: ${COLOR_GOLD};">${order.trackingNumber}</span></p>
      </div>` : ''}
      <p>If you have any questions or require additional delivery specifications, please contact our concierge suite.</p>
      <p>With compliments,<br><strong>The ${BRAND_NAME} Fulfillment Team</strong></p>
    `;

    const html = getLuxuryTemplate(title, content);
    await this.sendEmail({ to: email, subject, html });
  }
};

export default emailService;
