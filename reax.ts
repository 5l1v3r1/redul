// fiber effect
export enum EffectTag {
    ADD = 1,
    REPLACE,
    REMOVE,
    UPDATE
}

export enum FiberNodeTag {
    HOST_NODE = 1,
    HOST_ROOT_NODE,
    COMPONENT_NODE
}
