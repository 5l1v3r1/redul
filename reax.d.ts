import { ROOT_FIBER_NODE } from "./src/constants"
import { FiberNodeTag, EffectTag } from "./interface"

export = Reax
export as namespace Reax
declare namespace Reax {
    interface FunctionComponent<P = any> {
        (props: PropsWithChildren<P>): ElementInput
    }
    type ElementType = string | FunctionComponent
    type ElementChildren = Element[]

    type PropsWithChildren<P> = P & { children?: Element[] }
    type ElementProps<P = {}> = PropsWithChildren<P>

    type FC<P = {}> = FunctionComponent<P>

    interface Element<P = {}> {
        type: ElementType
        props: PropsWithChildren<P>
        children: ElementChildren
    }

    type ElementInput = string | number | boolean | null | undefined | Element | Element[]

    interface FiberNode<P = any> {
        tag: FiberNodeTag
        // element attrs
        // HOST_ROOT_NODE has node type
        type?: ElementType
        props?: PropsWithChildren<P>
        children: ElementChildren

        // fiber relations
        alternate?: FiberNode | null
        parent?: FiberNode | null
        child?: FiberNode | null
        sibling?: FiberNode | null

        // effect
        effectTag?: EffectTag
        effects: FiberNode[]

        // other
        statNode: HTMLElement | RootHTMLElementWithFiberNode | null
    }

    interface RootHTMLElementWithFiberNode extends HTMLElement {
        [ROOT_FIBER_NODE]?: FiberNode
    }
}
