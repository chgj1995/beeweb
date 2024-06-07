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

const fetchData = async (connection) => {
  const url = `https://api.thingspeak.com/channels/${process.env.CHANNEL_ID}/feeds.json?results=10`;
  console.log(`Fetching data from: ${url}`);
  try {
    const response = await axios.get(url);
    const data = response.data.feeds;

    if (!data || data.length === 0) {
      console.log('No data found in the response.');
      return;
    }

    data.forEach(entry => {
      const query = `
        INSERT INTO data (entry_id, field1, field2, field3, field4, field5, field6, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        field1 = VALUES(field1),
        field2 = VALUES(field2),
        field3 = VALUES(field3),
        field4 = VALUES(field4),
        field5 = VALUES(field5),
        field6 = VALUES(field6),
        created_at = VALUES(created_at)
      `;
      const values = [entry.entry_id, entry.field1, entry.field2, entry.field3, entry.field4, entry.field5, entry.field6, convertToMySQLDateTime(entry.created_at)];
      connection.query(query, values, (error, results, fields) => {
        if (error) throw error;
        console.log('Data inserted/updated for entry_id:', entry.entry_id);
      });
    });
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

    const fetchDataWithDelay = async () => {
      const currentTime = new Date().toLocaleString();
      console.log(`[${currentTime}] Fetching data...`);
      await fetchData(connection);
      console.log('Waiting for 1 minute before fetching data again...');
      setTimeout(fetchDataWithDelay, 5*60*1000); // 5분마다 실행
    };

    // 처음 즉시 실행
    fetchDataWithDelay();
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
};

startScheduler();
