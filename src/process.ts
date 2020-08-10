
export type Process = {
    nodes: ProcessNode[]
}

export type ProcessNode
    = StartEvent
    | EndEvent
    | ServiceTask
    | UserTask
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
    parameters?: Record<string, any>
    next: string
}

export type UserTask = CommonNode & {
    type: "user"
    parameters?: Record<string, any>
    next: string
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