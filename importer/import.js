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

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(connectionConfig);
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        reject(err);
      } else {
        console.log('Connected to the database');
        resolve(connection);
      }
    });
  });
};

const registerHive = async (connection, areaId, hiveId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id FROM hives WHERE area_id = ? AND name = ?';
    connection.query(query, [areaId, `Hive ${hiveId}`], (error, results) => {
      if (error) {
        console.error('Error checking hive:', error);
        return reject(error);
      }
      if (results.length > 0) {
        resolve(results[0].id);
      } else {
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
};

const registerDevice = async (connection, hiveId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id FROM devices WHERE hive_id = ? AND type_id = 2';
    connection.query(query, [hiveId], (error, results) => {
      if (error) {
        console.error('Error checking device:', error);
        return reject(error);
      }
      if (results.length > 0) {
        resolve(results[0].id);
      } else {
        const insertQuery = 'INSERT INTO devices (hive_id, type_id) VALUES (?, 2)';
        connection.query(insertQuery, [hiveId], (insertError, insertResults) => {
          if (insertError) {
            console.error('Error inserting device:', insertError);
            return reject(insertError);
          }
          resolve(insertResults.insertId);
        });
      }
    });
  });
};

const processFile = async (connection, filePath, areaId) => {
  console.log(`Processing file: ${filePath} for area_id: ${areaId}`);
  const fileName = path.basename(filePath);
  const hiveIdMatch = fileName.match(/\[([0-9]+)\]/);
  const hiveId = hiveIdMatch ? parseInt(hiveIdMatch[1], 10) : null;

  if (hiveId === null) {
    console.error(`Error: Hive ID not found in the file name: ${fileName}`);
    return;
  }

  try {
    // Hive 및 Device 등록
    const hiveDbId = await registerHive(connection, areaId, hiveId);
    const deviceId = await registerDevice(connection, hiveDbId);

    // 엑셀 파일 읽기
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // 시트 데이터를 JSON 형식으로 변환
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const totalRows = data.length - 2; // 헤더를 제외한 전체 행 수

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

    let sensorBatch = [];
    let currentRow = 0;

    for (let i = 2; i < data.length; i++) { // 두 번째 행까지 헤더이므로 건너뜀
      const row = data[i];
      const [time, temp, humi, co2, , , , weigh] = row;  // 필요한 데이터만 사용

      sensorBatch.push([deviceId, temp, humi, co2, weigh, time]);
      currentRow++;

      // 1000개씩 묶어서 배치 인서트
      if (sensorBatch.length === 1000) {
        await new Promise((resolve, reject) => {
          connection.query(sensorQuery, [sensorBatch], (error, results) => {
            if (error) {
              console.error('Error inserting sensor data for file:', fileName, error);
              return reject(error);
            } else {
              console.log(`Processed ${currentRow}/${totalRows} sensor rows for file: ${fileName}`);
              resolve();
            }
          });
        });
        sensorBatch = [];
      }
    }

    // 남은 데이터 인서트
    if (sensorBatch.length > 0) {
      await new Promise((resolve, reject) => {
        connection.query(sensorQuery, [sensorBatch], (error, results) => {
          if (error) {
            console.error('Error inserting sensor data for file:', fileName, error);
            return reject(error);
          } else {
            console.log(`Processed ${currentRow}/${totalRows} sensor rows for file: ${fileName}`);
            resolve();
          }
        });
      });
    }
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
};

const currentDir = __dirname;
console.log(`Current directory: ${currentDir}`);

const folders = fs.readdirSync(currentDir).filter(folder => folder.startsWith('#') && fs.statSync(path.join(currentDir, folder)).isDirectory());

console.log('Found folders:', folders);

const processAllFiles = async () => {
  const connection = await connectToDatabase();

  try {
    for (const folder of folders) {
      const areaIdMatch = folder.match(/#(\d+)\./);
      const areaId = areaIdMatch ? parseInt(areaIdMatch[1], 10) : null;

      if (areaId !== null) {
        const folderPath = path.join(currentDir, folder);
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.xlsx') && file.includes('['));

        console.log(`Found files in folder ${folder}:`, files);

        for (const file of files) {
          const filePath = path.join(folderPath, file);
          await processFile(connection, filePath, areaId);
        }
      } else {
        console.error(`Error: Area ID not found in the folder name: ${folder}`);
      }
    }
  } finally {
    connection.end((err) => {
      if (err) {
        console.error('Error disconnecting from the database:', err);
        return;
      }
      console.log('Disconnected from the database');
    });
  }
};

processAllFiles().catch((err) => {
  console.error('Error processing files:', err);
});
