import { createRootFiberNode, createWorkInProgressRootFiberNode } from './fiber'
import { ENOUGH_TIME, ROOT_FIBER_NODE } from './constants'
import dispatcher from './dispatcher'
import { isComponent } from './utils'
import { transformElementInputsToElements } from './element'
import { FiberNode, ElementInput, FunctionComponent, Element, RootHTMLElementWithFiberNode } from '../reax'
import { EffectTag, FiberNodeTag } from '../interface'
import { setWorkInProgressFiberNode, resetWorkInProgressHook } from './hook'

const taskQueue: FiberNode[] = []

const requestIdleCallback = (callback: (deadline: RequestIdleCallbackDeadline) => void) => {
    callback({
        didTimeout: true,
        timeRemaining: () => 100
    })
}
let nextUnitWork: FiberNode | null = null
let workInProgressRootFiberNode: FiberNode | null = null

export function render(element: ElementInput, containerDom: HTMLElement) {
    // clear all before render
    dispatcher.clearDomContent(containerDom)
    const rootFiberNode = createRootFiberNode(element, containerDom)
    workInProgressRootFiberNode = rootFiberNode
    taskQueue.push(rootFiberNode)

    requestIdleCallback(performWork)
    return containerDom
}

export function update(fiberNode: FiberNode) {
    fiberNode.isPartialStateChanged = true
    const oldRootFiberNode = workInProgressRootFiberNode
    if (oldRootFiberNode) {
        const rootFiberNode = createWorkInProgressRootFiberNode(oldRootFiberNode)
        // update work-in-progress root fiber
        workInProgressRootFiberNode = rootFiberNode
        taskQueue.push(rootFiberNode)

        requestIdleCallback(performWork)
    }
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
    if (workInProgressRootFiberNode) {
        // save root fiber
        (workInProgressRootFiberNode.statNode as RootHTMLElementWithFiberNode)[ROOT_FIBER_NODE] = workInProgressRootFiberNode
        dispatcher.render(workInProgressRootFiberNode)
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
    const alternateFiberNode = fiberNode.alternate

    if (alternateFiberNode && !alternateFiberNode.isPartialStateChanged) {
        cloneChildFiberNodes(fiberNode)
        // reset update tag
        fiberNode.isPartialStateChanged = false
    } else {
        // set work-in-progress fiber to use in hooks
        setWorkInProgressFiberNode(fiberNode)
        const children = transformElementInputsToElements(Component(fiberNode.props))
        resetWorkInProgressHook()
        reconcileChildren(children, fiberNode)
    }
}

function cloneChildFiberNodes(parentFiberNode: FiberNode) {
    let oldFiberNode = parentFiberNode.alternate!.child
    let prevFiberNode: FiberNode | null = null

    while (oldFiberNode != null) {
        const newFiberNode = {
            ...oldFiberNode,
            alternate: oldFiberNode,
            parent: parentFiberNode,
            // reset effect
            effects: [],
            effectTag: null
        }

        if (prevFiberNode === null) {
            parentFiberNode.child = newFiberNode
        } else {
            (prevFiberNode as FiberNode).sibling = newFiberNode
        }

        prevFiberNode = newFiberNode
        oldFiberNode = oldFiberNode.sibling
    }
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
        childFiberNode.alternate = alternateChildFiberNode || null
        childFiberNode.statNode = alternateChildFiberNode && alternateChildFiberNode.statNode || null
        // copy hooks
        childFiberNode.hooks = alternateChildFiberNode && alternateChildFiberNode.hooks || null
        // reset effect
        childFiberNode.effects = []
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
