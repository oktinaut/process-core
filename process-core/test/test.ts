import { promises as fs } from "fs"
import * as path from "path"
import { Subscription } from "rxjs";

import { parseProcess } from "../src";
import { createOrchestrator, Orchestrator } from "../src/NextOrchestrator"
import { ServiceTasks, createServiceTaskRunner } from "../src/ServiceTaskRunner";

let orchestrator: Orchestrator
let serviceTasksSubscription: Subscription

beforeEach(async () => {

    const processPath = path.join(process.cwd(), "examples/minimal_example.bpmn")

    const processData = await fs.readFile(processPath, { encoding: "utf-8" })

    const processDefinition = parseProcess(processData)

    orchestrator = createOrchestrator(processDefinition);

    const serviceTasks: ServiceTasks = {

        printMessage: async payload => {

            console.log(`Message: ${payload.message ?? "No message"}`)

            return payload
        }
    }

    serviceTasksSubscription = createServiceTaskRunner(orchestrator, serviceTasks)
})

afterEach(() => {
    serviceTasksSubscription.unsubscribe()
})

test("Returns initial payload", async () => {

    const initialPayload = { message: "Hello World" }

    const result = await orchestrator.startProcess({ initialPayload })

    expect(result.message).toEqual(initialPayload.message)
})

test("Returns correct payload", async () => {

    const firstInitialPayload = { message: "Hello World First" }
    const secondInitialPayload = { message: "Hello World Second" }

    const firstResult = await orchestrator.startProcess({
        initialPayload: firstInitialPayload,
    })
    const secondResult = await orchestrator.startProcess({
        initialPayload: secondInitialPayload,
    })

    expect(firstResult.message).toEqual(firstInitialPayload.message)
    expect(secondResult.message).toEqual(secondInitialPayload.message)
})
