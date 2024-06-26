const express = require('express');
const mysql = require('mysql');
const path = require('path');
const { fetchAreasAndHives, fetchInOutData, fetchSensorData } = require('./queries');
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

const createApiHandler = (connection) => {
  return async (req, res) => {
    const { type, areaId, hiveId } = req.params;
    console.log(`Received request for /api/get/${type}/${areaId}/${hiveId}`);
    try {
      let data;
      if (type === 'inout') {
        data = await fetchInOutData(connection, areaId, hiveId);
      } else if (type === 'sensor') {
        data = await fetchSensorData(connection, areaId, hiveId);
      } else {
        return res.status(400).send('Invalid request type');
      }
      res.json(data);
    } catch (error) {
      console.error(`Error fetching data for ${type}/${areaId}/${hiveId}:`, error);
      res.status(500).send('Internal Server Error');
    }
  };
};

// Route to serve the HTML view
app.get('/view/:areaId/hive/:hiveId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// Route to serve the index page
app.get('/api/areas', async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const areas = await fetchAreasAndHives(connection);
    connection.end();
    res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

connectToDatabase()
  .then(connection => {
    app.get('/api/get/:type/:areaId/:hiveId', createApiHandler(connection));
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to connect to the database:', error);
  });
