import { promises as fs } from "fs"
import * as path from "path"
import { Subscription } from "rxjs";

import { parseProcess, createOrchestrator, Orchestrator, ServiceTasks, createServiceTaskRunner } from "../src";

let orchestrator: Orchestrator
let serviceTasksSubscription: Subscription

beforeEach(async () => {

    const processPath = path.join(process.cwd(), "examples/testing_examples.bpmn")

    const processData = await fs.readFile(processPath, { encoding: "utf-8" })

    const processDefinition = parseProcess(processData)

    orchestrator = createOrchestrator(processDefinition, { serviceTaskTimeout: 2000 });

    const serviceTasks: ServiceTasks = {

        printMessage: async payload => {

            console.log(`Message: ${payload.message ?? "No message"}`)

            return { serviceTaskExecuted: true }
        },

        multiply: async payload => {
            return { output: payload.input * 2, operation: "multiply" }
        },

        add: async payload => {
            return { output: payload.input + 2, operation: "add" }
        },

        runLongRunningTask: payload => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(payload)
                }, 1500)
            })
        },

        runUnresponsiveTask: payload => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(payload)
                }, 3000)
            })
        },
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
    expect(result.serviceTaskExecuted).toBe(true)
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
    expect(firstResult.serviceTaskExecuted).toBe(true)

    expect(secondResult.message).toEqual(secondInitialPayload.message)
    expect(secondResult.serviceTaskExecuted).toBe(true)
})

test("Runs async script task successfully", async () => {

    const initialPayload = { input: 42 }

    const result = await orchestrator.startProcess({ 
        event: "startScript", 
        initialPayload, 
    })

    expect(result.output).toEqual(initialPayload.input * 2)
})

test("Splits correctly at exclusive gateway", async () => {

    const firstInitialPayload = { input: 5 }
    const secondInitialPayload = { input: 2 }

    const firstResult = await orchestrator.startProcess({
        event: "startGateway",
        initialPayload: firstInitialPayload,
    })
    const secondResult = await orchestrator.startProcess({
        event: "startGateway",
        initialPayload: secondInitialPayload,
    })

    expect(firstResult.output).toEqual(firstInitialPayload.input  * 2)
    expect(firstResult.operation).toEqual("multiply")

    expect(secondResult.output).toEqual(secondInitialPayload.input + 2)
    expect(secondResult.operation).toEqual("add")
})

test("Error boundary handles error correctly", async () => {

    const result = await orchestrator.startProcess({ 
        event: "startError", 
    })

    expect(result.errorMessage).toEqual("fatal error")
})

test("Unhandled error results in failed process", async () => {

    try {
        
        await orchestrator.startProcess({ 
            event: "startUnhandledError", 
        })

        fail()

    } catch (error) {
        expect(error.message).toEqual("fatal error")
    }
})

test("Timer boundary handles timeout correctly", async () => {

    const result = await orchestrator.startProcess({ 
        event: "startTimer", 
    })

    expect(result.errorMessage).toEqual("timed out")
}, 5000)



test("Global timeout results in failed process", async () => {

    try {
        
        await orchestrator.startProcess({ 
            event: "startUnhandledTimer", 
        })

        fail()

    } catch (error) {
        expect(error.message).toEqual("timed out")
    }
}, 5000)
