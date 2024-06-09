const xlsx = require('xlsx');
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

// MariaDB 연결 설정
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'user',
  password: 'password',
  database: 'hive_data'
});

// 데이터베이스 연결
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

const processFile = async (filePath) => {
  const fileName = path.basename(filePath);
  const hiveIdMatch = fileName.match(/\[([0-9]+)\]/);
  const hiveId = hiveIdMatch ? parseInt(hiveIdMatch[1], 10) : null;

  if (hiveId === null) {
    console.error(`Error: Hive ID not found in the file name: ${fileName}`);
    return;
  }

  // 엑셀 파일 읽기
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // 시트 데이터를 JSON 형식으로 변환
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const query = `
    INSERT INTO sensor_data (data_id, hive_id, temp, humi, co2, time)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      temp = VALUES(temp),
      humi = VALUES(humi),
      co2 = VALUES(co2),
      time = VALUES(time);
  `;

  for (let i = 2; i < data.length; i++) { // 두 번째 행까지 헤더이므로 건너뜀
    const row = data[i];
    const [time, temp, humi, co2] = row;
    const dataId = i - 1; // data_id는 행 번호-1 로 설정

    connection.query(query, [dataId, hiveId, temp, humi, co2, time], (error, results) => {
      if (error) {
        console.error('Error inserting data for file:', fileName, error);
        return;
      }
      if (i % 100 === 0) {
        console.log(`Processed ${i} rows for file: ${fileName}`);
      }
    });
  }
};

const currentDir = __dirname;
const files = fs.readdirSync(currentDir).filter(file => file.endsWith('.xlsx') && file.includes('['));

files.forEach(file => {
  const filePath = path.join(currentDir, file);
  processFile(filePath);
});

// 데이터베이스 연결 종료
connection.end((err) => {
  if (err) {
    console.error('Error disconnecting from the database:', err);
    return;
  }
  console.log('Disconnected from the database');
});
