const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const session = require('express-session');
const passport = require('passport');
const loginRouter = require('./loginRoute'); // loginRoute.js 파일을 불러옴

const app = express();
const port = 80;

const API_BASE_URL = 'http://api:8090';

//============== 기본 설정 ==============

// 프록시 설정
app.set('trust proxy', true);

//============== API 프록시 설정 (세션 및 Passport 미들웨어 이전) ==============

// Proxy API requests to the backend API without authentication
app.use('/honeybee/api', createProxyMiddleware({
  target: API_BASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/honeybee/api': '/api', // '/honeybee/api'를 '/api'로 변경
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add original client IP to X-Forwarded-For header
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    proxyReq.setHeader('X-Forwarded-For', clientIp);
    // console.log(`Proxied request to ${API_BASE_URL}${req.originalUrl} from ${clientIp}`);
  },
  // onProxyRes: (proxyRes, req, res) => {
  //   console.log(`Received response with status ${proxyRes.statusCode} for ${req.originalUrl}`);
  // },
  onError: (err, req, res) => {
    console.error(`Error proxying request to ${API_BASE_URL}${req.originalUrl}:`, err.message);
    return res.status(500).send('Internal Server Error');
  }
}));

//============== 세션 및 Passport 설정 ==============

console.log('Session secret:', process.env.SESSION_SECRET);

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
  }
}));

// Passport 초기화 및 세션 사용 설정
app.use(passport.initialize());
app.use(passport.session());

//============== Body Parsing 미들웨어 추가 ==============

// Body parsing middleware 추가
app.use(express.json()); // JSON 요청 본문 파싱

//============== 정적 파일 서빙 ==============

// Static 파일 서빙
app.use('/honeybee', express.static(path.join(__dirname, 'public')));

// Serve Chart.js from node_modules
app.use('/honeybee/chart.js', express.static(path.join(__dirname, 'node_modules/chart.js/dist')));
app.use('/honeybee/chartjs-adapter-date-fns', express.static(path.join(__dirname, 'node_modules/chartjs-adapter-date-fns/dist')));

//============== 인증 미들웨어 ==============

// 인증 미들웨어 함수
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/honeybee/login');
}

//============== 라우터 설정 ==============

// Create a router for /honeybee
const honeybeeRouter = express.Router();

// 인증이 필요한 라우트
honeybeeRouter.get('/hiveView', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hiveView/hiveView.html'));
});

honeybeeRouter.get('/compareView', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'compareView/compareView.html'));
});

// exportView 라우트 추가
honeybeeRouter.get('/exportView', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'exportView/exportView.html'));
});

// management 라우트 추가
honeybeeRouter.get('/managementView', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'managementView/area_list.html'));
});

// pictureView 라우트 추가
honeybeeRouter.get('/pictureView', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pictureView/pictureView.html'));
});

// Route to serve the index page
honeybeeRouter.get('/', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 로그인 라우터 추가
honeybeeRouter.use('/', loginRouter);

// Use /honeybee as the base path for the honeybeeRouter
app.use('/honeybee', honeybeeRouter);

//============== 서버 시작 ==============

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
