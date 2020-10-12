import { start } from "repl"
import { Observable, Subject } from "rxjs"
import { createID } from "./id"
import { Process, StartEvent } from "./process"

type JobType
    = "user"
    | "service"
    | "script"

export type Payload = Record<string, any>

type Job = {
    /** Unique ID of the requested job */
    id: string
    /** Unique ID of the process instance associated with the requested job */
    correlationId: string
    /** Name of the requested job */
    name: string
    /** Type of the requested job */
    type: JobType
    /** Data to be used by the requested job */
    payload: Payload
    /** Optional error that was thrown during the previous job */
    error?: { code: string, message: string }
}

/** Optional parameters for  */
type StartProcessOptions = {
    /**
     * Start event name
     * @default "start"
     */
    event?: string
    /**
     * Initial payload
     * @default {}
     */
    initialPayload?: Payload
}

/** Optional parameters for resolving a completed job */
type ResolveJobOptions = {
    /**
     * Result of the completed job, values are merged with the previous payload
     * @default {}
     */
    payload?: Payload
}

/** Optional parameters for rejecting a failed job */
type RejectJobOptions = {
    /**
     * Code associated with the error of the failed job
     * @default ""
     */
    code?: string
    /**
     * Message associated with the error of the failed job
     * @default ""
     */
    message?: string
}

type ProcessCompletion = {
    resolve: (payload: Payload) => void
    reject: (error: { code: string, message: string }) => void
}

export type Orchestrator = {
    /**
     * Unresolved requested jobs
     */
    jobs: Observable<Job>
    /**
     * Starts a new process instance.
     * @param options Optional parameters for starting a process instance
     * @returns The resulting payload of the finished process.
     */
    startProcess: (options?: StartProcessOptions) => Promise<Payload>
    /**
     * Resolves a requested job that has completed successfully.
     * @param jobId   Unique ID of the resolved job
     * @param options Optional parameters for resolving a job
     */
    resolveJob: (jobId: string, options?: ResolveJobOptions) => void
    /**
     * Rejects a requested job that has failed.
     * @param jobId   Unique ID of the rejected job
     * @param options Optional parameters for rejecting a job
     */
    rejectJob: (jobId: string, options?: RejectJobOptions) => void
}

export const createOrchestrator = (process: Process): Orchestrator => {

    let activeJobs: Job[] = []
    let processCompletions: Record<string, ProcessCompletion> = {}

    const jobsSubject = new Subject<Job>()

    const jobs = jobsSubject.asObservable()

    const startNextJob = (correlationId: string, nodeId: string, payload: Payload, error?: { code: string, message: string }) => {

        const node = getNode(nodeId)

        const jobId = createID()

        if (node.type === "end") {

            const completion = processCompletions[correlationId]

            completion.resolve(payload)

            return
        }

        if (node.type === "service" || node.type === "user" || node.type === "script") {

            const job: Job = {
                id: jobId,
                correlationId,
                name: node.id,
                type: node.type,
                payload,
                error,
            }

            activeJobs = activeJobs.concat([job])

            jobsSubject.next(job)
        }
    }

    const getNode = (nodeId: string) => {

        const nextNode = process.nodes.find(node => node.id === nodeId)

        if (nextNode === undefined) {
            throw Error(`Node '${nodeId}' is not defined.`)
        }

        return nextNode
    }

    const startProcess = ({ event = "start", initialPayload = {} } = {}) => {

        const startEvent = process.nodes.find(
            node => node.type === "start" && node.id === event
        ) as StartEvent | undefined

        if (startEvent === undefined) {
            return Promise.reject(new Error(`Start event '${event}' is not defined.`))
        }

        const correlationId = createID()

        startNextJob(correlationId, startEvent.next, initialPayload)

        return new Promise<Payload>((resolve, reject) => {
            processCompletions[correlationId] = { resolve, reject }
        })
    }

    const resolveJob = (jobId: string, { payload = {} } = {}) => {

        const job = activeJobs.find(job => job.id === jobId)

        if (job === undefined) {
            throw new Error(`Job with ID '${jobId}' does not exist.`)
        }

        const node = getNode(job.name)

        if (node.type !== "service" && node.type !== "user" && node.type !== "script") {
            throw new Error(`Cannot resolve job of type '${job.type}'.`)
        }

        const updatedPayload = Object.assign({}, job.payload, payload)

        startNextJob(job.correlationId, node.next, updatedPayload)
    }

    const rejectJob = (jobId: string, { code = "", message = "" } = {}) => {

        const job = activeJobs.find(job => job.id === jobId)

        if (job === undefined) {
            throw new Error(`Job with ID '${jobId}' does not exist.`)
        }

        const node = getNode(job.name)

        if (node.type !== "service" && node.type !== "user" && node.type !== "script") {
            throw new Error(`Cannot resolve job of type '${job.type}'.`)
        }

        const error = { code, message }

        if (node.errorNext === undefined) {

            const completion = processCompletions[job.correlationId]

            completion.reject(error)

            return
        }

        startNextJob(job.correlationId, node.errorNext, job.payload, error)
    }

    return {
        jobs,
        startProcess,
        resolveJob,
        rejectJob,
    }
}
