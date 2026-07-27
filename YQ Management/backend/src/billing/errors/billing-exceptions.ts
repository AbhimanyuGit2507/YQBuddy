import { HttpException, HttpStatus } from '@nestjs/common';

export class BillingException extends HttpException {
  constructor(message: string, statusCode = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }
}

export class PaymentFailedException extends BillingException {
  constructor(message = 'Payment processing failed') {
    super(message, HttpStatus.PAYMENT_REQUIRED);
  }
}

export class SubscriptionException extends BillingException {
  constructor(message = 'Subscription operation failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class PlanException extends BillingException {
  constructor(message = 'Plan operation failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class WebhookVerificationException extends BillingException {
  constructor(message = 'Webhook verification failed') {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class DuplicateWebhookException extends BillingException {
  constructor(message = 'Webhook already processed') {
    super(message, HttpStatus.OK);
  }
}

export class InsufficientPermissionsException extends BillingException {
  constructor(message = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class RateLimitException extends BillingException {
  constructor(message = 'Rate limit exceeded') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class InvalidTransactionException extends BillingException {
  constructor(message = 'Invalid transaction') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
