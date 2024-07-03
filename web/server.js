const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = 3000;

const API_BASE_URL = 'http://api:8090';

// app.use(express.json()); // JSON 본문 구문 분석을 위한 미들웨어

// const upload = multer(); // Multer 설정
app.set('trust proxy', true);

// Serve static files from the 'public' directory
app.use('/honeybee', express.static(path.join(__dirname, 'public')));

// Serve Chart.js from node_modules
app.use('/honeybee/chart.js', express.static(path.join(__dirname, 'node_modules/chart.js/dist')));
app.use('/honeybee/chartjs-adapter-date-fns', express.static(path.join(__dirname, 'node_modules/chartjs-adapter-date-fns/dist')));

// Create a router for /honeybee
const honeybeeRouter = express.Router();

// Route to serve the HTML view with query parameters
honeybeeRouter.get('/view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// Route to serve the HTML view with query parameters
honeybeeRouter.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Route to serve the index page
honeybeeRouter.get('/', (req, res) => {
  res.redirect('/honeybee/view');
});

// Middleware to log and set client IP
honeybeeRouter.use((req, res, next) => {
  console.log(req.headers);
  console.log(req.headers['x-forwarded-for']);
  // const clientIp = req.headers['x-forwarded-for'];
  // proxyReq.setHeader('X-Forwarded-For', clientIp);
  next();
});

// Proxy API requests to the backend API
honeybeeRouter.use('/api', createProxyMiddleware({
  target: API_BASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/honeybee/api': 'api', // '/honeybee/api'를 '/api'로 변경
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add original client IP to X-Forwarded-For header
    // x-forwarded-for
    console.log(req.headers);
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    proxyReq.setHeader('X-Forwarded-For', clientIp);
  },
  onError: (err, req, res) => {
    console.error(`Error proxying request to ${API_BASE_URL}${req.originalUrl}:`, err.message);
    res.status(500).send('Internal Server Error');
  }
}));

// Use /honeybee as the base path for the honeybeeRouter
app.use('/honeybee', honeybeeRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
