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

const insertBatchData = (connection, batch) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO inout_data (entry_id, group_id, field1, field2, field3, field4, field5, field6, created_at)
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

const fetchAndInsertData = async (connection, group_id, results = 5) => {
  let url = `https://api.thingspeak.com/channels/${process.env[`CHANNEL_ID${group_id}`]}/feeds.json?results=${results}`;
  console.log(`Fetching data from: ${url}`);
  
  try {
    const response = await axios.get(url);
    const data = response.data.feeds;
    const maxEntryId = response.data.channel.last_entry_id;

    if (!data || data.length === 0) {
      console.log('No data found in the response.');
      return maxEntryId;
    }

    let batch = [];
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

      if (batch.length === 1000) {
        await insertBatchData(connection, batch);
        insertedCount += batch.length;
        console.log(`Inserted/updated ${insertedCount} rows`);
        batch = [];
      }
    }

    // 남은 데이터 인서트
    if (batch.length > 0) {
      await insertBatchData(connection, batch);
      insertedCount += batch.length;
      console.log(`Inserted/updated ${insertedCount} rows`);
    }

    return maxEntryId;
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
  }
};

const startScheduler = async () => {
  try {
    console.log('Connecting to the database...');
    const connection = await connectToDatabase();
    console.log('Scheduler started. Fetching data immediately...');

    const fetchDataWithDelay = async (isInitial = false) => {
      const currentTime = new Date().toLocaleString();
      console.log(`[${currentTime}] Fetching data...`);

      if (isInitial) {
        await fetchAndInsertData(connection, 1, 8000);
        await fetchAndInsertData(connection, 2, 8000);
      } else {
        await fetchAndInsertData(connection, 1);
        await fetchAndInsertData(connection, 2);
      }

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
