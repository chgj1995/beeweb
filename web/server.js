const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 80;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve Chart.js from node_modules
app.use('/chart.js', express.static(path.join(__dirname, 'node_modules/chart.js/dist')));

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

const fetchInOutData = async (connection, group_id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM inout_data WHERE group_id = ${group_id} ORDER BY created_at DESC LIMIT 10`;
    connection.query(query, (error, results, fields) => {
      if (error) {
        console.error('Error querying the database:', error);
        return reject(error);
      }

      const entry_ids = results.map(row => row.entry_id);
      const field1Data = results.map(row => row.field1);
      const field2Data = results.map(row => row.field2);
      const field3Data = results.map(row => row.field3);
      const field4Data = results.map(row => row.field4);
      const field5Data = results.map(row => row.field5);
      const field6Data = results.map(row => row.field6);

      resolve({
        entry_ids,
        field1: field1Data,
        field2: field2Data,
        field3: field3Data,
        field4: field4Data,
        field5: field5Data,
        field6: field6Data,
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

      const data_id = results.map(row => row.data_id);
      const tempData = results.map(row => row.temp);
      const humiData = results.map(row => row.humi);
      const co2Data = results.map(row => row.co2);

      resolve({
        data_id,
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
