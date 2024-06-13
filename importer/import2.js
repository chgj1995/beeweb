const xlsx = require('xlsx');
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

// MariaDB 연결 설정
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'user',
  password: 'password',
  database: 'hive_data',
  connectTimeout: 10000  // 10초로 타임아웃 시간 설정
});

// 데이터베이스 연결
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

const processSensorFile = async (filePath, areaId) => {
  console.log(`Processing file: ${filePath} for area_id: ${areaId}`);
  
  // 엑셀 파일 읽기
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // 시트 데이터를 JSON 형식으로 변환
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Read ${data.length} rows from file: ${filePath}`);

  const query = `
    INSERT INTO sensor_data (data_id, hive_id, area_id, temp, humi, co2, time)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      temp = VALUES(temp),
      humi = VALUES(humi),
      co2 = VALUES(co2),
      time = VALUES(time);
  `;

  // hive_id별로 data_id를 추적하기 위한 객체
  const hiveDataIds = {};
  let batch = [];

  for (let i = 1; i < data.length; i++) { // 첫 번째 행은 헤더이므로 건너뜀
    const row = data[i];
    const [id, device_name, sensor_number, temperature, humidity, co2, wind_velocity, kg, timestamp] = row;
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
        // 해당 hiveId에 대한 data_id를 증가시킴
        if (!hiveDataIds[hiveId]) {
          hiveDataIds[hiveId] = 1;
        }

        const dataId = hiveDataIds[hiveId];
        hiveDataIds[hiveId] += 1;

        batch.push([dataId, hiveId, areaId, temperature, humidity, co2, timestamp]);

        // 1000개씩 묶어서 배치 인서트
        if (batch.length === 1000) {
          await new Promise((resolve, reject) => {
            connection.query(query, [batch], (error, results) => {
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
      connection.query(query, [batch], (error, results) => {
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
