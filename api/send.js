const nodemailer = require('nodemailer');

// Zoho 邮箱 SMTP 配置
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,     // Zoho邮箱地址
    pass: process.env.SMTP_PASS,     // Zoho邮箱密码或应用专用密码
  },
});

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 验证密钥
  const authKey = req.headers['authorization'];
  if (authKey !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const fromName = process.env.FROM_NAME || 'BoboIP';
    const fromEmail = process.env.SMTP_USER;

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
    });

    return res.status(200).json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
