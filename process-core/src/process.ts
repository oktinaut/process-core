
export type Process = {
    nodes: ProcessNode[]
}

export type ProcessNode
    = StartEvent
    | EndEvent
    | ServiceTask
    | UserTask
    | ScriptTask
    | SplitGateway
    | JoinGateway

export type CommonNode = {
    id: string
}

export type NodeWithNext = {
    next: string
}

export type StartEvent = CommonNode & {
    type: "start"
    next: string
}

export type ServiceTask = CommonNode & {
    type: "service"
    next: string
    errorNext?: string
    timer?: { next: string, duration: number }
}

export type UserTask = CommonNode & {
    type: "user"
    next: string
    errorNext?: string
    timer?: { next: string, duration: number }
}

export type ScriptTask = CommonNode & {
    type: "script"
    script: string
    next: string
    errorNext?: string
    timer?: { next: string, duration: number }
}

export type EndEvent = CommonNode & {
    type: "end"
}

export type SplitGateway = CommonNode & {
    type: "split"
    next: { id: string, condition: string }[]
}

export type JoinGateway = CommonNode & {
    type: "join"
    next: string
}