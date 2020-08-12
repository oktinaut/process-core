import { xml2json, Element } from "xml-js"

import { StartEvent, EndEvent, Process, ServiceTask, UserTask, SplitGateway, JoinGateway } from "./process"

type SequenceFlow = {
    attributes: { sourceRef: string, targetRef: string }
}

export const loadProcess = async (path: string) => {

    const response = await fetch(path)

    const xmlData = await response.text()

    const jsonData = xml2json(xmlData)

    const processData = JSON.parse(jsonData)

    const rootElement: Element = processData.elements[0]

    const nodeDefs = rootElement.elements
        ?.find((elem: Element) => elem.name === "bpmn:process")
        ?.elements

    if (nodeDefs === undefined) {
        throw new Error("Malformed BPMN")
    }

    const findNext = (source: Element) => {

        const outgoing = source.elements?.find(elem => elem.name === "bpmn:outgoing")

        const flowId = outgoing?.elements?.[0].text

        const sequenceFlow = nodeDefs.find(
            elem => elem.name === "bpmn:sequenceFlow" && elem.attributes?.id === flowId
        ) as SequenceFlow

        return sequenceFlow.attributes.targetRef
    } 

    const findMultipleNext = (source: Element) => {

        const outgoing = source.elements?.filter(elem => elem.name === "bpmn:outgoing") ?? []

        const nextNodes = outgoing.map(edge => {

            const flowId = edge.elements?.[0].text
            
            const sequenceFlow = nodeDefs.find(
                elem => elem.name === "bpmn:sequenceFlow" && elem.attributes?.id === flowId
            ) as Element & SequenceFlow

            const id = sequenceFlow.attributes.targetRef
            const condition = sequenceFlow.elements
                ?.find(elem => elem.name === "bpmn:conditionExpression")
                ?.elements?.[0]
                ?.text as string
                ?? ""

            return {
                id,
                condition,
            }
        })

        return nextNodes
    }

    const startEvents = nodeDefs
        .filter((elem: Element) => elem.name === "bpmn:startEvent")
        .map((elem: Element) => {

            const id = elem.attributes?.id as string
            
            const startEvent: StartEvent = {
                type: "start",
                id: id,
                next: findNext(elem),
            }

            return startEvent
        })

    const endEvents = nodeDefs
        .filter((elem: Element) => elem.name === "bpmn:endEvent")
        .map((elem: Element) => {

            const id = elem.attributes?.id as string
            
            const endEvent: EndEvent = {
                type: "end",
                id: id,
            }

            return endEvent
        })

    const serviceTasks = nodeDefs
        .filter((elem: Element) => elem.name === "bpmn:serviceTask")
        .map((elem: Element) => {

            const id = elem.attributes?.id as string
            
            const serviceTask: ServiceTask = {
                type: "service",
                id: id,
                next: findNext(elem),
                parameters: {}, // TODO
            }

            return serviceTask
        })

    const userTasks = nodeDefs
        .filter((elem: Element) => elem.name === "bpmn:userTask")
        .map((elem: Element) => {

            const id = elem.attributes?.id as string
            
            const userTask: UserTask = {
                type: "user",
                id: id,
                next: findNext(elem),
                parameters: {}, // TODO
            }

            return userTask
        })

    const splitGateways = nodeDefs
        .filter((elem: Element) => 
            elem.name === "bpmn:exclusiveGateway" && 
            (elem.elements?.filter(edge => edge.name === "bpmn:outgoing")?.length ?? 0) > 1
        )
        .map((elem: Element) => {

            const id = elem.attributes?.id as string
            
            const splitGateway: SplitGateway = {
                type: "split",
                id: id,
                next: findMultipleNext(elem),
            }

            return splitGateway
        })

    const joinGateways = nodeDefs
        .filter((elem: Element) => 
            elem.name === "bpmn:exclusiveGateway" && 
            (elem.elements?.filter(edge => edge.name === "bpmn:outgoing")?.length ?? 0) == 1
        )
        .map((elem: Element) => {

            const id = elem.attributes?.id as string
            
            const joinGateway: JoinGateway = {
                type: "join",
                id: id,
                next: findNext(elem),
            }

            return joinGateway
        })

    console.log(processData)
    console.log(nodeDefs)

    const process: Process = {
        nodes: [
            ...startEvents, 
            ...endEvents,
            ...serviceTasks,
            ...userTasks,
            ...splitGateways,
            ...joinGateways,
        ]
    }

    console.log(process)

    return process
}