import { FiberNode, ElementInput, RootHTMLElementWithFiberNode } from "../reax";
import { FiberNodeTag } from '../interface'
import { transformElementInputsToElements } from "./element";
import { ROOT_FIBER_NODE } from "./constants";

export function createRootFiberNode(element: ElementInput | ElementInput[], statNode: RootHTMLElementWithFiberNode): FiberNode {
    return {
        tag: FiberNodeTag.HOST_ROOT_NODE,
        children: transformElementInputsToElements(element),
        effects: [],
        statNode,
        alternate: null
    }
}

export function createWorkInProgressRootFiberNode(fiberNode: FiberNode) {
    return {
        tag: FiberNodeTag.HOST_ROOT_NODE,
        children: fiberNode.children,
        effects: [],
        statNode: fiberNode.statNode,
        alternate: fiberNode
    }
}
