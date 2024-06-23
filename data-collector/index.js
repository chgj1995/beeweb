const mysql = require('mysql');
const axios = require('axios');

console.log('Starting the data collector script...');

// Convert ISO 8601 format to MySQL DATETIME format
function convertToMySQLDateTime(isoDate) {
  return isoDate.replace('T', ' ').substring(0, 19);
}

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const attemptConnection = () => {
      connection.connect((err) => {
        if (err) {
          console.error('Error connecting to the database:', err);
          setTimeout(attemptConnection, 5000); // 5초 후에 다시 시도
        } else {
          console.log('Connected to the database');
          resolve(connection);
        }
      });
    };

    attemptConnection();
  });
};

const insertChirpstackBatchData = (connection, batch) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO chirpstack_data (entry_id, group_id, field1, field2, field3, field4, field5, field6, created_at)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        field1 = VALUES(field1),
        field2 = VALUES(field2),
        field3 = VALUES(field3),
        field4 = VALUES(field4),
        field5 = VALUES(field5),
        field6 = VALUES(field6),
        created_at = VALUES(created_at)
    `;

    connection.query(query, [batch], (error, results, fields) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

const insertInOutDataBatch = (connection, batch) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO inout_data (device_id, in_field, out_field, time)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        in_field = VALUES(in_field),
        out_field = VALUES(out_field),
        time = VALUES(time)
    `;

    connection.query(query, [batch], (error, results, fields) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

const fetchAndInsertData = async (connection, group_id, results = 5) => {
  let url = `https://api.thingspeak.com/channels/${process.env[`CHANNEL_ID${group_id}`]}/feeds.json?results=${results}`;
  console.log(`Fetching data from: ${url}`);
  
  try {
    const response = await axios.get(url);
    const data = response.data.feeds;
    const maxEntryId = response.data.channel.last_entry_id;

    if (!data || data.length === 0) {
      console.log('No data found in the response.');
      return { maxEntryId, newEntryIds: [] };
    }

    let batch = [];
    let newEntryIds = [];
    let insertedCount = 0;

    for (let entry of data) {
      const values = [
        entry.entry_id,
        group_id,
        entry.field1,
        entry.field2,
        entry.field3,
        entry.field4,
        entry.field5,
        entry.field6,
        convertToMySQLDateTime(entry.created_at)
      ];

      batch.push(values);
      newEntryIds.push(entry.entry_id);

      if (batch.length === 1000) {
        await insertChirpstackBatchData(connection, batch);
        insertedCount += batch.length;
        console.log(`Inserted/updated ${insertedCount} rows`);
        batch = [];
      }
    }

    // 남은 데이터 인서트
    if (batch.length > 0) {
      await insertChirpstackBatchData(connection, batch);
      insertedCount += batch.length;
      console.log(`Inserted/updated ${insertedCount} rows`);
    }

    return { maxEntryId, newEntryIds };
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
  }
};

const updateInOutData = async (connection, groupId, newEntryIds) => {
  const hiveIds = groupId === 1 ? [1, 2, 3] : [4, 5, 6]; // group_id에 따라 hive_ids 설정

  const hiveDeviceMap = {};
  for (const hiveId of hiveIds) {
    hiveDeviceMap[hiveId] = await registerHiveAndDevice(connection, hiveId);
  }

  const selectQuery = `
    SELECT entry_id, group_id, field1, field2, field3, field4, field5, field6, created_at
    FROM chirpstack_data
    WHERE entry_id IN (?) AND group_id = ?
  `;

  const rows = await new Promise((resolve, reject) => {
    connection.query(selectQuery, [newEntryIds, groupId], (error, results) => {
      if (error) {
        console.error('Error fetching data from chirpstack_data:', error);
        return reject(error);
      }
      resolve(results);
    });
  });

  console.log('Fetched rows from chirpstack_data:', rows.length);

  let processedCount = 0;
  let totalCount = 0;

  for (const row of rows) {
    let batch = [];
    if (groupId === 1) {
      if (row.field1 !== null || row.field2 !== null) {
        batch.push([hiveDeviceMap[1], row.field1, row.field2, row.created_at]);
      }
      if (row.field3 !== null || row.field4 !== null) {
        batch.push([hiveDeviceMap[2], row.field3, row.field4, row.created_at]);
      }
      if (row.field5 !== null || row.field6 !== null) {
        batch.push([hiveDeviceMap[3], row.field5, row.field6, row.created_at]);
      }
    } else if (groupId === 2) {
      if (row.field1 !== null || row.field2 !== null) {
        batch.push([hiveDeviceMap[4], row.field1, row.field2, row.created_at]);
      }
      if (row.field3 !== null || row.field4 !== null) {
        batch.push([hiveDeviceMap[5], row.field3, row.field4, row.created_at]);
      }
      if (row.field5 !== null || row.field6 !== null) {
        batch.push([hiveDeviceMap[6], row.field5, row.field6, row.created_at]);
      }
    }

    if (batch.length > 0) {
      await insertInOutDataBatch(connection, batch);  // 수정된 부분
      processedCount += batch.length;
      totalCount += batch.length;

      if (processedCount >= 1000) {
        console.log(`Processed ${totalCount} entries`);
        processedCount = 0;
      }
    }
  }

  console.log(`Finished processing ${totalCount} entries in total`);
};

const registerHiveAndDevice = async (connection, hiveId) => {
  const areaId = 1; // area_id는 항상 1로 가정

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
    const query = 'SELECT id FROM devices WHERE hive_id = ? AND type_id = 3';
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
        const insertQuery = 'INSERT INTO devices (hive_id, type_id) VALUES (?, 3)';
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

const startScheduler = async () => {
  try {
    console.log('Connecting to the database...');
    const connection = await connectToDatabase();
    console.log('Scheduler started. Fetching data immediately...');

    const fetchDataWithDelay = async (isInitial = false) => {
      const currentTime = new Date().toLocaleString();
      console.log(`[${currentTime}] Fetching data...`);

      let result1, result2;

      if (isInitial) {
        result1 = await fetchAndInsertData(connection, 1, 8000);
        result2 = await fetchAndInsertData(connection, 2, 8000);
      } else {
        result1 = await fetchAndInsertData(connection, 1);
        result2 = await fetchAndInsertData(connection, 2);
      }

      await updateInOutData(connection, 1, result1.newEntryIds); // 인천대
      await updateInOutData(connection, 2, result2.newEntryIds); // 인천대

      setTimeout(() => fetchDataWithDelay(false), 10 * 60 * 1000); // 10분마다 실행
    };

    // 초기 실행에서는 8000개 데이터를 가져옴
    await fetchDataWithDelay(true);

    // 이후에는 5개 데이터를 주기적으로 가져옴
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
};

startScheduler();
