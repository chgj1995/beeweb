const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 80;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve Chart.js from node_modules
app.use('/chart.js', express.static(path.join(__dirname, 'node_modules/chart.js/dist')));
app.use('/chartjs-adapter-date-fns', express.static(path.join(__dirname, 'node_modules/chartjs-adapter-date-fns/dist')));

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(dbConfig);

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

const fetchInOutData = async (connection, hive_id) => {
  return new Promise((resolve, reject) => {
    hive_id = parseInt(hive_id, 10);  // hive_id를 정수로 변환

    let query = '';
    if (hive_id === 1) {
      query = `SELECT created_at, field1 AS in_field, field2 AS out_field FROM inout_data WHERE group_id = 1 AND field1 IS NOT NULL AND field2 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
    } else if (hive_id === 2) {
      query = `SELECT created_at, field3 AS in_field, field4 AS out_field FROM inout_data WHERE group_id = 1 AND field3 IS NOT NULL AND field4 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
    } else if (hive_id === 3) {
      query = `SELECT created_at, field5 AS in_field, field6 AS out_field FROM inout_data WHERE group_id = 1 AND field5 IS NOT NULL AND field6 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
    } else if (hive_id === 4) {
      query = `SELECT created_at, field1 AS in_field, field2 AS out_field FROM inout_data WHERE group_id = 2 AND field1 IS NOT NULL AND field2 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
    } else if (hive_id === 5) {
      query = `SELECT created_at, field3 AS in_field, field4 AS out_field FROM inout_data WHERE group_id = 2 AND field3 IS NOT NULL AND field4 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
    } else if (hive_id === 6) {
      query = `SELECT created_at, field5 AS in_field, field6 AS out_field FROM inout_data WHERE group_id = 2 AND field5 IS NOT NULL AND field6 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
    } else {
      reject(new Error('Invalid hive_id'));
      return;
    }

    connection.query(query, (error, results, fields) => {
      if (error) {
        console.error('Error querying the database:', error);
        return reject(error);
      }

      const created_at = results.map(row => row.created_at);
      const inFieldData = results.map(row => row.in_field);
      const outFieldData = results.map(row => row.out_field);

      resolve({
        created_at,
        in: inFieldData,
        out: outFieldData,
      });
    });
  });
};

const fetchSensorData = async (connection, hive_id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM sensor_data WHERE hive_id = ${hive_id} ORDER BY time DESC LIMIT 10`;
    connection.query(query, (error, results, fields) => {
      if (error) {
        console.error('Error querying the database:', error);
        return reject(error);
      }

      const time = results.map(row => row.time);
      const tempData = results.map(row => row.temp);
      const humiData = results.map(row => row.humi);
      const co2Data = results.map(row => row.co2);

      resolve({
        time,
        temp: tempData,
        humi: humiData,
        co2: co2Data,
      });
    });
  });
};

const createApiHandler = (connection) => {
  return async (req, res) => {
    const { type, id } = req.params;
    console.log(`Received request for /api/get/${type}/${id}`);
    try {
      let data;
      if (type === 'inout') {
        data = await fetchInOutData(connection, id);
      } else if (type === 'sensor') {
        data = await fetchSensorData(connection, id);
      } else {
        return res.status(400).send('Invalid request type');
      }
      res.json(data);
    } catch (error) {
      console.error(`Error fetching data for ${type}/${id}:`, error);
      res.status(500).send('Internal Server Error');
    }
  };
};

connectToDatabase()
  .then(connection => {
    app.get('/api/get/:type/:id', createApiHandler(connection));

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to connect to the database:', error);
  });
