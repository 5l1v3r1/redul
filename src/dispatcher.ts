import { FiberNode, ElementProps, HTMLElementOrText } from '../reax'
import { EffectTag, FiberNodeTag } from '../interface'
import { TEXT_ELEMENT_TYPE } from './constants';

const isEvent = (key: string) => /on\w+/.test(key)
const computeEventName = (key: string) => key.replace(/^on/, '').toLowerCase() as keyof HTMLElementEventMap

const dispatcher = {
    render: (rootFiberNode: Reax.FiberNode) => {
        const effects = rootFiberNode.effects
        // console.log('render', effects.map(item => ([item.type, item.effectTag])))

        for (let i = 0; i < effects.length; i++) {
            const fiberNode = effects[i]
            const parentDom = getNearestParentDom(fiberNode)
            if (parentDom) {
                resolveFiberNode(fiberNode, parentDom)
                // reset effectTag
                fiberNode.effectTag = null
            }
        }
    },
    clearDomContent(domNode: HTMLElement) {
        domNode.innerHTML = ''
    }
}

function getNearestParentDom(fiberNode: FiberNode) {
    let currentFiberNode = fiberNode.parent;
    while (currentFiberNode) {
        if (currentFiberNode.tag !== FiberNodeTag.COMPONENT_NODE) {
            return currentFiberNode.statNode
        }

        currentFiberNode = currentFiberNode.parent
    }
    return null
}

function resolveFiberNode(fiberNode: FiberNode, parentDomNode: HTMLElementOrText) {
    if (fiberNode.tag === FiberNodeTag.COMPONENT_NODE) {
        resolveComponentFiberNode(fiberNode, parentDomNode)
    } else {
        resolveHostFiberNode(fiberNode, parentDomNode)
    }
}

function resolveComponentFiberNode(fiberNode: FiberNode, parentDomNode: HTMLElementOrText) {
    // do nothing
}

function resolveHostFiberNode(fiberNode: FiberNode, parentDomNode: HTMLElementOrText) {
    const effectTag = fiberNode.effectTag
    if (!effectTag) {
        return
    }

    const oldDomNode = fiberNode.statNode

    if (effectTag === EffectTag.ADD) {
        const domNode = createDomNode(fiberNode.type as string, fiberNode.props)
        fiberNode.statNode = domNode
        parentDomNode.appendChild(domNode)
    }

    if (oldDomNode) {
        if (effectTag === EffectTag.REMOVE) {
            parentDomNode.removeChild(oldDomNode)
        } else if (effectTag === EffectTag.UPDATE) {
            updateDomNode(oldDomNode, fiberNode.alternate && fiberNode.alternate.props, fiberNode.props)
        } else if (effectTag === EffectTag.REPLACE) {
            const domNode = createDomNode(fiberNode.type as string, fiberNode.props)
            fiberNode.statNode = domNode
            parentDomNode.replaceChild(domNode, oldDomNode)
        }
    }
}

function createDomNode(type: string, props: ElementProps<any>) {
    let domNode: HTMLElementOrText | null = null
    if (type === TEXT_ELEMENT_TYPE) {
        // nodeValue will update later when attach attributes
        domNode = document.createTextNode('')
    } else {
        domNode = document.createElement(type)
    }

    if (props) {
        attachDomNodeAttrsAndEvents(domNode, props)
    }
    return domNode
}

function updateDomNode(domNode: HTMLElementOrText, prevProps: ElementProps<any>, nextProps: ElementProps<any>) {
    if (nextProps) {
        if (prevProps) {
            removeAllDomNodeAttrsAndEvents(domNode, prevProps)
        }
        attachDomNodeAttrsAndEvents(domNode, nextProps)
    }
}

function attachDomNodeAttrsAndEvents(domNode: HTMLElementOrText, props: ElementProps<any>) {
    const { events, attrs } = extractAttrsAndEventsFromProps(props)

    for (let eventName in events) {
        const eventValue = events[eventName]
        domNode.addEventListener(eventName, eventValue)
    }

    for (let attrName in attrs) {
        // deal ref
        if (attrName === 'ref') {
            if (typeof attrs['ref'] === 'object') {
                attrs['ref'].current = domNode
            }
            continue
        }

        const nameAndValue = selectAttrNameAndValue(attrName, attrs[attrName])
        if (!nameAndValue) {
            continue
        }
        const { name, value } = nameAndValue
        if (isHTMLElement(domNode)) {
            domNode.setAttribute(name, value)
        } else if (value) {
            domNode.nodeValue = value
        }
    }
}

function extractAttrsAndEventsFromProps(props: ElementProps<any>) {
    let events: Partial<ElementProps<any>> = {}
    let attrs: Partial<ElementProps<any>> = {}

    for (let key in props) {
        if (isEvent(key)) {
            events[computeEventName(key)] = props[key]
        } else {
            attrs[key] = props[key]
        }
    }
    return { events, attrs }
}

function isHTMLElement(domNode: HTMLElementOrText): domNode is HTMLElement {
    return (domNode as HTMLElement).setAttribute != null
}

function removeAllDomNodeAttrsAndEvents(domNode: HTMLElementOrText, props: ElementProps<any>) {
    const { events, attrs } = extractAttrsAndEventsFromProps(props)

    // remove all events
    for (let eventName in events) {
        const eventValue = events[eventName]
        domNode.removeEventListener(eventName, eventValue)
    }

     // remove all attrs
    for (let attrName in attrs) {
        if (isHTMLElement(domNode)) {
            domNode.removeAttribute(attrName)
        } else {
            domNode.nodeValue = ''
        }
    }
}

function selectAttrNameAndValue(key: string, originValue: any) {
    let name = key
    let value = originValue

    if (key === 'htmlFor') {
        name = key
    } else if (key === 'className') {
        name = 'class'
    } else if (key === 'style' && typeof value === 'object') {
        value = Object.keys(value).map(key => `${key}: ${value[key]}`).join(';')
    } else if (key === 'children') {
        return null
    } else {
        name = name.toLowerCase()
    }

    return { name, value }
}

export default dispatcher
