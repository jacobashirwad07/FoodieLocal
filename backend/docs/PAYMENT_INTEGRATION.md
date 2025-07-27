# Payment Integration Documentation

## Overview

This document describes the payment processing integration implemented for the hyperlocal food delivery platform. The integration uses Stripe as the payment processor and includes comprehensive error handling, retry mechanisms, and dummy credentials for testing.

## Features

### Core Payment Features
- **Payment Intent Creation**: Create secure payment intents for orders
- **Payment Confirmation**: Confirm payments and update order status
- **Refund Processing**: Handle full and partial refunds
- **Webhook Handling**: Process Stripe webhooks for payment status updates
- **Retry Mechanisms**: Automatic retry with exponential backoff for failed payments

### Security Features
- **Input Validation**: Comprehensive validation using express-validator
- **Authentication**: JWT-based authentication for all customer endpoints
- **Order Verification**: Verify order ownership and payment amounts
- **Webhook Security**: Stripe signature verification for webhooks
- **Environment Detection**: Separate handling for test and production environments

## API Endpoints

### Create Payment Intent
```http
POST /api/v1/payments/create-intent
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "orderId": "order_id_here",
  "amount": 37.50,
  "currency": "usd"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "amount": 3750,
    "currency": "usd"
  }
}
```

### Confirm Payment
```http
POST /api/v1/payments/confirm
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "paymentStatus": "paid",
    "orderStatus": "confirmed",
    "paymentIntentId": "pi_xxx"
  }
}
```

### Create Refund
```http
POST /api/v1/payments/refund
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "orderId": "order_id_here",
  "amount": 20.00,
  "reason": "requested_by_customer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "refundId": "ref_xxx",
    "refundAmount": 20.00,
    "refundStatus": "succeeded",
    "orderStatus": "cancelled",
    "paymentStatus": "refunded"
  }
}
```

### Retry Payment
```http
POST /api/v1/payments/retry
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "orderId": "order_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "paymentIntentId": "pi_xxx",
    "paymentStatus": "paid",
    "orderStatus": "confirmed",
    "retriesUsed": 2
  }
}
```

### Webhook Handler
```http
POST /api/v1/payments/webhook
Stripe-Signature: <stripe_signature>
Content-Type: application/json

<stripe_webhook_payload>
```

## Dummy Credentials for Testing

### Login Credentials
```javascript
const loginCredentials = {
  customer: {
    email: 'customer@test.com',
    password: 'testpassword123',
    name: 'Test Customer'
  },
  chef: {
    email: 'chef@test.com',
    password: 'testpassword123',
    name: 'Test Chef'
  },
  admin: {
    email: 'admin@test.com',
    password: 'testpassword123',
    name: 'Test Admin'
  }
};
```

### Test Card Numbers

#### Successful Payments
- **Visa**: `4242424242424242`
- **Visa Debit**: `4000056655665556`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`

#### Failed Payments
- **Declined**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **Expired Card**: `4000000000000069`
- **Incorrect CVC**: `4000000000000127`
- **Processing Error**: `4000000000000119`

#### Special Cases
- **3D Secure Required**: `4000002500003155`

All test cards use:
- **Expiry**: `12/2025`
- **CVC**: `123` (or `1234` for Amex)

## Payment Flow

### 1. Order Creation
1. Customer adds items to cart
2. Customer proceeds to checkout
3. Order is created with `status: 'pending'` and `paymentStatus: 'pending'`

### 2. Payment Intent Creation
1. Frontend calls `/api/v1/payments/create-intent`
2. Backend validates order and amount
3. Stripe payment intent is created
4. Client secret is returned to frontend

### 3. Payment Processing
1. Frontend uses Stripe.js to collect payment method
2. Payment is confirmed on frontend
3. Frontend calls `/api/v1/payments/confirm`
4. Backend verifies payment status with Stripe
5. Order status is updated accordingly

### 4. Webhook Processing
1. Stripe sends webhook events for payment status changes
2. Backend processes webhooks and updates order status
3. Ensures payment status synchronization

## Error Handling

### Payment Failures
- **Declined Cards**: Return appropriate error codes
- **Network Issues**: Automatic retry with exponential backoff
- **Invalid Data**: Validation errors with detailed messages
- **Authentication**: JWT token validation

### Retry Mechanism
```javascript
// Exponential backoff: 2s, 4s, 8s
const delay = Math.pow(2, attempt) * 1000;
```

### Error Codes
- `PAYMENT_INTENT_CREATION_FAILED`
- `PAYMENT_CONFIRMATION_FAILED`
- `PAYMENT_FAILED`
- `REFUND_CREATION_FAILED`
- `PAYMENT_RETRY_EXHAUSTED`
- `WEBHOOK_PROCESSING_FAILED`
- `ORDER_NOT_FOUND`
- `AMOUNT_MISMATCH`
- `INVALID_PAYMENT_STATUS`

## Environment Configuration

> **Note:**  
> The `STRIPE_SECRET_KEY` environment variable is **required** for payment integration.  
> For local development/testing, use a Stripe test key (e.g., `sk_test_dummy_key_for_testing`).  
> For production, use your real Stripe secret key.

### Required Environment Variables
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Test Environment
```bash
NODE_ENV=test
STRIPE_SECRET_KEY=sk_test_dummy_key_for_testing
STRIPE_WEBHOOK_SECRET=whsec_test_dummy_webhook_secret
```

## Usage Examples

### Using Dummy Credentials
```javascript
const { getDummyCredentials } = require('./utils/dummyPaymentCredentials');

// Get successful payment credentials
const successCredentials = getDummyCredentials('successfulPayment');
console.log(successCredentials.card.number); // 4242424242424242

// Get declined payment credentials
const declinedCredentials = getDummyCredentials('declinedPayment');
console.log(declinedCredentials.card.number); // 4000000000000002
```

### Testing Payment Scenarios
```javascript
const scenarios = [
  'successfulPayment',
  'declinedPayment',
  'insufficientFunds',
  'expiredCard',
  'incorrectCvc',
  'processingError',
  'requiresAuthentication'
];

scenarios.forEach(scenario => {
  const credentials = getDummyCredentials(scenario);
  // Use credentials for testing
});
```

## Security Considerations

### Production Deployment
1. Use real Stripe keys (not test keys)
2. Configure webhook endpoints with proper signatures
3. Enable HTTPS for all payment endpoints
4. Implement rate limiting for payment endpoints
5. Monitor payment failures and fraud attempts

### Data Protection
- Payment card data never stored in database
- All sensitive operations use Stripe's secure APIs
- Webhook signatures verified for authenticity
- JWT tokens required for all customer operations

## Monitoring and Logging

### Payment Events
- Payment intent creation
- Payment confirmations
- Refund processing
- Webhook events
- Retry attempts

### Error Tracking
- Failed payment attempts
- Webhook processing errors
- Network timeouts
- Invalid requests

## Testing

### Running Tests
```bash
# Run payment service tests
npm test -- --testPathPattern="paymentService"

# Run payment integration tests
npm test -- --testPathPattern="paymentRoutes"
```

### Demo Script
```bash
# Run payment integration demo
node demo/paymentDemo.js
```

## Troubleshooting

### Common Issues

1. **Stripe Key Not Set**
   - Ensure `STRIPE_SECRET_KEY` environment variable is set
   - Use test keys for development/testing

2. **Webhook Signature Verification Failed**
   - Check `STRIPE_WEBHOOK_SECRET` configuration
   - Ensure webhook endpoint is correctly configured in Stripe dashboard

3. **Payment Intent Creation Failed**
   - Verify order exists and belongs to authenticated user
   - Check amount matches order total
   - Ensure Stripe account is properly configured

4. **Order Not Found**
   - Verify order ID is valid MongoDB ObjectId
   - Check user has permission to access the order

### Debug Mode
Set `NODE_ENV=development` for detailed logging of payment operations.

## Support

For issues related to payment integration:
1. Check error logs for specific error codes
2. Verify environment configuration
3. Test with dummy credentials first
4. Check Stripe dashboard for payment details
5. Review webhook delivery logs in Stripe dashboard