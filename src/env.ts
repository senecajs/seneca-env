/* Copyright © 2022 Richard Rodger, MIT License. */

import {
  Gubu,
  Builder,
  One,
  Skip,
  buildize,
  Update,
  State,
  makeErr
} from 'gubu'


type KV = Record<string, any>

type EnvOptions = {
  var?: KV | ((valid: any) => KV)
  process?: { env: KV }
}

type ContextEnv = {
  var: KV
}

function env(this: any, options: EnvOptions) {
  let seneca: any = this

  const processEnv = { ...(options.process?.env || {}), ...process.env }
  const env: ContextEnv = { var: {} }

  handleVars(options, env.var)

  seneca.root.context.env = env


  function handleVars(options: EnvOptions, contextVarMap: KV) {
    let varSpec = options.var || {}

    let varShape
    if ('function' === typeof varSpec) {
      varShape = Gubu(varSpec({ ...Gubu, ...Intern.customShapeBuilders }))
    }
    else {
      varShape = Gubu(varSpec)
    }

    let rawVarMap = Object.keys(varShape.spec().v)
      .reduce((a: any, n: string) => (a[n] = processEnv[n], a), {})

    // TODO: Gubu really needs some customization of the error message
    let varMap = varShape(rawVarMap)

    Object.assign(contextVarMap, varMap)
  }
}


// Default options.
env.defaults = {

  // Specify needed environment variables
  var: One({}, Function),

  // Provide preset environment variable values
  process: Skip({
    env: Skip({})
  }),

  debug: false
}


const Intern: {
  customShapeBuilders: Record<string, Builder>
} = {
  customShapeBuilders: {

    // TODO: could be moved to Gubu as a standard shape builder
    Numeric: function(dval?: number | string | undefined, base: number = 10) {
      let node = buildize(this)
      let sval = ('' + dval).toLowerCase()
      let parseNumeric = parseInt

      // specify integer without default
      if (sval.startsWith('int')) {
        parseNumeric = parseInt
        dval = undefined
      }

      // specify decimal without default
      else if (sval.startsWith('float')) {
        parseNumeric = parseFloat
        dval = undefined
      }

      // accept floats if default is a float
      else if (!Number.isInteger(dval)) {
        parseNumeric = parseFloat
      }

      node.b.push((val: any, update: Update, state: State) => {

        // use default if val is undefined
        if (undefined === val) {
          if (undefined !== dval) {
            update.val = dval
            return true
          }
          else {
            update.err = [
              makeErr(state,
                `Value "$VALUE" for property "$PATH" is ` +
                `not defined; should be numeric (base ${base}).`)
            ]

          }
        }

        let nval = parseNumeric(val, base)
        if (isNaN(nval)) {
          update.err = [
            makeErr(state,
              `Value "$VALUE" for property "$PATH" is ` +
              `not numeric (base ${base}).`)
          ]

          return false
        }
        else {
          update.val = nval
          return true
        }
      })

      return node
    }
  }
}

export {
  Intern
}

export default env

if ('undefined' !== typeof (module)) {
  module.exports = env
}
