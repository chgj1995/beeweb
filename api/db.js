const mysql = require('mysql');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mydatabase',
};

const createDbConnection = () => {
    const connection = mysql.createConnection(dbConfig);

    const attemptConnection = () => {
        connection.connect((err) => {
            if (err) {
                console.error('Error connecting to the database:', err);
                setTimeout(attemptConnection, 5000); // 5초 후에 다시 시도
            } else {
                console.log('Connected to the database');
            }
        });
    };

    attemptConnection();
    return connection;
};

// =============================
// AREA & HIVE
// =============================
const getAreasAndHives = (connection) => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT 
          a.id AS area_id, a.name AS area_name, 
          h.id AS hive_id, h.name AS hive_name
        FROM areas a
        LEFT JOIN hives h ON a.id = h.area_id;
      `;

        connection.query(query, (error, results) => {
            if (error) {
                console.error('Error querying the database:', error);
                return reject(error);
            }

            const areasMap = {};

            results.forEach(row => {
                const { area_id, area_name, hive_id, hive_name } = row;

                if (!areasMap[area_id]) {
                    areasMap[area_id] = {
                        id: area_id,
                        name: area_name,
                        hives: []
                    };
                }

                if (hive_id) {
                    areasMap[area_id].hives.push({
                        id: hive_id,
                        name: hive_name
                    });
                }
            });

            const areas = Object.values(areasMap);
            resolve(areas);
        });
    });
};

// =============================
// DEVICES
// =============================
// Devices를 조회하는 함수
const getDevicesByHiveId = (connection, hiveId) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id, type_id FROM devices WHERE hive_id = ?';
        connection.query(query, [hiveId], (error, results) => {
            if (error) {
                console.error('Error fetching devices:', error);
                return reject(error);
            }
            resolve(results.map(device => ({ id: device.id, type: device.type_id })));
        });
    });
};

const checkDevice = (connection, id, type) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id FROM devices WHERE id = ? AND type_id = ?';
        connection.query(query, [id, type], (error, results) => {
            if (error) {
                console.error('Error checking device:', error);
                return reject(error);
            }
            resolve(results);
        });
    });
};

// =============================
// INOUT
// =============================
const getInOutDataByDeviceAndTimeRange = (connection, deviceId, sTime, eTime) => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT id, in_field, out_field, time
        FROM inout_data
        WHERE device_id = ? AND time BETWEEN ? AND ?
        ORDER BY time DESC
      `;

        connection.query(query, [deviceId, sTime, eTime], (error, results) => {
            if (error) {
                console.error('Error fetching inout_data:', error.sqlMessage || error);
                return reject(error);
            }
            resolve(results);
        });
    });
};
const insertInOutData = async (connection, data) => {
    const batchSize = 1000;
    let totalProcessedCount = 0;
    let batch = [];

    const insertBatch = async (batch) => {
        await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO inout_data (device_id, time, in_field, out_field)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    in_field = VALUES(in_field),
                    out_field = VALUES(out_field),
                    time = VALUES(time)
            `;
            connection.query(query, [batch], (error, results) => {
                if (error) {
                    console.error('Error inserting inout data:', error);
                    return reject(error);
                }
                resolve(results);
            });
        });
        totalProcessedCount += batch.length;
    };

    for (let i = 0; i < data.length; i++) {
        batch.push([data[i].id, data[i].time, data[i].inField, data[i].outField]);

        if (batch.length === batchSize) {
            await insertBatch(batch);
            batch = []; // Clear the batch after processing
        }
    }

    // Insert remaining data
    if (batch.length > 0) {
        await insertBatch(batch);
    }

    console.log(`Finished inserting/updating a total of ${totalProcessedCount} rows of inout data`);
};


// =============================
// SENSOR
// =============================
// sensor_data를 조회하는 함수
const getSensorDataByDeviceAndTimeRange = (connection, deviceId, sTime, eTime) => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT id, temp, humi, co2, weigh, time
        FROM sensor_data
        WHERE device_id = ? AND time BETWEEN ? AND ?
        ORDER BY time DESC
      `;
        connection.query(query, [deviceId, sTime, eTime], (error, results) => {
            if (error) {
                console.error('Error fetching sensor_data:', error);
                return reject(error);
            }
            resolve(results);
        });
    });
};

const insertSensorData = async (connection, data) => {
    const batchSize = 1000;
    let totalProcessedCount = 0;
    let batch = [];

    const insertBatch = async (batch) => {
        await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO sensor_data (device_id, time, temp, humi, co2, weigh)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    temp = VALUES(temp),
                    humi = VALUES(humi),
                    co2 = VALUES(co2),
                    weigh = VALUES(weigh),
                    time = VALUES(time)
            `;
            connection.query(query, [batch], (error, results) => {
                if (error) {
                    console.error('Error inserting sensor data:', error);
                    return reject(error);
                }
                resolve(results);
            });
        });
        totalProcessedCount += batch.length;
    };

    for (let i = 0; i < data.length; i++) {
        batch.push([data[i].id, data[i].time, data[i].temp, data[i].humi, data[i].co2, data[i].weigh]);

        if (batch.length === batchSize) {
            await insertBatch(batch);
            batch = []; // Clear the batch after processing
        }
    }

    // Insert remaining data
    if (batch.length > 0) {
        await insertBatch(batch);
    }

    console.log(`Finished inserting/updating a total of ${totalProcessedCount} rows of sensor data`);
};

// =============================
// HIVE
// =============================
const addHive = (connection, areaId, name) => {
    return new Promise((resolve, reject) => {
      // 먼저 중복 체크
      const checkQuery = 'SELECT id FROM hives WHERE area_id = ? AND name = ?';
      connection.query(checkQuery, [areaId, name], (checkError, checkResults) => {
        if (checkError) {
          console.error('Error checking hive:', checkError);
          return reject(checkError);
        }
        if (checkResults.length > 0) {
          // 이미 존재하는 경우
          resolve({ message: 'Hive already exists', hiveId: checkResults[0].id });
        } else {
          // 존재하지 않으면 새로 삽입
          const insertQuery = 'INSERT INTO hives (area_id, name) VALUES (?, ?)';
          connection.query(insertQuery, [areaId, name], (insertError, insertResults) => {
            if (insertError) {
              console.error('Error adding hive:', insertError);
              return reject(insertError);
            }
            resolve({ message: 'Hive added successfully', hiveId: insertResults.insertId });
          });
        }
      });
    });
  };
  

// =============================
// DEVICE
// =============================
const addDevice = (connection, hiveId, typeId) => {
    return new Promise((resolve, reject) => {
      // 먼저 중복 체크
      const checkQuery = 'SELECT id FROM devices WHERE hive_id = ? AND type_id = ?';
      connection.query(checkQuery, [hiveId, typeId], (checkError, checkResults) => {
        if (checkError) {
          console.error('Error checking device:', checkError);
          return reject(checkError);
        }
        if (checkResults.length > 0) {
          // 이미 존재하는 경우
          resolve({ message: 'Device already exists', deviceId: checkResults[0].id });
        } else {
          // 존재하지 않으면 새로 삽입
          const insertQuery = 'INSERT INTO devices (hive_id, type_id) VALUES (?, ?)';
          connection.query(insertQuery, [hiveId, typeId], (insertError, insertResults) => {
            if (insertError) {
              console.error('Error adding device:', insertError);
              return reject(insertError);
            }
            resolve({ message: 'Device added successfully', deviceId: insertResults.insertId });
          });
        }
      });
    });
  };
  
  module.exports = {
    createDbConnection,
    getAreasAndHives,
    getDevicesByHiveId,
    getInOutDataByDeviceAndTimeRange,
    getSensorDataByDeviceAndTimeRange,
    insertInOutData,
    insertSensorData,
    checkDevice,
    addHive,
    addDevice
  };