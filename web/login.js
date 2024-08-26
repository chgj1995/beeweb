const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const axios = require('axios');
const path = require('path');

const router = express.Router();

const API_BASE_URL = 'http://api:8090/api'; // 이제 프록시된 경로로 접근

// Passport Local Strategy 설정
passport.use(new LocalStrategy(
    async (username, password, done) => {
      console.log('LocalStrategy invoked'); // 이 로그가 출력되는지 확인
      try {
        console.log('Attempting to log in with username:', username);
        const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
        console.log('login response:', response.data);
        if (response.data.success) {
          return done(null, response.data.user);
        } else {
          return done(null, false, { message: 'Invalid credentials' });
        }
      } catch (error) {
        console.error('Login API error:', error.response ? error.response.data : error.message);
        return done(error);
      }
    }
  ));  

// 사용자 세션 관리 - 웹 서버에서 세션 처리
passport.serializeUser((user, done) => {
  // 사용자의 id를 세션에 저장
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // 세션에서 저장한 id를 사용하여 사용자 정보를 API 서버에서 가져옵니다.
    const response = await axios.get(`${API_BASE_URL}/users/${id}`);
    console.log('deserializeUser response');
    console.log(response.data);
    done(null, response.data);
  } catch (error) {
    console.error('Login API error:', error.response ? error.response.data : error.message);
    done(error, null);
  }
});

// 로그인 페이지 라우트
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 로그인 요청 처리
router.post('/login', (req, res, next) => {
    console.log('Attempting to authenticate...');  // 디버그를 위해 추가된 로깅
    console.log('req.body:', req.body);  // 디버그를 위해 추가된 로깅
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.log('Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Authentication failed:', info.message);
        return res.redirect('/honeybee/login');
      }
      req.logIn(user, (err) => {
        if (err) {
          console.log('Login error:', err);
          return next(err);
        }
        console.log('Authentication successful');
        return res.redirect('/honeybee');
      });
    })(req, res, next);
  });

// 로그아웃 처리
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/honeybee/login');
  });
});

module.exports = router;
