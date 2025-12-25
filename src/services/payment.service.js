/**
 * Mock payment gateway
 * Simulates COD / online payment
 */
async function collectPayment({ orderId, amount, mode = 'COD' }) {
  // simulate network delay
  await new Promise(r => setTimeout(r, 300));

  // Simple deterministic mock
  if (mode === 'COD') {
    return {
      success: true,
      paidAmount: amount,
      transactionId: `COD-${orderId}-${Date.now()}`
    };
  }

  // Online payment mock (90% success)
  const success = Math.random() > 0.1;

  if (!success) {
    return {
      success: false,
      paidAmount: 0,
      error: 'Payment failed'
    };
  }

  return {
    success: true,
    paidAmount: amount,
    transactionId: `PAY-${orderId}-${Date.now()}`
  };
}

module.exports = { collectPayment };
