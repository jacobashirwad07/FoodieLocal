/**
 * Dummy payment credentials for testing purposes
 * These should be used in development/testing environments only
 */

const DUMMY_PAYMENT_CREDENTIALS = {
  // Stripe test card numbers
  testCards: {
    visa: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Visa - Always succeeds'
    },
    visaDebit: {
      number: '4000056655665556',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Visa Debit - Always succeeds'
    },
    mastercard: {
      number: '5555555555554444',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Mastercard - Always succeeds'
    },
    amex: {
      number: '378282246310005',
      exp_month: 12,
      exp_year: 2025,
      cvc: '1234',
      description: 'American Express - Always succeeds'
    },
    declined: {
      number: '4000000000000002',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Visa - Always declined'
    },
    insufficientFunds: {
      number: '4000000000009995',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Visa - Insufficient funds'
    },
    expiredCard: {
      number: '4000000000000069',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Visa - Expired card'
    },
    incorrectCvc: {
      number: '4000000000000127',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Visa - Incorrect CVC'
    },
    processingError: {
      number: '4000000000000119',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
      description: 'Visa - Processing error'
    }
  },

  // Test customer data
  testCustomers: {
    validCustomer: {
      email: 'test@example.com',
      name: 'Test Customer',
      phone: '+1234567890',
      address: {
        line1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        country: 'US'
      }
    },
    internationalCustomer: {
      email: 'international@example.com',
      name: 'International Customer',
      phone: '+44123456789',
      address: {
        line1: '456 International Ave',
        city: 'London',
        postal_code: 'SW1A 1AA',
        country: 'GB'
      }
    }
  },

  // Test scenarios for different payment outcomes
  testScenarios: {
    successfulPayment: {
      description: 'Standard successful payment flow',
      cardNumber: '4242424242424242',
      expectedOutcome: 'success'
    },
    declinedPayment: {
      description: 'Payment declined by bank',
      cardNumber: '4000000000000002',
      expectedOutcome: 'declined'
    },
    insufficientFunds: {
      description: 'Insufficient funds in account',
      cardNumber: '4000000000009995',
      expectedOutcome: 'insufficient_funds'
    },
    expiredCard: {
      description: 'Card has expired',
      cardNumber: '4000000000000069',
      expectedOutcome: 'expired_card'
    },
    incorrectCvc: {
      description: 'Incorrect CVC code',
      cardNumber: '4000000000000127',
      expectedOutcome: 'incorrect_cvc'
    },
    processingError: {
      description: 'Generic processing error',
      cardNumber: '4000000000000119',
      expectedOutcome: 'processing_error'
    },
    requiresAuthentication: {
      description: '3D Secure authentication required',
      cardNumber: '4000002500003155',
      expectedOutcome: 'requires_authentication'
    }
  },

  // Webhook test events
  webhookTestEvents: {
    paymentSucceeded: 'payment_intent.succeeded',
    paymentFailed: 'payment_intent.payment_failed',
    paymentCanceled: 'payment_intent.canceled',
    refundCreated: 'charge.dispute.created'
  }
};

/**
 * Get dummy payment credentials for testing
 * @param {string} scenario - The test scenario to get credentials for
 * @returns {Object} Dummy credentials object
 */
const getDummyCredentials = (scenario = 'successfulPayment') => {
  const testScenario = DUMMY_PAYMENT_CREDENTIALS.testScenarios[scenario];
  if (!testScenario) {
    throw new Error(`Unknown test scenario: ${scenario}`);
  }

  const card = Object.values(DUMMY_PAYMENT_CREDENTIALS.testCards)
    .find(card => card.number === testScenario.cardNumber);

  return {
    scenario: testScenario,
    card,
    customer: DUMMY_PAYMENT_CREDENTIALS.testCustomers.validCustomer
  };
};

/**
 * Get all available test scenarios
 * @returns {Array} Array of scenario names
 */
const getAvailableScenarios = () => {
  return Object.keys(DUMMY_PAYMENT_CREDENTIALS.testScenarios);
};

/**
 * Validate if running in test environment
 * @returns {boolean} True if in test environment
 */
const isTestEnvironment = () => {
  return process.env.NODE_ENV === 'test' || 
         process.env.NODE_ENV === 'development' ||
         process.env.STRIPE_SECRET_KEY?.includes('sk_test_');
};

/**
 * Get dummy login credentials for testing payment flows
 * @returns {Object} Dummy login credentials
 */
const getDummyLoginCredentials = () => {
  if (!isTestEnvironment()) {
    throw new Error('Dummy credentials are only available in test environments');
  }

  return {
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
};

module.exports = {
  DUMMY_PAYMENT_CREDENTIALS,
  getDummyCredentials,
  getAvailableScenarios,
  isTestEnvironment,
  getDummyLoginCredentials
};