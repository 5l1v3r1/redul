import { Hook, FiberNode } from "../reax";
import { update } from './reconcile'

// hook {
//     memoziedState, ✅
//     baseState, ✅
//     queue,
//     baseUpdate,
//     next, ✅
// }

let workInProgressHook: Hook | null = null
let workInProgressFiberNode: FiberNode | null = null

export function setWorkInProgressFiberNode(fiberNode: FiberNode) {
    workInProgressFiberNode = fiberNode
}

export function resetWorkInProgressHook() {
    workInProgressHook = null
}

function mountWorkInProgressHook<S>() {
    const hook: Hook<S> = {
        memoizedState: null,
        dispatch: null,
        next: null
    }

    if (workInProgressHook === null) {
        // first hook of hook link list
        workInProgressHook = hook
        // save in work-in-progress fiber
        if (workInProgressFiberNode) {
            workInProgressFiberNode.hooks = hook
        }
    } else {
        workInProgressHook.next = hook
    }

    return hook
}

function updateWorkInProgressHook<S>() {
    // hooks never be null
    let hook: Hook<S> | null = null
    if (workInProgressHook === null) {
        hook = workInProgressFiberNode!.hooks!
    } else {
        hook = workInProgressHook.next!
    }

    return hook
}

function isInitStateFunc<S>(initState: S | (() => S)): initState is () => S {
    return typeof initState === 'function'
}

function mountUseState<S>(initState: S | (() => S)): [S, (newState: S) => void] {
    const hook = mountWorkInProgressHook<S>()
    hook.memoizedState = isInitStateFunc(initState) ? initState() : initState
    hook.next = hook
    hook.dispatch = (newState: S) => dispatchAction(hook, workInProgressFiberNode, newState)
    return [hook.memoizedState, hook.dispatch]
}

function updateUseState<S>(initState: S | (() => S)): [S | null, ((newState: S) => void) | null] {
    const hook = updateWorkInProgressHook<S>()
    return [hook.memoizedState, hook.dispatch]
}

function dispatchAction<S>(hook: Hook<S>, fiberNode: FiberNode | null, newState: S) {
    if (fiberNode) {
        hook.memoizedState = newState
        update(fiberNode)
    }
}

function useState<S>(initState: S) {
    if (workInProgressFiberNode && workInProgressFiberNode.hooks) {
        return updateUseState(initState)
    }

    return mountUseState(initState)
}


export {
    useState
}
