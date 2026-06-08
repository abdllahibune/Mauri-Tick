import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import crypto from 'crypto';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'aliexpress-api-routes',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/aliexpress-token')) {
              try {
                const appKey = '536002';
                const appSecret = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
                const code = '3_536002_EGE8rAOACRKRd8D5JX8tOjEY1400';
                const timestamp = Date.now().toString();
                
                const params: any = {
                  app_key: appKey,
                  code: code,
                  grant_type: 'authorization_code',
                  sign_method: 'md5',
                  timestamp: timestamp,
                };

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
                
                const queryString = Object.keys(params)
                  .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                  .join('&');
                
                const url = `https://api-sg.aliexpress.com/rest/auth/token/create?${queryString}`;
                
                const response = await fetch(url, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                });
                
                const text = await response.text();
                const data = JSON.parse(text);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            if (req.url?.startsWith('/api/aliexpress-search')) {
              try {
                const urlParsed = new URL(req.url, 'http://localhost');
                const keyword = urlParsed.searchParams.get('keyword') || 'shirt';

                const appKey = '536002';
                const appSecret = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
                const trackingId = 'panda_store';
                
                const d = new Date();
                const formatNum = (n: number) => n.toString().padStart(2, '0');
                const timestamp = `${d.getUTCFullYear()}-${formatNum(d.getUTCMonth() + 1)}-${formatNum(d.getUTCDate())} ${formatNum(d.getUTCHours())}:${formatNum(d.getUTCMinutes())}:${formatNum(d.getUTCSeconds())}`;

                const params: any = {
                  app_key: appKey,
                  format: 'json',
                  method: 'aliexpress.affiliate.product.query',
                  sign_method: 'md5',
                  timestamp,
                  v: '2.0',
                  fields: 'product_id,product_title,target_sale_price,target_original_price,target_sale_price_currency,evaluate_rate,product_main_image_url,product_detail_url,lastest_volume,discount',
                  keywords: keyword,
                  page_size: '20',
                  page_no: '1',
                  tracking_id: trackingId,
                  target_currency: 'USD',
                  target_language: 'AR',
                  sort: 'SALE_PRICE_ASC',
                };

                const signRequest = (p: any, secret: string) => {
                  const sorted = Object.keys(p).sort();
                  let str = secret;
                  for (const key of sorted) {
                    str += key + p[key];
                  }
                  str += secret;
                  return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
                };

                const sign = signRequest(params, appSecret);
                const queryStr = new URLSearchParams({ ...params, sign }).toString();
                const apiUrl = `https://api-sg.aliexpress.com/sync?${queryStr}`;
                
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                let products = data
                  ?.aliexpress_affiliate_product_query_response
                  ?.resp_result?.result?.products?.product || [];

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ products, raw: data }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
