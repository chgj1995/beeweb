import fs from 'fs/promises';
import path from 'path';
import { stringify } from 'csv-stringify';
import archiver from 'archiver';
import { streamSensorDataForExport, getDataTypesByNames } from './db/data';
import { getPictureDataForExport } from './db/picture';

const EXPORT_DIR = process.env.EXPORT_DIR || '/tmp/export_jobs';
const PICTURES_DIR = process.env.PICTURES_DIR || '/data/pictures';

const updateJobStatus = async (jobId: string, status: string, progress?: number) => {
    const jobFilePath = path.join(EXPORT_DIR, `${jobId}.json`);
    try {
        const data = await fs.readFile(jobFilePath, 'utf-8');
        const job = JSON.parse(data);
        job.status = status;
        if (progress !== undefined) {
            job.progress = progress;
        }
        await fs.writeFile(jobFilePath, JSON.stringify(job, null, 2));
    } catch (error) {
        console.error(`Failed to update job status for ${jobId}:`, error);
    }
};

export const startExport = async (job: any) => {
    const { jobId, requestParameters } = job;
    const { deviceId, startDate, endDate, dataTypes: dataTypeIds } = requestParameters;
    const csvFilePath = path.join(EXPORT_DIR, `${jobId}.csv`);
    const zipFilePath = path.join(EXPORT_DIR, `${jobId}.zip`);

    let tempFiles: string[] = [];

    try {
        await updateJobStatus(jobId, 'processing', 0);

        const dataTypeMap = await getDataTypesByNames(['picture']);
        const pictureDataTypeId = dataTypeMap['picture'];

        const hasSensorData = dataTypeIds.some((id: number) => id !== pictureDataTypeId);
        const hasPictureData = dataTypeIds.includes(pictureDataTypeId);

        let currentProgress = 0;
        const progressStep = 100 / (Number(hasSensorData) + Number(hasPictureData));

        const output = require('fs').createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);

        if (hasSensorData) {
            const sensorDataTypeIds = dataTypeIds.filter((id: number) => id !== pictureDataTypeId);
            const sensorData = await streamSensorDataForExport([deviceId], startDate, endDate, sensorDataTypeIds);

            const csvString = await new Promise<string>((resolve, reject) => {
                stringify(sensorData, { header: true }, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
            archive.append(csvString, { name: 'data.csv' });

            currentProgress += progressStep;
            await updateJobStatus(jobId, 'processing', Math.round(currentProgress));
        }

        if (hasPictureData) {
            const picturePaths = await getPictureDataForExport(deviceId, startDate, endDate);
            for (const picturePath of picturePaths) {
                const fullPath = path.join(PICTURES_DIR, picturePath);
                try {
                    await fs.access(fullPath);
                    archive.file(fullPath, { name: `pictures/${path.basename(picturePath)}` });
                } catch (error) {
                    console.warn(`Picture not found and skipped: ${fullPath}`);
                }
            }
            currentProgress += progressStep;
            await updateJobStatus(jobId, 'processing', Math.round(currentProgress));
        }

        await archive.finalize();

        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
        });

        await updateJobStatus(jobId, 'completed', 100);

    } catch (error) {
        console.error(`Export failed for job ${jobId}:`, error);
        await updateJobStatus(jobId, 'failed');
    } finally {
        for (const file of tempFiles) {
            try {
                await fs.unlink(file);
            } catch (error: any) {
                if (error.code !== 'ENOENT') {
                    console.error(`Failed to delete temporary file ${file}:`, error);
                }
            }
        }
    }
};
