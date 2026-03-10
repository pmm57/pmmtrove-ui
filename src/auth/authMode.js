export const forceAuth = import.meta.env.VITE_FORCE_AUTH === 'true'
export const onRender = import.meta.env.RENDER === 'true'
export const shouldUseAuth0 = onRender || forceAuth