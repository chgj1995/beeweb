const xlsx = require('xlsx');
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

// MariaDB 연결 설정
const connectionConfig = {
  host: '127.0.0.1',
  user: 'user',
  password: 'password',
  database: 'hive_data',
  connectTimeout: 10000  // 10초로 타임아웃 시간 설정
};

const connection = mysql.createConnection(connectionConfig);

// 데이터베이스 연결
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

const registerHiveAndDevice = async (connection, areaId, hiveId) => {
  // HIVE 중복 체크 및 ID 가져오기
  const hiveDbId = await new Promise((resolve, reject) => {
    const query = 'SELECT id FROM hives WHERE area_id = ? AND name = ?';
    connection.query(query, [areaId, `Hive ${hiveId}`], (error, results) => {
      if (error) {
        console.error('Error checking hive:', error);
        return reject(error);
      }
      if (results.length > 0) {
        // 중복된 HIVE의 ID 가져오기
        resolve(results[0].id);
      } else {
        // 중복된 항목이 없으면 INSERT 수행
        const insertQuery = 'INSERT INTO hives (area_id, name) VALUES (?, ?)';
        connection.query(insertQuery, [areaId, `Hive ${hiveId}`], (insertError, insertResults) => {
          if (insertError) {
            console.error('Error inserting hive:', insertError);
            return reject(insertError);
          }
          resolve(insertResults.insertId);
        });
      }
    });
  });

  console.log(`Hive ID ${hiveDbId} registered or already exists.`);

  // DEVICE 중복 체크 및 ID 가져오기
  const deviceId = await new Promise((resolve, reject) => {
    const query = 'SELECT id FROM devices WHERE hive_id = ? AND type_id = 2';
    connection.query(query, [hiveDbId], (error, results) => {
      if (error) {
        console.error('Error checking device:', error);
        return reject(error);
      }
      if (results.length > 0) {
        // 중복된 DEVICE의 ID 가져오기
        resolve(results[0].id);
      } else {
        // 중복된 항목이 없으면 INSERT 수행
        const insertQuery = 'INSERT INTO devices (hive_id, type_id) VALUES (?, 2)';
        connection.query(insertQuery, [hiveDbId], (insertError, insertResults) => {
          if (insertError) {
            console.error('Error inserting device:', insertError);
            return reject(insertError);
          }
          resolve(insertResults.insertId);
        });
      }
    });
  });

  console.log(`Device ID ${deviceId} registered or already exists.`);

  return deviceId;
};

const processSensorFile = async (filePath, areaId) => {
  console.log(`Processing file: ${filePath} for area_id: ${areaId}`);
  
  // 엑셀 파일 읽기
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // 시트 데이터를 JSON 형식으로 변환
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Read ${data.length} rows from file: ${filePath}`);

  const sensorQuery = `
    INSERT INTO sensor_data (device_id, temp, humi, co2, weigh, time)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      temp = VALUES(temp),
      humi = VALUES(humi),
      co2 = VALUES(co2),
      weigh = VALUES(weigh),
      time = VALUES(time);
  `;

  const hiveDeviceMap = {};
  let batch = [];

  for (let i = 1; i < data.length; i++) { // 첫 번째 행은 헤더이므로 건너뜀
    const row = data[i];
    const [id, device_name, sensor_number, temperature, humidity, co2, , , timestamp] = row;
    if (sensor_number === 1) {
      let hiveId;
      switch (device_name) {
        case 'DEVICE_3':
          hiveId = 6;
          break;
        case 'DEVICE_2':
          hiveId = 5;
          break;
        case 'DEVICE_1':
          hiveId = 4;
          break;
        default:
          hiveId = null;
      }

      if (hiveId !== null) {
        if (!hiveDeviceMap[hiveId]) {
          hiveDeviceMap[hiveId] = await registerHiveAndDevice(connection, areaId, hiveId);
        }
        const deviceId = hiveDeviceMap[hiveId];

        batch.push([deviceId, temperature, humidity, co2, null, timestamp]);

        // 1000개씩 묶어서 배치 인서트
        if (batch.length === 1000) {
          await new Promise((resolve, reject) => {
            connection.query(sensorQuery, [batch], (error, results) => {
              if (error) {
                console.error('Error inserting data:', error);
                reject(error);
              } else {
                console.log(`Processed ${i}/${data.length - 1} rows`);
                resolve();
              }
            });
          });
          batch = []; // 배치를 초기화
        }
      } else {
        console.log(`Invalid device_name in row: ${JSON.stringify(row)}`);
      }
    }
  }

  // 남은 데이터 인서트
  if (batch.length > 0) {
    await new Promise((resolve, reject) => {
      connection.query(sensorQuery, [batch], (error, results) => {
        if (error) {
          console.error('Error inserting data:', error);
          reject(error);
        } else {
          console.log(`Processed remaining ${batch.length} rows`);
          resolve();
        }
      });
    });
  }
};

const currentDir = __dirname;
console.log(`Current directory: ${currentDir}`);

const folders = fs.readdirSync(currentDir).filter(folder => folder.startsWith('#') && fs.statSync(path.join(currentDir, folder)).isDirectory());

console.log('Found folders:', folders);

const processAllFiles = async () => {
  for (const folder of folders) {
    const areaIdMatch = folder.match(/#(\d+)\./);
    const areaId = areaIdMatch ? parseInt(areaIdMatch[1], 10) : null;

    if (areaId !== null) {
      const folderPath = path.join(currentDir, folder);
      const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.xlsx') && !file.includes('['));

      console.log(`Found files in folder ${folder}:`, files);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        await processSensorFile(filePath, areaId);
      }
    } else {
      console.error(`Error: Area ID not found in the folder name: ${folder}`);
    }
  }
};

processAllFiles().then(() => {
  // 데이터베이스 연결 종료
  connection.end((err) => {
    if (err) {
      console.error('Error disconnecting from the database:', err);
      return;
    }
    console.log('Disconnected from the database');
  });
}).catch((err) => {
  console.error('Error processing files:', err);
  connection.end((endErr) => {
    if (endErr) {
      console.error('Error disconnecting from the database:', endErr);
    }
  });
});
