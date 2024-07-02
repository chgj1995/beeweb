const express = require('express');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const app = express();
const port = 80;

const API_BASE_URL = 'http://172.17.0.1:8090/api';

app.use(express.json()); // JSON 본문 구문 분석을 위한 미들웨어

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

// Proxy API requests to the backend API
honeybeeRouter.use('/api', async (req, res) => {
  const url = `${API_BASE_URL}${req.originalUrl.replace('/honeybee/api', '')}`;
  console.log(`Proxying request to ${url}`);
  
  try {
    const headers = { ...req.headers };
    // 캐시 관련 헤더 제거
    delete headers['if-modified-since'];
    delete headers['if-none-match'];

    // Add original client IP to X-Forwarded-For header
    const clientIp = req.ip;
    if (headers['x-forwarded-for']) {
      headers['x-forwarded-for'] += `, ${clientIp}`;
    } else {
      headers['x-forwarded-for'] = clientIp;
    }

    if (req.is('multipart/form-data')) {
      const form = new FormData();
      
      req.pipe(form);

      const response = await axios({
        method: req.method,
        url,
        data: form,
        headers: {
          ...headers,
          ...form.getHeaders(),
        },
      });

      res.status(response.status).json(response.data);
    } else {
      const response = await axios({
        method: req.method,
        url,
        data: req.body,
        headers: headers,
      });
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(`Error proxying request to ${url}:`, error.message);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

// Use /honeybee as the base path for the honeybeeRouter
app.use('/honeybee', honeybeeRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
