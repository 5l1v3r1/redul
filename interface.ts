// fiber effect
export enum EffectTag {
    ADD = 1,
    REPLACE,
    REMOVE,
    UPDATE
}

export enum FiberNodeTag {
    HOST_ROOT_NODE = 1,
    HOST_NODE,
    COMPONENT_NODE
}
