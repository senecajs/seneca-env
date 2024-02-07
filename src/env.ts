/* Copyright © 2022 Richard Rodger, MIT License. */

import {
  Gubu,
  GubuShape,
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
  file?: string | string[]
  var?: KV | ((valid: any) => KV)
  process?: { env: KV }
  debug: boolean
}

type ContextEnv = {
  var: KV
}

function env(this: any, options: EnvOptions) {
  let seneca: any = this

  let varMap: KV = {}
  let hideMap: KV = {}

  const varShape = makeVarShape(options, hideMap)

  const processEnv = { ...(options.process?.env || {}), ...process.env }

  handleFile(varMap, options.file)
  handleVars(varMap, processEnv)

  // TODO: Gubu really needs some customization of the error message
  varMap = varShape(varMap)

  const env: ContextEnv = { var: varMap }

  // Add to root context, as well as this plugin's.
  seneca.root.context.SenecaEnv = seneca.context.SenecaEnv = env


  if (options.debug) {
    console.log('\n===ENV=START==')
    console.dir(hide(env, hideMap), { depth: null, compact: false })
    console.log('===ENV=END====\n')
  }

  function makeVarShape(options: EnvOptions, hideMap: KV) {
    let varSpec = options.var || {}

    if ('function' === typeof varSpec) {
      varSpec = varSpec({ ...Gubu, ...Intern.customShapeBuilders })
    }

    varSpec = Object.keys(varSpec)
      .reduce((a: any, k: string) => {
        let n = k.startsWith('$') ? (hideMap[k.substring(1)] = k.substring(1)) : k
        a[n] = (varSpec as any)[k]
        return a
      }, {})

    return Gubu(varSpec)
  }


  function handleFile(contextVarMap: KV, fileSpec?: string | string[]) {
    if (null != fileSpec) {
      let filePaths: string[] = 'string' === typeof fileSpec ? [fileSpec] : fileSpec

      // override right to left, like Object.assign
      for (let filePath of filePaths) {
        let varMap

        // check if optional
        if (filePath.endsWith(';?')) {
          try {
            varMap = require(filePath.substring(0, filePath.length - 2))
          }
          catch (e: any) {
            // only ignore if not found
            if ('MODULE_NOT_FOUND' !== e.code) {
              throw e
            }
          }
        }
        else {
          varMap = require(filePath)
        }
        varMap = null == varMap ? {} : varMap
        varMap = 'object' === typeof varMap.default ? varMap.default : varMap
        Object.assign(contextVarMap, varMap || {})
      }
    }
  }


  function handleVars(contextVarMap: KV, processEnv: KV) {
    let varMap = Object.keys(varShape.spec().v)
      .reduce((a: any, n: string) =>
        (null != processEnv[n] && (a[n] = processEnv[n]), a), {})

    Object.assign(contextVarMap, varMap)
  }


  function hide(env: ContextEnv, hideMap: KV) {
    return {
      var: Object.keys(env.var)
        .reduce((a: any, k: string) => (!hideMap[k] && (a[k] = env.var[k]), a), {})
    }
  }


  // Replaces deep string values of from '$FOO' with env var.
  // Escape with { value$: ... }
  // NOTE: mutates src
  function injectVars(src: any) {
    if (null == src) return src;
    if ('object' !== typeof src) return resolveVar(src);
    if (undefined !== src.value$) {
      return src.value$
    }

    for (let key in src) {
      let val = src[key]
      src[key] = 'object' === typeof val ? injectVars(val) : resolveVar(val)
    }

    return src
  }


  function resolveVar(val: any): any {
    let varMap = seneca.context.SenecaEnv.var
    if ('string' === typeof val && '$' === val[0]) {
      let rval = varMap[val.slice(1)]
      if (undefined === rval) {
        throw new Error(`@seneca/env: Enviroment variable ${val} not loaded.`)
      }
      return 'object' === typeof rval ? injectVars(rval) : rval

    }
    return val
  }


  return {
    exports: {
      injectVars
    }
  }
}


// Default options.
env.defaults = {

  // Specify needed environment variables
  var: One({}, Function),

  // Defaults from a file or set of files
  file: Skip(One(String, [String])),

  // Provide preset environment variable values
  process: Skip({
    env: Skip({})
  }),

  debug: false
}



const Intern: {
  customShapeBuilders: Record<string, any>
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
    },

    // TODO: List - parse string list like: red,green,blue

    Json: function(dval?: any) {
      let node = buildize(this)

      node.b.push((val: any, update: Update, state: State) => {

        // use default if val is undefined
        if (undefined === val) {
          update.val = dval
          return true
        }

        try {
          let jval = JSON.parse(val)
          update.val = jval
          return true
        }
        catch (e: any) {
          update.err = [
            makeErr(state,
              `Value "$VALUE" for property "$PATH" is ` +
              `not valid JSON: ` + e.message)
          ]

          return false
        }
      })

      return node
    },

  }
}

export {
  Intern
}

export default env

if ('undefined' !== typeof (module)) {
  module.exports = env
}
