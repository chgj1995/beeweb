const fetchAreasAndHives = (connection) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT area_id, hive_id FROM sensor_data GROUP BY area_id, hive_id ORDER BY area_id, hive_id';
      connection.query(query, (error, results) => {
        if (error) {
          console.error('Error querying the database:', error);
          return reject(error);
        }
  
        const areas = {};
        results.forEach(row => {
          if (!areas[row.area_id]) {
            areas[row.area_id] = [];
          }
          areas[row.area_id].push(row.hive_id);
        });
  
        resolve(areas);
      });
    });
  };
  
  const fetchInOutData = (connection, area_id, hive_id) => {
    return new Promise((resolve, reject) => {
      hive_id = parseInt(hive_id, 10);  // hive_id를 정수로 변환
  
      if (area_id !== '1' || ![1, 2, 3].includes(hive_id)) {
        console.warn(`InOut data is not available for area_id ${area_id}, hive 1~3`);
        return resolve({
          created_at: [],
          in: [],
          out: []
        });
      }
  
      let query = '';
      if (hive_id === 1) {
        query = `SELECT created_at, field1 AS in_field, field2 AS out_field FROM inout_data WHERE group_id = 1 AND field1 IS NOT NULL AND field2 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
      } else if (hive_id === 2) {
        query = `SELECT created_at, field3 AS in_field, field4 AS out_field FROM inout_data WHERE group_id = 1 AND field3 IS NOT NULL AND field4 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
      } else if (hive_id === 3) {
        query = `SELECT created_at, field5 AS in_field, field6 AS out_field FROM inout_data WHERE group_id = 1 AND field5 IS NOT NULL AND field6 IS NOT NULL ORDER BY created_at DESC LIMIT 10`;
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
  