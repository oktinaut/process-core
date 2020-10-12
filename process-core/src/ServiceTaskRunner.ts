import { filter } from "rxjs/operators"
import { Orchestrator, Payload } from "./NextOrchestrator"

type ServiceTask = (payload: Payload) => Promise<Payload>

export type ServiceTasks = Record<string, ServiceTask>

export const createServiceTaskRunner = (orchestrator: Orchestrator, serviceTasks: ServiceTasks) => {

    const subscription = orchestrator.jobs.pipe(
        filter(job => job.type === "service")
    ).subscribe(async job => {

        const serviceTask = serviceTasks[job.name]

        if (serviceTask === undefined) {
            throw new Error(`Service task '${job.name}' not registered`)
        }

        try {

            const result = await serviceTask(job.payload)

            orchestrator.resolveJob(job.id, { payload: result })

        } catch (error) {

            const code = error?.code
            const message = error?.message

            orchestrator.rejectJob(job.id, { code, message })
        }
    })

    return subscription
}