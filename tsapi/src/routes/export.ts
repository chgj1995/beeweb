import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { startExport } from '../worker';
import { getDeviceByName } from '../db/device';
import { getDataTypesByNames } from '../db/data';

const router = express.Router();
router.use(express.json());

const EXPORT_DIR = process.env.EXPORT_DIR || '/tmp/export_jobs';

// POST /api/export - 새로운 내보내기 작업 생성
router.post('/', async (req: Request, res: Response) => {
    try {
        const { deviceId, startDate, endDate, dataTypes } = req.body;

        // --- 강화된 유효성 검사 ---
        if (!deviceId || !startDate || !endDate || !dataTypes) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (typeof deviceId !== 'string' ||
            typeof startDate !== 'string' || !Date.parse(startDate) ||
            typeof endDate !== 'string' || !Date.parse(endDate) ||
            !Array.isArray(dataTypes) || dataTypes.length === 0) {
            return res.status(400).json({ error: 'Invalid input data format' });
        }
        // --- 강화된 유효성 검사 끝 ---

        const device = await getDeviceByName(deviceId);
        if (!device) {
            return res.status(404).json({ error: `Device with name '${deviceId}' not found` });
        }

        const dataTypeMap = await getDataTypesByNames(dataTypes);
        const dataTypeIds = dataTypes.map((name: string) => dataTypeMap[name]).filter((id: number) => id);

        if (dataTypeIds.length !== dataTypes.length) {
            return res.status(400).json({ error: 'One or more data types are invalid' });
        }

        const jobId = crypto.randomUUID();
        const jobFilePath = path.join(EXPORT_DIR, `${jobId}.json`);

        const job = {
            jobId,
            status: 'pending',
            progress: 0,
            requestParameters: {
                deviceId: device.id, // ID로 변환
                startDate,
                endDate,
                dataTypes: dataTypeIds, // ID로 변환
            },
            createdAt: new Date().toISOString(),
        };

        await fs.mkdir(EXPORT_DIR, { recursive: true });
        await fs.writeFile(jobFilePath, JSON.stringify(job, null, 2));

        startExport(job);

        res.status(202).json(job);
    } catch (error) {
        console.error('Error creating export job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/export/jobs - 모든 내보내기 작업 목록 조회
router.get('/jobs', async (req: Request, res: Response) => {
    try {
        await fs.mkdir(EXPORT_DIR, { recursive: true });
        const files = await fs.readdir(EXPORT_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        const jobs = await Promise.all(jsonFiles.map(async file => {
            const filePath = path.join(EXPORT_DIR, file);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }));

        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error getting export jobs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/export/status?jobId={jobId} - 특정 작업 상태 조회
router.get('/status', async (req: Request, res: Response) => {
    try {
        const { jobId } = req.query;

        if (!jobId || typeof jobId !== 'string' || !/^[a-zA-Z0-9-]+$/.test(jobId)) {
            return res.status(400).json({ error: 'Invalid jobId' });
        }

        const jobFilePath = path.join(EXPORT_DIR, `${jobId}.json`);

        try {
            const data = await fs.readFile(jobFilePath, 'utf-8');
            const job = JSON.parse(data);
            res.status(200).json(job);
        } catch (error) {
            res.status(404).json({ error: 'Job not found' });
        }
    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/export/download?jobId={jobId} - 결과 파일 다운로드
router.get('/download', (req: Request, res: Response) => {
    try {
        const { jobId } = req.query;

        if (!jobId || typeof jobId !== 'string' || !/^[a-zA-Z0-9-]+$/.test(jobId)) {
            return res.status(400).json({ error: 'Invalid jobId' });
        }

        const zipFilePath = path.join(EXPORT_DIR, `${jobId}.zip`);

        res.download(zipFilePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(404).json({ error: 'File not found' });
                }
            }
        });
    } catch (error) {
        console.error('Error preparing file for download:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// DELETE /api/export?jobId={jobId} - 특정 작업 삭제
router.delete('/', async (req: Request, res: Response) => {
    try {
        const { jobId } = req.query;

        if (!jobId || typeof jobId !== 'string' || !/^[a-zA-Z0-9-]+$/.test(jobId)) {
            return res.status(400).json({ error: 'Invalid jobId' });
        }

        const jsonFilePath = path.join(EXPORT_DIR, `${jobId}.json`);
        const zipFilePath = path.join(EXPORT_DIR, `${jobId}.zip`);

        let fileFound = false;
        try {
            await fs.unlink(jsonFilePath);
            fileFound = true;
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        try {
            await fs.unlink(zipFilePath);
            fileFound = true;
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        if (fileFound) {
            res.status(200).json({ message: `Job ${jobId} deleted successfully` });
        } else {
            res.status(404).json({ error: 'Job not found' });
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
