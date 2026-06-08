export default async function handler(req, res) {
  const { keyword = 'shirt', pageSize = 20 } = req.query;
  
  const APP_KEY = '536002';
  const APP_SECRET = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
  const TRACKING_ID = 'panda_store';
  
  const timestamp = new Date()
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);
  
  const params = {
    app_key: APP_KEY,
    format: 'json',
    method: 'aliexpress.affiliate.product.query',
    sign_method: 'md5',
    timestamp,
    v: '2.0',
    fields: 'product_id,product_title,target_sale_price,target_original_price,target_sale_price_currency,evaluate_rate,product_main_image_url,product_detail_url,lastest_volume,discount',
    keywords: keyword,
    page_size: pageSize,
    page_no: 1,
    tracking_id: TRACKING_ID,
    target_currency: 'USD',
    target_language: 'AR',
    sort: 'SALE_PRICE_ASC',
  };
  
  // Sign
  const crypto = require('crypto');
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
  
  const query = new URLSearchParams(params).toString();
  const url = `https://api-sg.aliexpress.com/sync?${query}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Extract products
  const products = data
    ?.aliexpress_affiliate_product_query_response
    ?.resp_result?.result?.products?.product || [];
  
  res.json({ products });
}
