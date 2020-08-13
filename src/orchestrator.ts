import { EventEmitter } from "eventemitter3"

import { compileCode } from "./compiler"
import { createID } from "./id"
import { Process, ProcessNode, NodeWithNext, StartEvent, ScriptTask } from "./process"

export type Token = {
    payload: Record<string, any>
    key: string
    error?: Error
}

export const updatePayload = (token: Token, payload: Record<string, any>): Token => {

    const nextToken = Object.assign({}, token, { payload })

    return nextToken
}

export type TaskRequest = {
    type: "service" | "user"
    id: string
    token: Token
}

export type Orchestrator = {

    start: (event?: string) => void

    advance: (token: Token, error?: Error) => void

    addEventListener: (event: "task", listener: (task: TaskRequest | undefined) => void) => void

    removeEventListener: (event: "task", listener: (task: TaskRequest | undefined) => void) => void
}

export const createOrchestrator = (process: Process) => {

    const events = new EventEmitter()

    let validTokenKey: string | undefined

    let currentNode: ProcessNode | undefined

    let tokenState: Record<string, ProcessNode> = {}

    const evaluateNode = (node: ProcessNode, token: Token) => {

        tokenState[token.key] = node
    
        switch (node.type) {
            case "service": 
            case "user": {

                const { type, id } = node

                const taskRequest: TaskRequest = {
                    type,
                    id,
                    token: token,
                }
    
                events.emit("task", taskRequest)
            }
            case "script": {

                const code = compileCode((node as ScriptTask).script)

                try {

                    const updatedPayload = code({ payload: token.payload })
                
                    const updatedToken = updatePayload(token, updatedPayload)

                    evaluateNextNode(node, updatedToken)

                } catch (error) {
                    evaluateNextNode(node, token, error)
                }
            }
            default: {
                evaluateNextNode(node, token)
            }
        }
    }

    const findNextNode = (nextNodeId: string) => {

        const nextNode = process.nodes.find(
            node => node.id == nextNodeId
        )

        return nextNode
    }

    const evaluateNextNodeBetter = (node: ProcessNode, token: Token, error?: Error) => {

        if (error) {

            if (!node.hasOwnProperty("errorNext")) {
                return
            }

            const nextNode = findNextNode((node as any).errorNext as string)

            if (nextNode === undefined) {
                return
            }

            token.error = error

            evaluateNextNode(nextNode, token)

            return
        }

    }

    const evaluateNextNode = (fromNode: ProcessNode, token: Token, error?: Error) => {

        if (error) {

            if (!fromNode.hasOwnProperty("errorNext")) {
                return
            }

            const nextNodeId = (fromNode as any).errorNext as string

            const nextNode = process.nodes.find(
                node => node.id == nextNodeId
            )

            if (nextNode === undefined) {
                return
            }

            token.error = error

            evaluateNextNode(nextNode, token)

            return
        }

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

            const { type, id } = nextNode

            const nextToken = Object.assign({}, token, { key: validTokenKey })

            const taskRequest: TaskRequest = {
                type,
                id,
                token: nextToken,
            }

            events.emit("task", taskRequest)

        } else {

            events.emit("task")

            if (nextNode.type === "script") {

                const code = compileCode(nextNode.script)

                const updatedPayload = code({ payload: token.payload })
                
                const updatedToken = updatePayload(token, updatedPayload)

                evaluateNextNode(nextNode, updatedToken)

            } else {
                evaluateNextNode(nextNode, token)
            }
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

        advance: (token, error) => {

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
