import { xml2json, Element } from "xml-js"

import { StartEvent, EndEvent, Process } from "./process"

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

    const findNext = (source: string) => {

        const sequenceFlow = nodeDefs.find(
            elem => elem.name === "bpmn:sequenceFlow" && elem.attributes?.sourceRef === source
        ) as SequenceFlow

        return sequenceFlow.attributes.targetRef
    } 

    const startEvents = nodeDefs
        .filter((elem: Element) => elem.name === "bpmn:startEvent")
        .map((elem: Element) => {

            const id = elem.attributes?.id as string
            
            const startEvent: StartEvent = {
                type: "start",
                id: id,
                next: findNext(id),
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
            
            const endEvent: EndEvent = {
                type: "end",
                id: id,
            }

            return endEvent
        })

    console.log(processData)
    console.log(nodeDefs)

    const process: Process = {
        nodes: [...startEvents, ...endEvents]
    }

    console.log(process)

    return process
}