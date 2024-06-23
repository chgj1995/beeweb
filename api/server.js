const express = require('express');
const bodyParser = require('body-parser');
const database = require('./db');

const app = express();
const port = 8090;

app.use(bodyParser.json());

// DB 연결 설정
const dbConnection = database.createDbConnection();

// =============================
// AREA & HIVE
// =============================
app.get('/api/areahive', async (req, res) => {
  try {
    const data = await database.getAreasAndHives(dbConnection);
    res.json(data);
  } catch (error) {
    console.error('Error fetching areas and hives:', error);
    res.status(500).send('Internal Server Error');
  }
});

// =============================
// INOUT
// =============================
// GET 요청을 처리하여 데이터 반환
app.get('/api/inout', async (req, res) => {
  const { deviceID, sTime, eTime } = req.query;
  if (!deviceID || !sTime || !eTime) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    const data = await database.getInOutDataByDeviceAndTimeRange(dbConnection, deviceID, sTime, eTime);
    res.json(data);
  } catch (error) {
    console.error('Error fetching inout data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// =============================
// SENSOR
// =============================
// GET 요청을 처리하여 데이터 반환
app.get('/api/sensor', async (req, res) => {
  const { deviceID, sTime, eTime } = req.query;
  if (!deviceID || !sTime || !eTime) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    const data = await database.getSensorDataByDeviceAndTimeRange(dbConnection, deviceID, sTime, eTime);
    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// =============================
// UPLINK
// =============================

// TODO: 타입 위치 관련
// DB에서 조회하던지,
// 선언으로만 쓰던지 하나만 하는게 좋음
// 변동성 별로 없을 것 같아서 선언으로 해도 괜찮을 것 같긴함
// DB에서 조회한다면 어떤 타이밍에 조회할지가 또 생각해볼 문제
const deviceTypes = {
  'CAMERA': 1,
  'SENSOR': 2,
  'INOUT': 3,
};

app.post('/api/uplink', async (req, res) => {
  const { id, type } = req.body;

  if (id == null || type == null) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    // DB에 있는지 확인
    const deviceResults = await database.checkDevice(dbConnection, id, type);
    if (deviceResults.length === 0) {
      return res.status(400).send('Bad Request: Invalid device ID or type');
    }

    const time = new Date().toISOString().slice(0, 19).replace('T', ' '); // 현재 시간 설정

    // 각 Type에 맞게 데이터 삽입
    if (type === deviceTypes.INOUT) {
      const { in: inField, out: outField } = req.body;
      if (inField == null || outField == null) {
        return res.status(400).send('Bad Request: Missing required fields');
      }
      await database.insertInOutData(dbConnection, [{ id, time, inField, outField }]);
      res.status(201).send('Data inserted successfully');
    } else if (type === deviceTypes.SENSOR) {
      const { temp, humi, co2, weigh } = req.body;
      if (temp == null && humi == null && co2 == null && weigh == null) {
        return res.status(400).send('Bad Request: Missing required fields');
      }
      await database.insertSensorData(dbConnection, [{ id, time, temp, humi, co2, weigh }]);
      res.status(201).send('Data inserted successfully');
    } else {
      return res.status(400).send('Bad Request: Invalid device type');
    }
    
  } catch (error) {
    console.error('Error processing uplink:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`API 서버가 포트 ${port}에서 실행 중입니다.`);
});
