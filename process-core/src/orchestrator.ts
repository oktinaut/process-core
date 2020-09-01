import { EventEmitter } from "eventemitter3"

import { compileCode } from "./compiler"
import { createID } from "./id"
import { Process, ProcessNode, NodeWithNext, StartEvent, ScriptTask } from "./process"

export type Token = {
    payload: Record<string, any>
    instanceId: string
    id: string
    error?: Error
}

export const updatePayload = (token: Token, payload: Record<string, any>): Token => {

    const nextToken = Object.assign({}, token, { payload })

    console.log("[Orchestrator] Update token", nextToken)

    return nextToken
}

export type TaskRequest = {
    type: string
    id: string
    token?: Token
}

export type Orchestrator = {

    start: (event?: string) => void

    advance: (token: Token, error?: Error) => void

    addEventListener: <T>(event: string, listener: (detail: T) => void) => void

    removeEventListener: <T>(event: string, listener: (detail: T) => void) => void
}

export const createOrchestrator = (process: Process) => {

    const events = new EventEmitter()

    let tokenState: Record<string, ProcessNode> = {}

    const evaluateNode = (node: ProcessNode, token: Token) => {

        tokenState[token.id] = node

        const { type, id } = node

        let taskRequest: TaskRequest = {
            type,
            id,
        }

        switch (type) {
            case "service": 
            case "user": {

                taskRequest.token = token
    
                events.emit("task", taskRequest)

                break
            }
            case "script": {

                events.emit("task", taskRequest)

                const code = compileCode((node as ScriptTask).script)

                try {

                    const updatedPayload = code({ payload: token.payload })
                
                    const updatedToken = updatePayload(token, updatedPayload)

                    evaluateNextNode(node, updatedToken)

                } catch (error) {
                    evaluateNextNode(node, token, error)
                }

                break
            }
            case "end": {

                events.emit("end", id)

                break
            }
            default: {

                events.emit("task", taskRequest)

                evaluateNextNode(node, token)

                break
            }
        }
    }

    const findNextNode = (nextNodeId: string) => {

        const nextNode = process.nodes.find(
            node => node.id == nextNodeId
        )

        return nextNode
    }

    const evaluateNextNode = (node: ProcessNode, token: Token, error?: Error) => {

        delete tokenState[token.id]

        if (error) {

            if (!node.hasOwnProperty("errorNext")) {
                return
            }

            const nextNode = findNextNode((node as any).errorNext as string)

            if (nextNode === undefined) {
                return
            }

            const id = createID()

            const tokenWithError = Object.assign({}, token, { id, error })

            evaluateNode(nextNode, tokenWithError)

            return
        }

        if (!node.hasOwnProperty("next")) {
            return
        }

        let nextNodeId: string | undefined

        if (node.type === "split") {

            nextNodeId = node.next
                .filter(next => next.condition.length > 0)
                .find(next => {

                    const code = compileCode(next.condition)

                    return code({ payload: token.payload })

                })
                ?.id

            if (!nextNodeId) {

                nextNodeId = node.next
                    .find(next => next.condition.length === 0)
                    ?.id
            }

        } else {

            const nodeWithNext = node as NodeWithNext

            nextNodeId = nodeWithNext.next
        }

        const nextNode = process.nodes.find(
            node => node.id == nextNodeId
        )

        if (nextNode === undefined) {
            return
        }

        const id = createID()

        const nextToken = Object.assign({}, token, { id })

        evaluateNode(nextNode, nextToken)
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
                instanceId: createID(),
                id: createID(),
                payload: {},
            }

            evaluateNextNode(startEvent, initialToken)
        },

        advance: (token, error) => {

            const currentNode = tokenState[token.id]

            if (!currentNode) {
                throw Error("Current node is undefined")
            }

            evaluateNextNode(currentNode, token, error)
        },

        addEventListener: <T>(event: string, listener: (detail: T) => void) => {
            events.addListener(event, listener)
        },

        removeEventListener: <T>(event: string, listener: (detail: T) => void) => {
            events.removeListener(event, listener)
        },
    }

    return orchestrator
}
