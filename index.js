const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// CORS設定
app.use((req, res, next) => {
  // 特定のオリジンを許可
  res.setHeader('Access-Control-Allow-Origin', 'https://dhaqui.github.io');

  // 認証情報を含むリクエストを許可
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 許可するHTTPメソッド
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // 許可するヘッダー
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  // プリフライトリクエスト（OPTIONSリクエスト）に対応
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);  // 200 OK を返してプリフライトを処理
  }

  next();
});

app.use(bodyParser.json());

// PayPalのAPI処理部分はそのまま
const PAYPAL_CLIENT_ID = 'AeNx2jnN5CUV4jAPLqYMat3ig6PDZXh-kKPnTjQQIIU6AVNA79QnRp-dk4tqHvnnqBbzR_WlCovKdMN-';
const PAYPAL_CLIENT_SECRET = 'EAMWkTh00y7VV_OF0rjxXvriOLYOCOINlwQLfwuif4HjSxSfOFcvI3TV5363vM1svOPqyX00HtlQIepu';
const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com';

// PayPal アクセストークンを生成
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
    console.error('Error generating access token:', error.response ? error.response.data : error);
  }
};

// PayPal注文を作成
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
      },
      timeout: 5000  // タイムアウトを5秒に設定
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating order:', error.response ? error.response.data : error);
    res.status(500).send('Error creating order');
  }
});

// PayPal注文をキャプチャ
app.post('/capture-order', async (req, res) => {
  const { orderId } = req.body;
  const accessToken = await generateAccessToken();

  try {
    const response = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000  // タイムアウトを5秒に設定
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error capturing order:', error.response ? error.response.data : error);
    res.status(500).send('Error capturing payment');
  }
});

// Vercelではポート設定は不要
module.exports = app;
