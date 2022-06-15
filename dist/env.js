"use strict";
/* Copyright © 2022 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intern = void 0;
const gubu_1 = require("gubu");
function env(options) {
    var _a;
    let seneca = this;
    let varMap = {};
    let hideMap = {};
    const varShape = makeVarShape(options, hideMap);
    const processEnv = { ...(((_a = options.process) === null || _a === void 0 ? void 0 : _a.env) || {}), ...process.env };
    handleFile(varMap, options.file);
    handleVars(varMap, processEnv);
    // TODO: Gubu really needs some customization of the error message
    varMap = varShape(varMap);
    const env = { var: varMap };
    // Add to root context, as well as this plugin's.
    seneca.root.context.env = seneca.context.env = env;
    if (options.debug) {
        console.log('\n===ENV=START==');
        console.dir(hide(env, hideMap), { depth: null, compact: false });
        console.log('===ENV=END====\n');
    }
    function makeVarShape(options, hideMap) {
        let varSpec = options.var || {};
        if ('function' === typeof varSpec) {
            varSpec = varSpec({ ...gubu_1.Gubu, ...Intern.customShapeBuilders });
        }
        varSpec = Object.keys(varSpec)
            .reduce((a, k) => {
            let n = k.startsWith('$') ? (hideMap[k.substring(1)] = k.substring(1)) : k;
            a[n] = varSpec[k];
            return a;
        }, {});
        return (0, gubu_1.Gubu)(varSpec);
    }
    function handleFile(contextVarMap, fileSpec) {
        if (null != fileSpec) {
            let filePaths = 'string' === typeof fileSpec ? [fileSpec] : fileSpec;
            // override right to left, like Object.assign
            for (let filePath of filePaths) {
                let varMap;
                // check if optional
                if (filePath.endsWith(';?')) {
                    try {
                        varMap = require(filePath.substring(0, filePath.length - 2));
                    }
                    catch (e) {
                        // only ignore if not found
                        if ('MODULE_NOT_FOUND' !== e.code) {
                            throw e;
                        }
                    }
                }
                else {
                    varMap = require(filePath);
                }
                varMap = null == varMap ? {} : varMap;
                varMap = 'object' === typeof varMap.default ? varMap.default : varMap;
                Object.assign(contextVarMap, varMap || {});
            }
        }
    }
    function handleVars(contextVarMap, processEnv) {
        let varMap = Object.keys(varShape.spec().v)
            .reduce((a, n) => (null != processEnv[n] && (a[n] = processEnv[n]), a), {});
        Object.assign(contextVarMap, varMap);
    }
    function hide(env, hideMap) {
        return {
            var: Object.keys(env.var)
                .reduce((a, k) => (!hideMap[k] && (a[k] = env.var[k]), a), {})
        };
    }
    // Replaces deep string values of from '$FOO' with env var.
    // Escape with { value$: ... }
    // NOTE: mutates src
    function injectVars(src) {
        if (null == src)
            return src;
        if ('object' !== typeof src)
            return resolveVar(src);
        if (undefined !== src.value$) {
            return src.value$;
        }
        for (let key in src) {
            let val = src[key];
            src[key] = 'object' === typeof val ? injectVars(val) : resolveVar(val);
        }
        return src;
    }
    function resolveVar(val) {
        let varMap = seneca.context.env.var;
        if ('string' === typeof val && '$' === val[0]) {
            let rval = varMap[val.slice(1)];
            if (undefined === rval) {
                throw new Error(`@seneca/env: Enviroment variable ${val} not loaded.`);
            }
            return 'object' === typeof rval ? injectVars(rval) : rval;
        }
        return val;
    }
    return {
        exports: {
            injectVars
        }
    };
}
// Default options.
env.defaults = {
    // Specify needed environment variables
    var: (0, gubu_1.One)({}, Function),
    // Defaults from a file or set of files
    file: (0, gubu_1.Skip)((0, gubu_1.One)(String, [String])),
    // Provide preset environment variable values
    process: (0, gubu_1.Skip)({
        env: (0, gubu_1.Skip)({})
    }),
    debug: false
};
const Intern = {
    customShapeBuilders: {
        // TODO: could be moved to Gubu as a standard shape builder
        Numeric: function (dval, base = 10) {
            let node = (0, gubu_1.buildize)(this);
            let sval = ('' + dval).toLowerCase();
            let parseNumeric = parseInt;
            // specify integer without default
            if (sval.startsWith('int')) {
                parseNumeric = parseInt;
                dval = undefined;
            }
            // specify decimal without default
            else if (sval.startsWith('float')) {
                parseNumeric = parseFloat;
                dval = undefined;
            }
            // accept floats if default is a float
            else if (!Number.isInteger(dval)) {
                parseNumeric = parseFloat;
            }
            node.b.push((val, update, state) => {
                // use default if val is undefined
                if (undefined === val) {
                    if (undefined !== dval) {
                        update.val = dval;
                        return true;
                    }
                    else {
                        update.err = [
                            (0, gubu_1.makeErr)(state, `Value "$VALUE" for property "$PATH" is ` +
                                `not defined; should be numeric (base ${base}).`)
                        ];
                    }
                }
                let nval = parseNumeric(val, base);
                if (isNaN(nval)) {
                    update.err = [
                        (0, gubu_1.makeErr)(state, `Value "$VALUE" for property "$PATH" is ` +
                            `not numeric (base ${base}).`)
                    ];
                    return false;
                }
                else {
                    update.val = nval;
                    return true;
                }
            });
            return node;
        },
        // TODO: List - parse string list like: red,green,blue
        // TODO: Json - parse embedded JSON
    }
};
exports.Intern = Intern;
exports.default = env;
if ('undefined' !== typeof (module)) {
    module.exports = env;
}
//# sourceMappingURL=env.js.map