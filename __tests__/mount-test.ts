import { render } from '../src'
import { TEXT_ELEMENT_TYPE } from '../src/constants'
import { FiberNodeTag, FiberNode, EffectTag } from '../reax'

const getRootNode = () => {
    document.body.innerHTML = '<div id="root"></div>'
    const $root = document.getElementById('root')
    return $root as HTMLElement
}

describe('fiber reconcile test', () => {
    const $root = getRootNode()

    test('mount element whose type is string', () => {
        const element = {
            type: 'div',
            props: { style: 'color: red', children: [] },
            children: []
        }

        const parentFiberNode: FiberNode = {
            tag: FiberNodeTag.HOST_ROOT_NODE,
            effects: [],
            children: [element],
            statNode: $root,
            alternate: null,
        }

        const childFiberNode: FiberNode = {
            tag: FiberNodeTag.HOST_NODE,
            type: 'div',
            props: { style: 'color: red', children: [] },
            children: [],
            effects: [],
            alternate: null,
            statNode: null,
            effectTag: EffectTag.ADD,
            parent: parentFiberNode
        }

        parentFiberNode.child = childFiberNode
        parentFiberNode.effects = [childFiberNode]
        expect(render(element, $root)).toStrictEqual(parentFiberNode)
    })

    // test('mount element whose type is function', () => {
    //     const Count = ({ count }: { count: number }) => {
    //         const children = [
    //             {
    //                 type: TEXT_ELEMENT_TYPE,
    //                 props: { nodeValue: count, children: [] },
    //                 children: []
    //             }
    //         ]

    //         return {
    //             type: 'span',
    //             props: { children },
    //             children,
    //         }
    //     }

    //     const element = {
    //         type: Count,
    //         props: { count: 1, children: [] },
    //         children: []
    //     }

    //     const parentFiberNode: FiberNode = {
    //         tag: FiberNodeTag.HOST_ROOT_NODE,
    //         effects: [],
    //         children: [element],
    //         statNode: $root,
    //         alternate: null,
    //     }

    //     const siblingNode: FiberNode = {

    //     }

    //     const childFiberNode: FiberNode = {
    //         tag: FiberNodeTag.COMPONENT_NODE,
    //         type: Count,
    //         props: { count: 1, children: [] },
    //         children: [],
    //         effects: [],
    //         alternate: null,
    //         statNode: null,
    //         effectTag: EffectTag.ADD,
    //         parent: parentFiberNode
    //     }
    // })
})
