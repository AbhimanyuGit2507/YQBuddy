export interface EmailMessage {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: { name: string; email: string };
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
  testConnection(): Promise<boolean>;
}
