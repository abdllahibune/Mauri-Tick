const crypto = require('crypto');

export default async function handler(req, res) {
  const appKey = '536002';
  const appSecret = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
  const code = '3_536002_GU9CuJ25QUe4z7d9b3Eyh8j51353';
  
  const timestamp = String(Date.now());
  
  // Build params object
  const params = {
    app_key: appKey,
    code: code,
    grant_type: 'authorization_code',
    timestamp: timestamp,
    sign_method: 'md5',
  };
  
  // Generate signature
  const sortedKeys = Object.keys(params).sort();
  let signStr = appSecret;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += appSecret;
  
  params.sign = crypto
    .createHash('md5')
    .update(signStr)
    .digest('hex')
    .toUpperCase();
  
  // Build query string
  const queryString = Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  
  try {
    const response = await fetch(
      `https://api-sg.aliexpress.com/rest/auth/token/create?${queryString}`,
      { method: 'POST' }
    );
    const data = await response.json();
    console.log('Token response:', data);
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
