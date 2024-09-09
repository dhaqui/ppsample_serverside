const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');  // corsミドルウェアの読み込み
const app = express();

app.use(bodyParser.json());

// CORSを有効にする（1つだけcorsを使います）
app.use(cors({
  origin: '*',  // GitHub Pagesのオリジンを指定
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ここで記載したメソッドを許可する
  optionsSuccessStatus: 200 // 成功時のステータスを200にする
}));

// Preflightリクエストを処理する
app.options('*', cors()); // すべてのルートに対してOPTIONSリクエストを許可

app.options('/create-order', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

app.options('/capture-order', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

const PAYPAL_CLIENT_ID = 'EAMWkTh00y7VV_OF0rjxXvriOLYOCOINlwQLfwuif4HjSxSfOFcvI3TV5363vM1svOPqyX00HtlQIepu'; // あなたのPayPal Client ID
const PAYPAL_CLIENT_SECRET = 'EAMWkTh00y7VV_OF0rjxXvriOLYOCOINlwQLfwuif4HjSxSfOFcvI3TV5363vM1svOPqyX00HtlQIepu'; // あなたのPayPal Client Secret
const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com'; // 本番環境は 'https://api-m.paypal.com'

// PayPalのアクセストークンを生成
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

// PayPalオーダーを作成
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

// PayPalオーダーをキャプチャ
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

// Vercelはポートを自動で設定します
module.exports = app;


const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
