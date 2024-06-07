const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 8080;

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

const fetchData = async (connection) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM data', (error, results, fields) => {
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

connectToDatabase()
  .then(connection => {
    app.get('/api/data', async (req, res) => {
      console.log('Received request for /api/data');
      try {
        const data = await fetchData(connection);
        res.json(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to connect to the database:', error);
  });
