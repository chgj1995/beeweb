import { pool } from './index';
import { SensorData2Insert, SensorData2Row } from '../types';

const processBatch = async (
    queryTemplate: string,
    data: SensorData2Insert[],
    batchSize: number
): Promise<number> => {
    let totalProcessed = 0;
    let batch: SensorData2Insert[] = [];

    const insertBatch = async () => {
        if (batch.length === 0) return;

        const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const fullQuery = queryTemplate.replace('VALUES (?, ?, ?, ?, ?)', `VALUES ${placeholders}`);

        const flatParams = batch.flatMap(row => [
            row.device_id,
            row.data_int,
            row.data_float,
            row.data_type,
            row.time
        ]);

        await pool.query(fullQuery, flatParams);
        totalProcessed += batch.length;
        batch = [];
    };

    for (const row of data) {
        batch.push(row);
        if (batch.length >= batchSize) {
            await insertBatch();
        }
    }

    if (batch.length > 0) {
        await insertBatch();
    }

    console.log(`Processed ${totalProcessed} records`);
    return totalProcessed;
};

// ✅ insert 함수는 순수 DB 포맷만 처리
export const insertSensorData2 = async (
    datas: SensorData2Insert[]
): Promise<void> => {
    const batchSize = 1000;
    const query = `
        INSERT INTO sensor_data2 (device_id, data_int, data_float, data_type, time)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            data_int = VALUES(data_int),
            data_float = VALUES(data_float),
            data_type = VALUES(data_type),
            time = VALUES(time)
    `;

    await processBatch(query, datas, batchSize);
};


export const getSensorData2 = async (
    deviceId: number,
    sTime: string,
    eTime: string,
    dataTypes: number[]
): Promise<SensorData2Row[]> => {
    if (dataTypes.length === 0) return [];

    const placeholders = dataTypes.map(() => '?').join(', ');
    const query = `
        SELECT id, device_id, data_type, data_int, data_float, time
        FROM sensor_data2
        WHERE device_id = ?
          AND data_type IN (${placeholders})
          AND time BETWEEN ? AND ?
        ORDER BY time DESC
    `;
    console.log(`Executing query: ${query} with params: [${deviceId}, ${dataTypes}, ${sTime}, ${eTime}]`);
    const params = [deviceId, ...dataTypes, sTime, eTime];
    const [rows] = await pool.execute(query, params);

    return rows as SensorData2Row[];
};

export const streamSensorDataForExport = async (
    deviceIds: number[],
    sTime: string,
    eTime: string,
    dataTypes: number[]
): Promise<any> => {
    if (deviceIds.length === 0 || dataTypes.length === 0) {
        throw new Error("Device IDs and data types must be provided.");
    }

    const deviceIdPlaceholders = deviceIds.map(() => '?').join(', ');
    const dataTypePlaceholders = dataTypes.map(() => '?').join(', ');

    const query = `
        SELECT
            DATE_FORMAT(s.time, '%Y-%m-%d %H:%i:%s') as Time,
            h.name AS 'Hive Name',
            d.name AS 'Device Name',
            dt.name AS 'Data Type',
            COALESCE(s.data_float, s.data_int) AS Value
        FROM sensor_data2 s
        JOIN devices d ON s.device_id = d.id
        JOIN hives h ON d.hive_id = h.id
        JOIN data_types dt ON s.data_type = dt.id
        WHERE s.device_id IN (${deviceIdPlaceholders})
          AND s.data_type IN (${dataTypePlaceholders})
          AND s.time BETWEEN ? AND ?
        ORDER BY s.time ASC
    `;

    const params = [...deviceIds, ...dataTypes, sTime, eTime];
    const [rows] = await pool.query(query, params);
    return rows;
};

export const getDataTypesByNames = async (names: string[]): Promise<{ [name: string]: number }> => {
    if (names.length === 0) return {};

    const placeholders = names.map(() => '?').join(', ');
    const query = `
        SELECT id, name
        FROM data_types
        WHERE name IN (${placeholders})
    `;
    const [rows] = await pool.execute(query, names);

    const mapping: { [name: string]: number } = {};
    for (const row of rows as { id: number, name: string }[]) {
        mapping[row.name] = row.id;
    }
    return mapping;
};