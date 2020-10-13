
const sandboxProxies = new WeakMap()

export const compileScript = (script: string) => {

    const sandboxedSource = `with (sandbox) { ${script} }`

    const code = new Function('sandbox', sandboxedSource)

    const runScript = (sandbox: Record<string, any>) => {

        sandbox["Promise"] = Promise

        if (!sandboxProxies.has(sandbox)) {

            const sandboxProxy = new Proxy(sandbox, { has, get })

            sandboxProxies.set(sandbox, sandboxProxy)
        }

        return code(sandboxProxies.get(sandbox))
    }

    return runScript
}

const has = () => {
    return true
}

const get = (target: any, key: PropertyKey) => {
    if (key === Symbol.unscopables) return undefined
    return target[key]
}