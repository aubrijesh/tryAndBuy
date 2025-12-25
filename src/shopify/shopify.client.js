const fetch = require('node-fetch');
const SHOPIFY_API = process.env.SHOPIFY_API_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_API_TOKEN;

async function shopifyRequest(path, method='GET', body=null) {
  const res = await fetch(`${SHOPIFY_API}${path}`, {
    method,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

module.exports = { shopifyRequest };
