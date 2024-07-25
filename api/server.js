const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const database = require('./db');

const app = express();
const port = 8090;

// Multer 설정
const upload = multer(); // Multer 설정

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

// DB 연결 설정
const dbConnection = database.createDbConnection();

app.use(bodyParser.json());

// =============================
// AREA & HIVE
// =============================
app.get('/api/areahive', async (req, res) => {
  try {
    const data = await database.getAreasAndHives(dbConnection);
    res.json(data);
  } catch (error) {
    console.error('Error fetching areas and hives:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// =============================
// INOUT
// =============================
// GET 요청을 처리하여 데이터 반환
app.get('/api/inout', async (req, res) => {
  const { deviceId, sTime, eTime } = req.query;
  if (!deviceId || !sTime || !eTime) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    const data = await database.getInOutDataByDeviceAndTimeRange(dbConnection, deviceId, sTime, eTime);
    res.json(data);
  } catch (error) {
    console.error('Error fetching inout data:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// =============================
// SENSOR
// =============================
// GET 요청을 처리하여 데이터 반환
app.get('/api/sensor', async (req, res) => {
  const { deviceId, sTime, eTime } = req.query;
  if (!deviceId || !sTime || !eTime) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    const data = await database.getSensorDataByDeviceAndTimeRange(dbConnection, deviceId, sTime, eTime);
    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// =============================
// CAMERA
// =============================
// GET 요청을 처리하여 데이터 반환
app.get('/api/camera', async (req, res) => {
  const { deviceId, sTime, eTime } = req.query;
  if (!deviceId || !sTime || !eTime) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    const data = await database.getCameraDataByDeviceAndTimeRange(dbConnection, deviceId, sTime, eTime);
    res.json(data);
  } catch (error) {
    console.error('Error fetching camera data:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// =============================
// UPLINK & UPLOAD
// =============================
const handleInOutData = async (dbConnection, data) => {
  if (data.some(item => item.inField == null || item.outField == null)) {
    throw new Error('Bad Request: Missing required fields');
  }
  await database.insertInOutData(dbConnection, data);
};

const handleSensorData = async (dbConnection, data) => {
  if (data.some(item => item.temp == null && item.humi == null && item.co2 == null && item.weigh == null)) {
    throw new Error('Bad Request: Missing required fields');
  }
  await database.insertSensorData(dbConnection, data);
};

const handleCameraData = async (dbConnection, data) => {
  if (data.some(item => item.picture == null)) {
    throw new Error('Bad Request: Missing required fields');
  }
  await database.insertCameraData(dbConnection, data);
}

app.post('/api/uplink', async (req, res) => {
  const { id, type } = req.body;

  if (id == null || type == null) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    // DB에 있는지 확인
    const deviceResults = await database.checkDevice(dbConnection, id, type);
    if (deviceResults.length === 0) {
      return res.status(400).send('Bad Request: Invalid device Id or type');
    }

    // timestamp를 mysql포맷으로 설정
    const time = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 각 Type에 맞게 데이터 삽입
    if (type === deviceTypes.INOUT) {
      const {inField, outField } = req.body;
      if (inField == null || outField == null) {
        return res.status(400).send('Bad Request: Missing required fields');
      }
      await handleInOutData(dbConnection, [{ id, time, inField, outField }]);
      return res.status(201).send('Data inserted successfully');
    } else if (type === deviceTypes.SENSOR) {
      const { temp, humi, co2, weigh } = req.body;
      if (temp == null && humi == null && co2 == null && weigh == null) {
        return res.status(400).send('Bad Request: Missing required fields');
      }
      await handleSensorData(dbConnection, [{ id, time, temp, humi, co2, weigh }]);
      return res.status(201).send('Data inserted successfully');
    } else {
      return res.status(400).send('Bad Request: Invalid device type');
    }
    
  } catch (error) {
    console.error('Error processing uplink:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// POST route to handle uploads
app.post('/api/upload', upload.any(), async (req, res) => {
  try {
    let type;
    let data = [];
    if (req.is('multipart/form-data')) {
      let files = req.files.filter(file => file.fieldname.startsWith('file'));
      // Handle multipart/form-data
      type = req.body.type;

      // Extract metadata from the request
      const metadata = files.map((file, index) => ({
        id: req.body[`file${index + 1}_id`],
        time: req.body[`file${index + 1}_time`],
        file: file
      }));

      if (!type || !files || files.length === 0 || metadata.some(item => !item.id || !item.time)) {
        console.log(type, files, metadata);
        return res.status(400).send('Bad Request: Missing required fields or data');
      }

      // Process each file and corresponding data
      data = metadata.map((item, index) => ({
        id: item.id,
        time: item.time,
        picture: item.file.buffer
      }));

    } else if (req.is('application/json')) {
      // Handle application/json
      type = req.body.type;
      data = req.body.data;

      if (!type || !Array.isArray(data) || data.length === 0) {
        return res.status(400).send('Bad Request: Missing required fields or data');
      }
    } else {
      return res.status(400).send('Bad Request: Unsupported content type');
    }

    // timestamp를 mysql포맷으로 변경
    data.forEach(element => {
      if (element.time) {
        element.time = element.time.replace('T', ' ').replace('Z', '');
      }
    });

    // Get the original client IP from the x-Forwarded-For header
    const originalClientIp = req.headers['x-forwarded-for'];

    // Update device IP
    await database.updateDeviceIP(dbConnection, data, originalClientIp);

    // Handle different types of data
    if (type == deviceTypes.INOUT) {
      await handleInOutData(dbConnection, data);
    } else if (type == deviceTypes.SENSOR) {
      await handleSensorData(dbConnection, data);
    } else if (type == deviceTypes.CAMERA) {
      await handleCameraData(dbConnection, data);
    } else {
      return res.status(400).send('Bad Request: Invalid device type');
    }
    return res.status(201).send('Data inserted successfully');
  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Backend server is running on port 3000');
});


// =============================
// HIVE
// =============================
app.get('/api/hive', async (req, res) => {
  const { areaId } = req.query;

  if (!areaId) {
    return res.status(400).send('Bad Request: Missing areaId');
  }

  try {
    const hives = await database.getHivesByAreaId(dbConnection, areaId);
    return res.status(200).json(hives);
  } catch (error) {
    console.error('Error fetching hives:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/api/hive', async (req, res) => {
  const { areaId, name } = req.body;

  if (!areaId || !name) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    const result = await database.addHive(dbConnection, areaId, name);
    if(result.existing) {
      return res.status(409).json({message: 'Hive already exists', hiveId: result.hiveId});
    } else {
      return res.status(201).json({message: 'Hive added successfully', hiveId: result.hiveId});
    }
  } catch (error) {
    console.error('Error adding hive:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/hive', async (req, res) => {
  const { hiveId } = req.query;

  if (!hiveId) {
    return res.status(400).send('Bad Request: Missing hiveId');
  }

  try {
    const result = await database.deleteHive(dbConnection, hiveId);
    if(result.deleted) {
      return res.status(200).json({message: 'Hive deleted successfully', hiveId: result.hiveId});
    } else {
      return res.status(404).json({message: 'Hive not found', hiveId: result.hiveId});
    }
  } catch (error) {
    console.error('Error deleting hive:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// =============================
// DEVICE
// =============================
app.get('/api/device', async (req, res) => {
  const { hiveId, deviceId } = req.query;

  if (!hiveId && !deviceId) {
    return res.status(400).send('Bad Request: Missing hiveId or deviceId');
  }

  try {
    let devices;
    if (deviceId) {
      devices = await database.getDeviceByDeviceId(dbConnection, deviceId.split(','));
    } else {
      devices = await database.getDevicesByHiveId(dbConnection, hiveId);
    }
    return res.status(200).json(devices);
  } catch (error) {
    console.error('Error fetching device:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/api/device', async (req, res) => {
  const { name, hiveId, typeId } = req.body;

  if (!name || !hiveId || !typeId) {
    return res.status(400).send('Bad Request: Missing required fields');
  }

  try {
    const result = await database.addDevice(dbConnection, name, hiveId, typeId);
    if(result.existing) {
      return res.status(409).json({message: 'Device already exists', deviceId: result.deviceId});
    } else {
      return res.status(201).json({message: 'Device added successfully', deviceId: result.deviceId});
    }
  } catch (error) {
    console.error('Error adding device:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/device', async (req, res) => {
  const { deviceId } = req.query;

  if (!deviceId) {
    return res.status(400).send('Bad Request: Missing deviceId');
  }

  try {
    const result = await database.deleteDevice(dbConnection, deviceId);
    if(result.deleted) {
      return res.status(200).json({message: 'Device deleted successfully', deviceId: result.deviceId});
    } else {
      return res.status(404).json({message: 'Device not found', deviceId: result.deviceId});
    }
  } catch (error) {
    console.error('Error deleting device:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`API 서버가 포트 ${port}에서 실행 중입니다.`);
});
