const nodemailer = require('nodemailer');

// 邮箱配置列表（从环境变量读取）
// 格式：SMTP_账号名_HOST, SMTP_账号名_USER（端口和密码共用）
function getMailConfig(accountName) {
  const prefix = accountName ? `SMTP_${accountName.toUpperCase()}_` : 'SMTP_BOBOIP_';
  return {
    host: process.env[`${prefix}HOST`] || process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    user: process.env[`${prefix}USER`] || process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

// 创建邮件传输器
function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

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
    const { to, subject, html, account, from } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, html' });
    }

    // 获取邮箱配置（可指定账号名）
    const config = getMailConfig(account);
    
    if (!config.user || !config.pass) {
      return res.status(400).json({ 
        success: false, 
        message: account ? `Account "${account}" not configured` : 'Default SMTP not configured'
      });
    }

    const transporter = createTransporter(config);
    const fromName = process.env.FROM_NAME || 'BoboIP';
    const fromEmail = from || config.user;

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent',
      from: fromEmail
    });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
