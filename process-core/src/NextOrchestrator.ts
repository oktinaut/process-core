import { Observable, ReplaySubject } from "rxjs"

type JobType 
    = "user" 
    | "service" 
    | "script"

type Payload = Record<string, any>

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
    error?: Error
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

type Orchestrator = {
    /**
     * Unresolved requested jobs
     */
    activeJobs: Observable<Job[]>
    /**
     * Starts a new process instance.
     * @param options Optional parameters for starting a process instance
     * @returns Unique ID of the created process instance
     */
    startProcess: (options?: StartProcessOptions) => string
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

const createOrchestrator = (): Orchestrator => {

    const activeJobsSubject = new ReplaySubject<Job[]>(1)

    const activeJobs = activeJobsSubject.asObservable()

    const getNextJob = (jobId: string) => {
        
    }

    const startProcess = ({ event = "start", initialPayload = {} } = {}) => {
        throw new Error("Not implemented!")
    }

    const resolveJob = (jobId: string, { payload = {} } = {}) => {
        throw new Error("Not implemented!")
    }

    const rejectJob = (jobId: string, { code = "", message = "" } = {}) => {
        throw new Error("Not implemented!")
    }

    return {
        activeJobs,
        startProcess,
        resolveJob,
        rejectJob,
    }
}

const orchestrator = createOrchestrator()
