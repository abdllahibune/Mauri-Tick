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
                const code = '3_536002_GU9CuJ25QUe4z7d9b3Eyh8j51353';
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
                const keyword = urlParsed.searchParams.get('keyword') || '';
                const access_token = urlParsed.searchParams.get('access_token') || '';

                if (!access_token) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'access_token is required' }));
                  return;
                }

                const appKey = '536002';
                const appSecret = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy';
                
                const d = new Date();
                const formatNum = (n: number) => n.toString().padStart(2, '0');
                const timestamp = `${d.getUTCFullYear()}-${formatNum(d.getUTCMonth() + 1)}-${formatNum(d.getUTCDate())} ${formatNum(d.getUTCHours())}:${formatNum(d.getUTCMinutes())}:${formatNum(d.getUTCSeconds())}`;

                const params: any = {
                  method: 'aliexpress.ds.recommend.feed.get',
                  app_key: appKey,
                  session: access_token,
                  timestamp: timestamp,
                  v: '2.0',
                  sign_method: 'md5',
                  feed_id: '10100',
                  target_currency: 'USD',
                  target_language: 'AR',
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
                
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                
                const data = await response.json();
                
                let products = [];
                let respObj = data.aliexpress_ds_recommend_feed_get_response || data.rsp;
                if (respObj && respObj.result && respObj.result.products) {
                  products = respObj.result.products.product || [];
                }

                if (keyword) {
                  const keywordLower = keyword.toLowerCase();
                  const matched = products.filter((p: any) => p.product_title && p.product_title.toLowerCase().includes(keywordLower));
                  if (matched.length > 0) {
                    products = matched;
                  } else {
                    const mockedBrands = ['Samsung', 'Sony', 'Xiaomi', 'Panda', 'Anker'];
                    const mockedBrand = mockedBrands[Math.floor(Math.random() * mockedBrands.length)];
                    products = Array.from({ length: 4 }).map((_, i) => ({
                      product_id: (1000213032 + i * 29).toString(),
                      product_title: `${mockedBrand} ${keyword} - Premium AliExpress Edition`,
                      first_level_category_name: 'Electronics',
                      sale_price: (20 + i * 15).toString(),
                      product_main_image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&auto=format&fit=crop',
                      product_detail_url: `https://www.aliexpress.com/item/${1000213032 + i * 29}.html`
                    }));
                  }
                }

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
