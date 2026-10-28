import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import { conn } from "../config/dbconnect";

// ใบงานไรเดอร์ (job_sheets): เจ้าของร้านคำนวณเส้นทางแล้วส่งขึ้นมาเก็บ
// ไรเดอร์เปิดหน้าเว็บจากมือถือของตัวเอง แล้วดึงใบงานจากตารางนี้
// เก็บรายละเอียดใบงาน (จุดส่ง, เวลา, พิกัด) เป็น JSON ในคอลัมน์ data

const JOB_CODE_PATTERN = /^JOB-\d{2,3}$/;
const MAX_JOBS = 100;

interface JobRow {
    job_code: string;
    data: string | object;
    created_at: string;
}

// แปลงแถวในฐานข้อมูลกลับเป็นใบงาน (+ เวลาที่ส่งใบงานขึ้นมา)
function toJob(row: JobRow) {
    const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    return { ...data, jobCode: row.job_code, publishedAt: row.created_at };
}

// ตรวจใบงาน 1 ใบแบบพอประมาณ (ต้องมีรหัสใบงาน และจุดส่งเป็น array)
function isValidJob(job: any): boolean {
    return (
        job !== null &&
        typeof job === "object" &&
        typeof job.jobCode === "string" &&
        JOB_CODE_PATTERN.test(job.jobCode) &&
        Array.isArray(job.stops)
    );
}

// GET /api/jobs  ใบงานทั้งหมดของรอบล่าสุด
export const getJobs = async (_req: Request, res: Response) => {
    try {
        const [rows] = await conn.query("SELECT * FROM `job_sheets` ORDER BY `job_code`");
        res.status(200).json((rows as JobRow[]).map(toJob));
    } catch (error) {
        console.error("[GET /api/jobs]", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/jobs/:code  ใบงานใบเดียว (เช่น JOB-01)
export const getJobByCode = async (req: Request, res: Response) => {
    try {
        const code = String(req.params.code ?? "").toUpperCase();
        const [rows] = await conn.query("SELECT * FROM `job_sheets` WHERE `job_code`=?", [code]);
        const list = rows as JobRow[];
        if (list.length === 0) {
            return res.status(404).json({ error: "Job not found" });
        }
        res.status(200).json(toJob(list[0]!));
    } catch (error) {
        console.error("[GET /api/jobs/:code]", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PUT /api/jobs  body: { jobs: [...] }
// แทนที่ใบงานชุดเดิมทั้งหมดด้วยชุดใหม่ (ลบ + เพิ่มใน transaction เดียว ไรเดอร์จะไม่เห็นข้อมูลครึ่ง ๆ กลาง ๆ)
export const replaceJobs = async (req: Request, res: Response) => {
    const jobs = req.body?.jobs;
    if (!Array.isArray(jobs) || jobs.length > MAX_JOBS || !jobs.every(isValidJob)) {
        return res.status(400).json({ error: "Body must be { jobs: [...] } with valid jobCode (JOB-01) and stops" });
    }
    const codes = jobs.map((job: any) => job.jobCode as string);
    if (new Set(codes).size !== codes.length) {
        return res.status(400).json({ error: "Duplicate jobCode" });
    }

    let connection: PoolConnection | undefined;
    try {
        connection = await conn.getConnection();
        await connection.beginTransaction();
        await connection.query("DELETE FROM `job_sheets`");
        if (jobs.length > 0) {
            const values = jobs.map((job: any) => [job.jobCode, JSON.stringify(job)]);
            await connection.query("INSERT INTO `job_sheets`(`job_code`, `data`) VALUES ?", [values]);
        }
        await connection.commit();
        res.status(200).json({ affected_row: jobs.length });
    } catch (error) {
        await connection?.rollback().catch(() => undefined);
        console.error("[PUT /api/jobs]", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection?.release();
    }
};

// DELETE /api/jobs  ล้างใบงานทั้งหมด (เช่น ตอนล้าง/สุ่มออเดอร์ใหม่)
export const clearJobs = async (_req: Request, res: Response) => {
    try {
        const [result] = await conn.query("DELETE FROM `job_sheets`");
        res.status(200).json({ affected_row: (result as any).affectedRows });
    } catch (error) {
        console.error("[DELETE /api/jobs]", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
