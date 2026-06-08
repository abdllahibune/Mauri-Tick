import crypto from 'crypto';

export default async function handler(req, res) {
  const APP_KEY = '536002';
  const APP_SECRET = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
  const CODE = '3_536002_EGE8rAOACRKRd8D5JX8tOjEY1400';
  const API_URL = 'https://api-sg.aliexpress.com/rest';

  const timestamp = String(Date.now());

  const params = {
    app_key: APP_KEY,
    code: CODE,
    grant_type: 'authorization_code',
    sign_method: 'md5',
    timestamp: timestamp,
  };

  // Correct AliExpress signature:
  // 1. Sort params alphabetically
  // 2. Concat: SECRET + key1value1 + key2value2... + SECRET
  // 3. MD5 uppercase
  const sortedKeys = Object.keys(params).sort();
  let signStr = APP_SECRET;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += APP_SECRET;

  params.sign = crypto
    .createHash('md5')
    .update(signStr)
    .digest('hex')
    .toUpperCase();

  // Use GET method with query params (not POST body)
  const queryString = Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  const url = `${API_URL}/auth/token/create?${queryString}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const text = await response.text();
    console.log('Raw response:', text);
    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
