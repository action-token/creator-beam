import { Client } from "@upstash/qstash"
import { env } from "~/env"
import { db } from "~/server/db" // your Prisma client

export const qstash = new Client({
    token: env.QSTASH_TOKEN,
})

export type JobStatus = "pending" | "processing" | "completed" | "failed"

export interface JobData {
    jobId: string
    status: JobStatus
    userId: string
    progress?: number
    message?: string
    error?: string
    result?: {
        items: Array<{ type: string; url: string, content?: string }>
    }
    createdAt: number
    updatedAt: number
}

export function generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export async function createJob(jobId: string, initialData?: Partial<JobData>): Promise<JobData> {
    const row = await db.generationJob.create({
        data: {
            id: jobId,
            userId: initialData?.userId ?? "unknown",
            status: initialData?.status ?? "pending",
            message: initialData?.message,
        },
    })
    return dbRowToJobData(row)
}

export async function updateJob(jobId: string, updates: Partial<JobData>): Promise<JobData | null> {
    const row = await db.generationJob.update({
        where: { id: jobId },
        data: {
            status: updates.status,
            progress: updates.progress,
            message: updates.message,
            error: updates.error,
            result: updates.result ? (updates.result as object) : undefined,
        },
    })
    return dbRowToJobData(row)
}

export async function getJob(jobId: string): Promise<JobData | null> {
    const row = await db.generationJob.findUnique({ where: { id: jobId } })
    if (!row) return null
    return dbRowToJobData(row)
}

function dbRowToJobData(row: {
    id: string
    status: string
    progress: number | null
    message: string | null
    error: string | null
    result: unknown
    createdAt: Date
    updatedAt: Date
}): JobData {
    return {
        jobId: row.id,
        status: row.status as JobStatus,
        progress: row.progress ?? undefined,
        message: row.message ?? undefined,
        error: row.error ?? undefined,
        result: row.result as JobData["result"] ?? undefined,
        createdAt: row.createdAt.getTime(),
        updatedAt: row.updatedAt.getTime(),
    }
}