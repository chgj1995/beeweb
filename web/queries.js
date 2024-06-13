const fetchAreasAndHives = (connection) => {
    return new Promise((resolve, reject) => {
      // 먼저 sensor_data에서 area_id와 hive_id를 가져옴
      const sensorDataQuery = 'SELECT area_id, hive_id FROM sensor_data GROUP BY area_id, hive_id';
  
      connection.query(sensorDataQuery, (sensorError, sensorResults) => {
        if (sensorError) {
          console.error('Error querying sensor_data:', sensorError);
          return reject(sensorError);
        }
  
        const areas = {};
        sensorResults.forEach(row => {
          if (!areas[row.area_id]) {
            areas[row.area_id] = [];
          }
          areas[row.area_id].push(row.hive_id);
        });
  
        // inout_data에서 조건에 맞는 hive_id를 추가
        const inOutDataQueries = [
          `SELECT 1 AS area_id, 1 AS hive_id FROM inout_data WHERE group_id = 1 AND field1 IS NOT NULL LIMIT 1`,
          `SELECT 1 AS area_id, 2 AS hive_id FROM inout_data WHERE group_id = 1 AND field3 IS NOT NULL LIMIT 1`,
          `SELECT 1 AS area_id, 3 AS hive_id FROM inout_data WHERE group_id = 1 AND field5 IS NOT NULL LIMIT 1`,
          `SELECT 1 AS area_id, 4 AS hive_id FROM inout_data WHERE group_id = 2 AND field1 IS NOT NULL LIMIT 1`,
          `SELECT 1 AS area_id, 5 AS hive_id FROM inout_data WHERE group_id = 2 AND field3 IS NOT NULL LIMIT 1`,
          `SELECT 1 AS area_id, 6 AS hive_id FROM inout_data WHERE group_id = 2 AND field5 IS NOT NULL LIMIT 1`
        ];
  
        const promises = inOutDataQueries.map(query => {
          return new Promise((resolveQuery, rejectQuery) => {
            connection.query(query, (inOutError, inOutResults) => {
              if (inOutError) {
                console.error('Error querying inout_data:', inOutError);
                return rejectQuery(inOutError);
              }
  
              inOutResults.forEach(row => {
                if (!areas[row.area_id]) {
                  areas[row.area_id] = [];
                }
                if (!areas[row.area_id].includes(row.hive_id)) {
                  areas[row.area_id].push(row.hive_id);
                }
              });
  
              resolveQuery();
            });
          });
        });
  
        Promise.all(promises)
          .then(() => {
            // 반환하기 전에 정렬
            Object.keys(areas).forEach(area_id => {
              areas[area_id].sort((a, b) => a - b);
            });
            resolve(areas);
          })
          .catch(reject);
      });
    });
  };

const fetchInOutData = (connection, area_id, hive_id) => {
    return new Promise((resolve, reject) => {
        hive_id = parseInt(hive_id, 10);  // hive_id를 정수로 변환

        if (area_id !== '1') {
            console.warn(`InOut data is not available for area_id`);
            return resolve({
                created_at: [],
                in: [],
                out: []
            });
        }

        // hive id가 1, 2, 3이면 group_id는 1
        // hive id가 4, 5, 6이면 group_id는 2에 hive id는 1, 2, 3으로 변환
        let group_id = 1;
        if (hive_id === 4 || hive_id === 5 || hive_id === 6) {
            group_id = 2;
            hive_id -= 3;
        }

        let query = '';
        if (hive_id === 1) {
            query = `SELECT created_at, field1 AS in_field, field2 AS out_field FROM inout_data WHERE group_id = ${group_id} AND field1 IS NOT NULL AND field2 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
        } else if (hive_id === 2) {
            query = `SELECT created_at, field3 AS in_field, field4 AS out_field FROM inout_data WHERE group_id = ${group_id} AND field3 IS NOT NULL AND field4 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
        } else if (hive_id === 3) {
            query = `SELECT created_at, field5 AS in_field, field6 AS out_field FROM inout_data WHERE group_id = ${group_id} AND field5 IS NOT NULL AND field6 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
        } else {
            console.error('Invalid hive_id');
            return reject(new Error('Invalid hive_id'));
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

const fetchSensorData = (connection, area_id, hive_id) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM sensor_data WHERE area_id = ${area_id} AND hive_id = ${hive_id} ORDER BY time DESC LIMIT 10`;
        connection.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error querying the database:', error);
                return reject(error);
            }

            const time = results.map(row => row.time);
            const tempData = results.map(row => row.temp);
            const humiData = results.map(row => row.humi);
            const co2Data = results.map(row => row.co2);
            const weighData = results.map(row => row.weigh);

            resolve({
                time,
                temp: tempData,
                humi: humiData,
                co2: co2Data,
                weigh: weighData,
            });
        });
    });
};

module.exports = {
    fetchAreasAndHives,
    fetchInOutData,
    fetchSensorData
};
