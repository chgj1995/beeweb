const xlsx = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const API_URL = 'http://localhost:8090'; // API 기본 URL

const registerHiveAndDevice = async (areaId, hiveId) => {
  try {
    // Register Hive
    const responseHive = await axios.post(`${API_URL}/api/hive`, { areaId, name: `Hive ${hiveId}` }, {
      validateStatus: function (status) {
        return status === 201 || status === 409; // Resolve only if the status code is 201 or 409
      }
    });
    const hiveDbId = responseHive.data.hiveId;

    // Register Device
    const responseDevice = await axios.post(`${API_URL}/api/device`, { name:`BeeOnFarm`, hiveId: hiveDbId, typeId: 2 }, {
      validateStatus: function (status) {
        return status === 201 || status === 409; // Resolve only if the status code is 201 or 409
      }
    });
    return responseDevice.data.deviceId;

  } catch (error) {
    console.error('Error registering hive or device:', error.response ? error.response.data : error.message);
    throw error;
  }
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
    // Hive 및 Device 등록
    const deviceId = await registerHiveAndDevice(areaId, hiveId);

    // 엑셀 파일 읽기
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // 시트 데이터를 JSON 형식으로 변환
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const totalRows = data.length - 2; // 헤더를 제외한 전체 행 수

    let sensorBatch = [];
    let currentRow = 0;

    for (let i = 2; i < data.length; i++) { // 두 번째 행까지 헤더이므로 건너뜀
      const row = data[i];
      const [time, temp, humi, co2, , , , weigh] = row;  // 필요한 데이터만 사용

      sensorBatch.push({ id: deviceId, time, temp, humi, co2, weigh });
      currentRow++;

      // 1000개씩 묶어서 HTTP POST 요청
      if (sensorBatch.length === 1000) {
        await sendBatch(sensorBatch);
        console.log(`Processed ${currentRow}/${totalRows} sensor rows for file: ${fileName}`);
        sensorBatch = [];
      }
    }

    // 남은 데이터 HTTP POST 요청
    if (sensorBatch.length > 0) {
      await sendBatch(sensorBatch);
      console.log(`Processed ${currentRow}/${totalRows} sensor rows for file: ${fileName}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
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
  } catch (error) {
    console.error('Error processing files:', error);
  }
};

processAllFiles().catch((err) => {
  console.error('Error processing files:', err);
});
