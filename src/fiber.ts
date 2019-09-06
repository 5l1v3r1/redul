import { FiberNode, FiberNodeTag, ElementInput, RootHTMLElementWithFiberNode } from "../reax";
import { transformElementInputsToElements } from "./element";
import { ROOT_FIBER_NODE } from "./constants";

export function createRootFiberNode(element: ElementInput | ElementInput[], statNode: RootHTMLElementWithFiberNode): FiberNode {
    return {
        tag: FiberNodeTag.HOST_ROOT_NODE,
        children: transformElementInputsToElements(element),
        effects: [],
        statNode,
        alternate: statNode[ROOT_FIBER_NODE] || null
    }
}
