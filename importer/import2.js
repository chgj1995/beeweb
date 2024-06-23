const xlsx = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const API_URL = 'http://localhost:8090'; // API 기본 URL

const registerHive = async (areaId, hiveId) => {
  try {
    const response = await axios.post(`${API_URL}/api/hive`, { areaId, name: `Hive ${hiveId}` });
    return response.data.hiveId;
  } catch (error) {
    console.error('Error registering hive:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const registerDevice = async (hiveId) => {
  try {
    const response = await axios.post(`${API_URL}/api/device`, { hiveId, typeId: 2 });
    return response.data.deviceId;
  } catch (error) {
    console.error('Error registering device:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const processSensorFile = async (filePath, areaId) => {
  console.log(`Processing file: ${filePath} for area_id: ${areaId}`);
  
  // 엑셀 파일 읽기
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // 시트 데이터를 JSON 형식으로 변환
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Read ${data.length} rows from file: ${filePath}`);

  const hiveDeviceMap = {};
  let sensorBatch = [];
  let currentRow = 0;

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
          hiveDeviceMap[hiveId] = await registerHive(areaId, hiveId);
          hiveDeviceMap[hiveId] = await registerDevice(hiveDeviceMap[hiveId]);
        }
        const deviceId = hiveDeviceMap[hiveId];

        sensorBatch.push({ id: deviceId, time: timestamp, temp: temperature, humi: humidity, co2, weigh: null });
        currentRow++;

        // 1000개씩 묶어서 HTTP POST 요청
        if (sensorBatch.length === 1000) {
          await sendBatch(sensorBatch);
          console.log(`Processed ${currentRow}/${data.length - 1} sensor rows for file: ${filePath}`);
          sensorBatch = [];
        }
      } else {
        console.log(`Invalid device_name in row: ${JSON.stringify(row)}`);
      }
    }
  }

  // 남은 데이터 HTTP POST 요청
  if (sensorBatch.length > 0) {
    await sendBatch(sensorBatch);
    console.log(`Processed ${currentRow}/${data.length - 1} sensor rows for file: ${filePath}`);
  }
};

const sendBatch = async (batch) => {
  try {
    await axios.post(`${API_URL}/api/upload`, {
      type: 2,
      data: batch
    });
  } catch (error) {
    console.error('Error sending batch:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const currentDir = __dirname;
console.log(`Current directory: ${currentDir}`);

const folders = fs.readdirSync(currentDir).filter(folder => folder.startsWith('#') && fs.statSync(path.join(currentDir, folder)).isDirectory());

console.log('Found folders:', folders);

const processAllFiles = async () => {
  try {
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
  } catch (error) {
    console.error('Error processing files:', error);
  }
};

processAllFiles().catch((err) => {
  console.error('Error processing files:', err);
});
