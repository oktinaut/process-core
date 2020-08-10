import { EventEmitter } from "eventemitter3"

import { compileCode } from "./compiler"
import { createID } from "./id"
import { Process, ProcessNode, NodeWithNext, StartEvent } from "./process"

export type Token = {
    payload: Record<string, any>
    key: string
}

export type TaskRequest = {
    type: "service" | "user"
    id: string
    parameters: Record<string, any>
    token: Token
}

export type Orchestrator = {

    start: (event?: string) => void

    advance: (token: Token) => void

    addEventListener: (event: "task", listener: (task: TaskRequest | undefined) => void) => void

    removeEventListener: (event: "task", listener: (task: TaskRequest | undefined) => void) => void
}

export const createOrchestrator = (process: Process) => {

    const events = new EventEmitter()

    let validTokenKey: string | undefined

    let currentNode: ProcessNode | undefined

    const evaluateNextNode = (fromNode: ProcessNode, token: Token) => {

        if (!fromNode.hasOwnProperty("next")) {
            return
        }


        let nextNodeId: string | undefined

        if (fromNode.type === "split") {

            nextNodeId = fromNode.next
                .filter(next => next.condition.length > 0)
                .find(next => {

                    const code = compileCode(next.condition)

                    return code({ payload: token.payload })

                })
                ?.id

            if (!nextNodeId) {

                nextNodeId = fromNode.next
                    .find(next => next.condition.length === 0)
                    ?.id
            }

        } else {

            const nodeWithNext = fromNode as NodeWithNext

            nextNodeId = nodeWithNext.next
        }

        const nextNode = process.nodes.find(
            node => node.id == nextNodeId
        )

        if (nextNode === undefined) {
            return
        }

        currentNode = nextNode

        if (nextNode.type === "service" || nextNode.type === "user") {

            validTokenKey = createID()

            const { type, id, parameters } = nextNode

            const nextToken = Object.assign({}, token, { key: validTokenKey })

            const taskRequest: TaskRequest = {
                type,
                id,
                parameters: parameters ?? {},
                token: nextToken,
            }

            events.emit("task", taskRequest)

        } else {

            events.emit("task")

            evaluateNextNode(nextNode, token)
        }
    }

    const orchestrator: Orchestrator = {

        start: (event) => {

            const startEvent = process.nodes.find(
                node => node.type === "start" && node.id === (event ?? "default")
            ) as StartEvent | undefined

            if (!startEvent) {
                throw Error(`Start event '${event ?? "default"}' not found`)
            }

            const initialToken: Token = {
                key: createID(),
                payload: {},
            }

            evaluateNextNode(startEvent, initialToken)
        },

        advance: (token) => {

            if (token.key !== validTokenKey) {
                throw Error("Token key is invalid")
            }

            if (!currentNode) {
                throw Error("Current node is undefined")
            }

            evaluateNextNode(currentNode, token)
        },

        addEventListener: (event, listener) => {
            events.addListener(event, listener)
        },

        removeEventListener: (event, listener) => {
            events.removeListener(event, listener)
        },
    }

    return orchestrator
}
