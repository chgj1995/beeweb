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

const processFile = async (filePath, areaId) => {
  console.log(`Processing file: ${filePath} for area_id: ${areaId}`);
  const fileName = path.basename(filePath);
  const hiveIdMatch = fileName.match(/\[([0-9]+)\]/);
  const hiveId = hiveIdMatch ? parseInt(hiveIdMatch[1], 10) : null;

  if (hiveId === null) {
    console.error(`Error: Hive ID not found in the file name: ${fileName}`);
    return;
  }

  try {
    // 데이터베이스 연결
    const connection = mysql.createConnection(connectionConfig);
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) {
          console.error('Error connecting to the database:', err);
          reject(err);
        } else {
          console.log('Connected to the database');
          resolve();
        }
      });
    });

    // 엑셀 파일 읽기
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // 시트 데이터를 JSON 형식으로 변환
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const totalRows = data.length - 2; // 헤더를 제외한 전체 행 수

    const query = `
      INSERT INTO sensor_data (data_id, hive_id, area_id, temp, humi, co2, weigh, time)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        temp = VALUES(temp),
        humi = VALUES(humi),
        co2 = VALUES(co2),
        time = VALUES(time),
        weigh = VALUES(weigh);
    `;

    let batch = [];
    let currentRow = 0;

    for (let i = 2; i < data.length; i++) { // 두 번째 행까지 헤더이므로 건너뜀
      const row = data[i];
      const [time, temp, humi, co2, unused1, unused2, unused3, weigh] = row;
      const dataId = i - 1; // data_id는 행 번호-1 로 설정

      batch.push([dataId, hiveId, areaId, temp, humi, co2, weigh, time]);
      currentRow++;

      // 100개씩 묶어서 배치 인서트
      if (batch.length === 1000) {
        await new Promise((resolve, reject) => {
          connection.query(query, [batch], (error, results) => {
            if (error) {
              console.error('Error inserting data for file:', fileName, error);
              reject(error);
            } else {
              console.log(`Processed ${currentRow}/${totalRows} rows for file: ${fileName}`);
              resolve();
            }
          });
        });
        batch = []; // 배치를 초기화
      }
    }

    // 남은 데이터 인서트
    if (batch.length > 0) {
      await new Promise((resolve, reject) => {
        connection.query(query, [batch], (error, results) => {
          if (error) {
            console.error('Error inserting data for file:', fileName, error);
            reject(error);
          } else {
            console.log(`Processed ${currentRow}/${totalRows} rows for file: ${fileName}`);
            resolve();
          }
        });
      });
    }

    // 데이터베이스 연결 종료
    await new Promise((resolve, reject) => {
      connection.end((err) => {
        if (err) {
          console.error('Error disconnecting from the database:', err);
          reject(err);
        } else {
          console.log('Disconnected from the database');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
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
      const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.xlsx') && file.includes('['));

      console.log(`Found files in folder ${folder}:`, files);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        await processFile(filePath, areaId);
      }
    } else {
      console.error(`Error: Area ID not found in the folder name: ${folder}`);
    }
  }
};

processAllFiles();
