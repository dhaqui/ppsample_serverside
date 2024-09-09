const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// CORS設定を強化
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');  // 全てのオリジンを許可
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');  // 許可するメソッド
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization');  // 許可するヘッダー
  if (req.method === 'OPTIONS') {
    // プリフライトリクエストの場合
    res.sendStatus(200);  // 200 OKを返してプリフライトリクエストを終了
  } else {
    next();
  }
});

app.use(bodyParser.json());

// PayPalのAPI処理部分はそのまま
const PAYPAL_CLIENT_ID = 'your-client-id';
const PAYPAL_CLIENT_SECRET = 'your-client-secret';
const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com';

const generateAccessToken = async () => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  try {
    const response = await axios.post(`${PAYPAL_API_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating access token:', error);
  }
};

app.post('/create-order', async (req, res) => {
  const accessToken = await generateAccessToken();
  const order = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'JPY',
        value: '3600'
      }
    }]
  };

  try {
    const response = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders`, order, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send('Error creating order');
  }
});

app.post('/capture-order', async (req, res) => {
  const { orderId } = req.body;
  const accessToken = await generateAccessToken();

  try {
    const response = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error capturing order:', error);
    res.status(500).send('Error capturing payment');
  }
});

// Vercelではポート設定は不要
module.exports = app;
