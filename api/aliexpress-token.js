import crypto from 'crypto';

export default async function handler(req, res) {
  const APP_KEY = '536002';
  const APP_SECRET = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
  const CODE = '3_536002_GU9CuJ25QUe4z7d9b3Eyh8j51353';

  const params = {
    app_key: APP_KEY,
    code: CODE,
    grant_type: 'authorization_code',
    sign_method: 'md5',
    timestamp: String(Date.now()),
  };

  // Sort keys and concatenate
  const sortedKeys = Object.keys(params).sort();
  let signStr = APP_SECRET;
  for (const key of sortedKeys) {
    signStr += key + String(params[key]);
  }
  signStr += APP_SECRET;

  // Generate MD5 signature uppercase
  params.sign = crypto
    .createHash('md5')
    .update(signStr, 'utf8')
    .digest('hex')
    .toUpperCase();

  // POST request with form data
  const formBody = Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');

  try {
    const response = await fetch(
      'https://api-sg.aliexpress.com/rest/auth/token/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
