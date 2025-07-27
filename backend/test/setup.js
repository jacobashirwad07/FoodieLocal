// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy_webhook_secret';

// Suppress console.log during tests
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
}