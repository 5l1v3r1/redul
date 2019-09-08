import { createRootFiberNode } from './fiber'
import { ENOUGH_TIME, ROOT_FIBER_NODE } from './constants'
import dispatcher from './dispatcher'
import { isComponent } from './utils'
import { transformElementInputsToElements } from './element'
import { FiberNode, ElementInput, FunctionComponent, Element, RootHTMLElementWithFiberNode } from '../reax'
import { EffectTag, FiberNodeTag } from '../interface'

const taskQueue: FiberNode[] = []

const requestIdleCallback = (callback: (deadline: RequestIdleCallbackDeadline) => void) => {
    callback({
        didTimeout: true,
        timeRemaining: () => 100
    })
}
let nextUnitWork: FiberNode | null = null
let currentRootFiberNode: FiberNode | null = null

export function render(element: ElementInput, containerDom: HTMLElement) {
    // clear all before render
    dispatcher.clearDomContent(containerDom)
    const rootFiberNode = createRootFiberNode(element, containerDom)
    currentRootFiberNode = rootFiberNode
    taskQueue.push(rootFiberNode)

    requestIdleCallback(performWork)
    return containerDom
}

function performWork(deadline: RequestIdleCallbackDeadline) {
    nextUnitWork = resolveNextUnitWork()

    if (!nextUnitWork) {
        commitAllWork()
        return
    }

    if (deadline.timeRemaining() > ENOUGH_TIME) {
        nextUnitWork = performUnitWork(nextUnitWork)
    }

    requestIdleCallback(performWork)
}

function resolveNextUnitWork() {
    nextUnitWork = nextUnitWork || taskQueue.shift() || null
    return nextUnitWork
}

function commitAllWork() {
    if (currentRootFiberNode) {
        // save root fiber
        (currentRootFiberNode.statNode as RootHTMLElementWithFiberNode)[ROOT_FIBER_NODE] = currentRootFiberNode
        dispatcher.render(currentRootFiberNode)
    }
}

function performUnitWork(unitWork: FiberNode) {
    let fiberNode: FiberNode | null = unitWork
    beginUnitWork(fiberNode)

    if (fiberNode.child) {
        return fiberNode.child
    }

    while(fiberNode) {
        completeUnitWork(fiberNode)
        if (fiberNode.sibling) {
            return fiberNode.sibling
        }
        fiberNode = fiberNode.parent || null
    }

    return null
}

function beginUnitWork(fiberNode: FiberNode) {
    if (isComponent(fiberNode.type)) {
        beginComponentNodeUnitWork(fiberNode)
    } else (
        beginHostNodeUnitWork(fiberNode)
    )
}

function beginComponentNodeUnitWork(fiberNode: FiberNode) {
    const Component = fiberNode.type as FunctionComponent
    const children = transformElementInputsToElements(Component(fiberNode.props))
    reconcileChildren(children, fiberNode)
}

function beginHostNodeUnitWork(fiberNode: FiberNode) {
    const { children } = fiberNode
    reconcileChildren(children, fiberNode)
}

function reconcileChildren(children: Element[], fiberNode: FiberNode) {
    const alternateParentFiberNode = fiberNode.alternate
    // fiber node chain
    let prevChildFiberNode: FiberNode | null = null
    let alternateChildFiberNode: FiberNode | null = null
    for (let i = 0; i < children.length; i++) {
        const childElement = children[i]
        const childFiberNode = transformElementToFiberNode(childElement)
        if (i === 0) {
            fiberNode.child = childFiberNode
            alternateChildFiberNode = alternateParentFiberNode && alternateParentFiberNode.child || null
        } else {
            prevChildFiberNode!.sibling = childFiberNode
            alternateChildFiberNode = alternateChildFiberNode && alternateChildFiberNode.sibling || null
        }
        childFiberNode.parent = fiberNode
        childFiberNode.alternate = alternateChildFiberNode
        childFiberNode.statNode = alternateChildFiberNode && alternateChildFiberNode.statNode || null
        childFiberNode.effectTag = resolveFiberNodeEffectTag(childElement, alternateChildFiberNode)

        prevChildFiberNode = childFiberNode
    }

    if (alternateChildFiberNode && alternateChildFiberNode.sibling) {
        resolveAlternateFiberNodesAsRemoveEffectTag(alternateChildFiberNode.sibling, fiberNode)
    }
}

function transformElementToFiberNode(element: Element): FiberNode {
    const fiberNode = {
        tag: isComponent(element.type) ? FiberNodeTag.COMPONENT_NODE : FiberNodeTag.HOST_NODE,
        ...element,
        effects: [],
        statNode: null
    }
    return fiberNode
}

function resolveFiberNodeEffectTag(element: Element, alternateFiberNode: FiberNode | null): EffectTag {
    if (alternateFiberNode) {
        if (element.type === alternateFiberNode.type) {
            return EffectTag.UPDATE
        } else {
            return EffectTag.REPLACE
        }
    }

    return EffectTag.ADD
}

function resolveAlternateFiberNodesAsRemoveEffectTag(alternateFiberNode: FiberNode | null, fiberNode: FiberNode) {
    if (alternateFiberNode) {
        alternateFiberNode.effectTag = EffectTag.REMOVE
        fiberNode.effects.push(alternateFiberNode)
    }
}

function completeUnitWork(fiberNode: FiberNode) {
    const parentFiberNode = fiberNode.parent
    const effects = fiberNode.effects
    if (parentFiberNode) {
        if (fiberNode.effectTag) {
            parentFiberNode.effects.push(fiberNode)
        }
        parentFiberNode.effects.push(...effects)
    }
}
