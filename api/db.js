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
// DATA
// =============================
/**
 * 데이터를 배치로 처리하는 함수
 * 
 * @param {*} connection - 데이터베이스 연결 객체
 * @param {string} query - 실행할 SQL 쿼리
 * @param {Array} data - 처리할 데이터 배열
 * @param {number} batchSize - 배치 크기
 * @returns {Promise<number>} - 처리된 총 데이터 개수
 */
const processBatch = async (connection, query, data, batchSize) => {
    let totalProcessedCount = 0;
    let batch = [];

    const insertBatch = async (batch) => {
        await new Promise((resolve, reject) => {
            connection.query(query, [batch], (error, results) => {
                if (error) {
                    console.error('Error processing batch:', error);
                    return reject(error);
                }
                resolve(results);
            });
        });
        totalProcessedCount += batch.length;
    };

    for (let i = 0; i < data.length; i++) {
        batch.push(data[i]);

        if (batch.length === batchSize) {
            await insertBatch(batch);
            batch = []; // Clear the batch after processing
        }
    }

    // Insert remaining data
    if (batch.length > 0) {
        await insertBatch(batch);
    }

    return totalProcessedCount;
};

// =============================
// INOUT
// =============================
/**
 * @typedef {Object} InOutData
 * @property {number} id - 장치의 Id를 나타냅니다.
 * @property {number} inField - 들어오는 데이터를 나타냅니다.
 * @property {number} outField - 나가는 데이터를 나타냅니다.
 * @property {Date} time - 데이터 생성 시간.
 */

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

/**
 * InOut 데이터를 삽입/업데이트하는 함수
 * 
 * @param {*} connection - 데이터베이스 연결 객체
 * @param {InOutData[]} data 
 */
const insertInOutData = async (connection, data) => {
    const batchSize = 1000;
    const query = `
        INSERT INTO inout_data (device_id, time, in_field, out_field)
        VALUES ?
        ON DUPLICATE KEY UPDATE
            in_field = VALUES(in_field),
            out_field = VALUES(out_field),
            time = VALUES(time)
    `;

    const formattedData = data.map(d => [d.id, d.time, d.inField, d.outField]);
    const totalProcessedCount = await processBatch(connection, query, formattedData, batchSize);

    console.log(`Finished inserting/updating a total of ${totalProcessedCount} rows of inout data`);
};

// =============================
// SENSOR
// =============================
/**
 * @typedef {Object} SensorData
 * @property {number} id - 장치의 Id를 나타냅니다.
 * @property {number} temp - 온도를 나타냅니다.
 * @property {number} humi - 습도를 나타냅니다.
 * @property {number} co2 - 이산화탄소 농도를 나타냅니다.
 * @property {number} weigh - 무게를 나타냅니다.
 * @property {Date} time - 데이터 생성 시간.
 */


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

/**
 * 센서 데이터를 삽입/업데이트하는 함수
 * 
 * @param {*} connection - 데이터베이스 연결 객체
 * @param {SensorData[]} data - 센서 데이터 배열
 */
const insertSensorData = async (connection, data) => {
    const batchSize = 1000;
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
    
    const formattedData = data.map(d => [d.id, d.time, d.temp, d.humi, d.co2, d.weigh]);
    const totalProcessedCount = await processBatch(connection, query, formattedData, batchSize);

    console.log(`Finished inserting/updating a total of ${totalProcessedCount} rows of sensor data`);
};

// =============================
// CAMERA
// =============================
/**
 * @typedef {Object} CameraData
 * @property {number} id - 장치의 Id를 나타냅니다.
 * @property {Buffer} picture - 카메라 이미지 데이터.
 * @property {Date} time - 데이터 생성 시간.
 */

// camera_data를 조회하는 함수
const getCameraDataByDeviceAndTimeRange = (connection, deviceId, sTime, eTime) => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT id, picture, time
        FROM camera_data
        WHERE device_id = ? AND time BETWEEN ? AND ?
        ORDER BY time DESC
      `;
        connection.query(query, [deviceId, sTime, eTime], (error, results) => {
            if (error) {
                console.error('Error fetching camera_data:', error);
                return reject(error);
            }
            resolve(results);
        });
    });
};

/**
 * 카메라 데이터를 삽입/업데이트하는 함수
 * 
 * @param {*} connection - 데이터베이스 연결 객체
 * @param {CameraData[]} data - 카메라 데이터 배열
 */
const insertCameraData = async (connection, data) => {
    const batchSize = 1000;
    const query = `
        INSERT INTO camera_data (device_id, time, picture)
        VALUES ?
        ON DUPLICATE KEY UPDATE
            picture = VALUES(picture),
            time = VALUES(time)
    `;
    
    const formattedData = data.map(d => [d.id, d.time, d.picture]);
    const totalProcessedCount = await processBatch(connection, query, formattedData, batchSize);

    console.log(`Finished inserting/updating a total of ${totalProcessedCount} rows of camera data`);
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
/**
 * @typedef {Object} UploadData
 * @property {number} id - 장치의 Id를 나타냅니다.
 * @property ... - 다른 필드들은 각 장치 타입에 따라 다릅니다.
 */

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

/**
 * 각 device의 IP 주소를 업데이트하는 함수
 * 
 * @param {*} connection - 데이터베이스 연결 객체
 * @param {Array} data - 장치 데이터 배열
 * @param {string} ip - 설정할 IP 주소
 * @returns {Promise} - 모든 업데이트가 완료되면 resolve 되는 Promise
 */
const updateDeviceIP = async (connection, data, ip) => {
    const uniqueDeviceIds = Array.from(new Set(data.map(device => device.id)));
    
    try {
        for (const deviceId of uniqueDeviceIds) {
            await new Promise((resolve, reject) => {
                const query = 'UPDATE devices SET modem_ip = ? WHERE id = ?';
                connection.query(query, [ip, deviceId], (error, results) => {
                    if (error) {
                        console.error(`Error updating IP for device ${deviceId}:`, error);
                        return reject(error);
                    }
                    resolve(results);
                });
            });
        }
        console.log(`Finished updating IP addresses for devices: ${uniqueDeviceIds.join(', ')}`);
    } catch (error) {
        throw new Error('Error updating device IP addresses');
    }
};

module.exports = {
    createDbConnection,
    getAreasAndHives,
    getDevicesByHiveId,
    getInOutDataByDeviceAndTimeRange,
    getSensorDataByDeviceAndTimeRange,
    getCameraDataByDeviceAndTimeRange,
    insertInOutData,
    insertSensorData,
    insertCameraData,
    checkDevice,
    updateDeviceIP,
    addHive,
    addDevice
};