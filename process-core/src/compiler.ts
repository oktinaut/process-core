
const sandboxProxies = new WeakMap()

export const compileCode = (source: string) => {

    const sandboxedSource = `with (sandbox) { ${source} }`

    const code = new Function('sandbox', sandboxedSource)

    return (sandbox: Record<string, any>) => {

        if (!sandboxProxies.has(sandbox)) {

            const sandboxProxy = new Proxy(sandbox, { has, get })

            sandboxProxies.set(sandbox, sandboxProxy)
        }

        return code(sandboxProxies.get(sandbox))
    }
}

const has = () => {
    return true
}

const get = (target: any, key: PropertyKey) => {
    if (key === Symbol.unscopables) return undefined
    return target[key]
}