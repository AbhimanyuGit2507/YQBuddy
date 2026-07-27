import { Injectable, Logger } from '@nestjs/common';

export interface TemplateVariables {
  [key: string]: string | number | undefined;
}

export interface Template {
  subject?: string;
  html: string;
  text?: string;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  private readonly emailTemplates: Record<string, Template> = {
    signup_otp: {
      subject: 'Verify your QMover Account',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">QMover</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Verify Your Email</h2>
    <p style="color: #4b5563; line-height: 1.6;">Thank you for signing up! Please use the following code to verify your email address:</p>
    <div style="background: #ffffff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{otp}}</span>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Team</p>
  </div>
</body>
</html>`,
      text: `Your QMover verification code is: {{otp}}\n\nThis code will expire in 10 minutes.`,
    },
    login_otp: {
      subject: 'Your QMover Login Code',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">QMover</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Your Login Code</h2>
    <p style="color: #4b5563; line-height: 1.6;">Use the following code to sign in to your QMover account:</p>
    <div style="background: #ffffff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{otp}}</span>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Team</p>
  </div>
</body>
</html>`,
      text: `Your QMover login code is: {{otp}}\n\nThis code will expire in 10 minutes.`,
    },
    login_notification: {
      subject: 'New login to your QMover Account',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">QMover Security</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">New Login Detected</h2>
    <p style="color: #4b5563; line-height: 1.6;">We detected a new login to your QMover account at <strong>{{timestamp}}</strong>.</p>
    <p style="color: #4b5563; line-height: 1.6;">If this was you, no action is needed. If you did not sign in, please secure your account immediately.</p>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Security Team</p>
  </div>
</body>
</html>`,
      text: `We detected a new login to your QMover account at {{timestamp}}.`,
    },
    welcome: {
      subject: 'Welcome to QMover!',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to QMover</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Hello {{name}}, welcome aboard!</h2>
    <p style="color: #4b5563; line-height: 1.6;">We're excited to have you on board. QMover helps you manage queues efficiently and keep your customers informed.</p>
    <p style="color: #4b5563; line-height: 1.6;">Get started by setting up your first queue and connecting your WhatsApp account.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Team</p>
  </div>
</body>
</html>`,
      text: `Welcome to QMover, {{name}}!\n\nWe're excited to have you on board.`,
    },
    payment_success: {
      subject: 'Payment Successful',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Payment Successful</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Thank You for Your Payment</h2>
    <p style="color: #4b5563; line-height: 1.6;">Your payment of <strong>{{amount}} {{currency}}</strong> for workspace <strong>"{{workspace}}"</strong> has been processed successfully.</p>
    <p style="color: #4b5563; line-height: 1.6;">Your subscription is now active. You can continue using all features of QMover.</p>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Billing Team</p>
  </div>
</body>
</html>`,
      text: `Your payment of {{amount}} {{currency}} for workspace "{{workspace}}" has been processed successfully.`,
    },
    payment_failed: {
      subject: 'Payment Failed',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Payment Failed</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Action Required</h2>
    <p style="color: #4b5563; line-height: 1.6;">Your payment for workspace <strong>"{{workspace}}"</strong> has failed. Please update your payment method to avoid service interruption.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Update Payment Method</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Billing Team</p>
  </div>
</body>
</html>`,
      text: `Your payment for workspace "{{workspace}}" has failed. Please update your payment method.`,
    },
    trial_ending: {
      subject: 'Trial Ending Soon',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Trial Ending Soon</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Your Trial Ends in {{days}} Days</h2>
    <p style="color: #4b5563; line-height: 1.6;">Your trial for workspace <strong>"{{workspace}}"</strong> will end in <strong>{{days}}</strong> days. Please select a plan to continue using the service.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Choose a Plan</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Billing Team</p>
  </div>
</body>
</html>`,
      text: `Your trial for workspace "{{workspace}}" will end in {{days}} days.`,
    },
    subscription_renewed: {
      subject: 'Subscription Renewed',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Subscription Renewed</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Your Subscription Has Been Renewed</h2>
    <p style="color: #4b5563; line-height: 1.6;">Your subscription for workspace <strong>"{{workspace}}"</strong> has been renewed. Next billing date: <strong>{{next_billing_date}}</strong>.</p>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Billing Team</p>
  </div>
</body>
</html>`,
      text: `Your subscription for workspace "{{workspace}}" has been renewed.`,
    },
    subscription_cancelled: {
      subject: 'Subscription Cancelled',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Subscription Cancelled</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Your Subscription Has Been Cancelled</h2>
    <p style="color: #4b5563; line-height: 1.6;">Your subscription for workspace <strong>"{{workspace}}"</strong> has been cancelled. You can still use the service until the end of your current billing period.</p>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Billing Team</p>
  </div>
</body>
</html>`,
      text: `Your subscription for workspace "{{workspace}}" has been cancelled.`,
    },
    subscription_expired: {
      subject: 'Subscription Expired',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Subscription Expired</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Renew Your Subscription</h2>
    <p style="color: #4b5563; line-height: 1.6;">Your subscription for workspace <strong>"{{workspace}}"</strong> has expired. Please renew to continue using the service.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Renew Now</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Billing Team</p>
  </div>
</body>
</html>`,
      text: `Your subscription for workspace "{{workspace}}" has expired.`,
    },
    payment_reminder: {
      subject: 'Payment Reminder',
      html: `<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Payment Reminder</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Payment Due Soon</h2>
    <p style="color: #4b5563; line-height: 1.6;">This is a reminder that your payment of <strong>{{amount}} {{currency}}</strong> for workspace <strong>"{{workspace}}"</strong> is due soon.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Make Payment</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Best regards,<br/>The QMover Billing Team</p>
  </div>
</body>
</html>`,
      text: `Your payment of {{amount}} {{currency}} for workspace "{{workspace}}" is due soon.`,
    },
  };

  private readonly whatsappTemplates: Record<string, string> = {
    otp: 'Your Qmover verification code is {{otp}}. It expires in 5 minutes.',
    queue_joined:
      'Hello {{name}}! You have successfully joined the queue. You are #{{position}} in line. Track your status here: {{link}}',
    position_update:
      'Hello {{name}}, you are now #{{position}} in the queue for {{queue_name}}. Estimated wait: {{wait_time}} mins.',
    near_turn: 'Hi {{name}}, you are next in line! Get ready. {{queue_name}}',
    now_serving:
      'Hi {{name}}, it is your turn now! Please proceed to the counter. {{queue_name}}',
    delay:
      'Hi {{name}}, there is a slight delay in {{queue_name}}. We will notify you when it is your turn. Estimated wait: {{wait_time}} mins.',
    queue_closed:
      'Hello {{name}}, the queue {{queue_name}} is now closed. Thank you for your patience.',
    queue_cancelled:
      'Hello {{name}}, your position in {{queue_name}} has been cancelled. You can rejoin the queue if needed.',
    feedback:
      'Thanks for visiting {{queue_name}}! Please reply with a number from 1 to 5 to rate your experience (5 being excellent).',
    thank_you:
      'Thank you for visiting {{queue_name}}, {{name}}! We hope to see you again soon.',
  };

  renderEmail(templateKey: string, variables: TemplateVariables): Template {
    const template = this.emailTemplates[templateKey];
    if (!template) {
      this.logger.warn(
        `Email template "${templateKey}" not found, falling back to generic`,
      );
      return {
        subject: 'QMover Notification',
        html: `<p>{{message}}</p>`,
        text: '{{message}}',
      };
    }

    let html = template.html;
    let text = template.text || '';
    let subject = template.subject || 'QMover Notification';

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(placeholder, String(value ?? ''));
      text = text.replace(placeholder, String(value ?? ''));
      subject = subject.replace(placeholder, String(value ?? ''));
    }

    return { subject, html, text };
  }

  renderWhatsApp(templateKey: string, variables: TemplateVariables): string {
    const template = this.whatsappTemplates[templateKey];
    if (!template) {
      this.logger.warn(`WhatsApp template "${templateKey}" not found`);
      return '';
    }

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, String(value ?? ''));
    }
    return result;
  }

  getEmailTemplateKeys(): string[] {
    return Object.keys(this.emailTemplates);
  }

  getWhatsAppTemplateKeys(): string[] {
    return Object.keys(this.whatsappTemplates);
  }
}
