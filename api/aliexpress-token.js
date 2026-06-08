const crypto = require('crypto');

function signRequest(params, appSecret) {
  const sorted = Object.keys(params).sort();
  let str = appSecret;
  for (const key of sorted) {
    str += key + params[key];
  }
  str += appSecret;
  return crypto.createHash('md5')
    .update(str).digest('hex').toUpperCase();
}

export default async function handler(req, res) {
  const appKey = '536002';
  const appSecret = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
  const code = '3_536002_GU9CuJ25QUe4z7d9b3Eyh8j51353';
  
  const timestamp = Date.now().toString();
  
  const params = {
    app_key: appKey,
    code: code,
    grant_type: 'authorization_code',
    timestamp: timestamp,
  };

  const sign = signRequest(params, appSecret);
  
  try {
    const queryStr = new URLSearchParams({ ...params, sign }).toString();
    const tokenUrl = `https://oauth.aliexpress.com/token?${queryStr}`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      return res.status(200).json(data);
    } else {
      return res.status(400).json({ error: 'Failed to retrieve access token', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
