"use strict";
/* Copyright © 2022 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intern = void 0;
function env(options) {
    var _a;
    let seneca = this;
    // The validator of the Seneca instance: shape on Seneca 4, Gubu on
    // Seneca 3.
    const Valid = seneca.valid;
    let varMap = {};
    let hideMap = {};
    const varShape = makeVarShape(options, hideMap);
    const processEnv = { ...(((_a = options.process) === null || _a === void 0 ? void 0 : _a.env) || {}), ...process.env };
    handleFile(varMap, options.file);
    handleVars(varMap, processEnv);
    // TODO: the validator really needs some customization of the error message
    varMap = varShape(varMap);
    const env = { var: varMap };
    // Add to root context, as well as this plugin's.
    seneca.root.context.SenecaEnv = seneca.context.SenecaEnv = env;
    if (options.debug) {
        console.log('\n===ENV=START==');
        console.dir(hide(env, hideMap), { depth: null, compact: false });
        console.log('===ENV=END====\n');
    }
    function makeVarShape(options, hideMap) {
        let varSpec = options.var || {};
        if ('function' === typeof varSpec) {
            varSpec = varSpec({ ...Valid, ...Intern.makeCustomShapeBuilders(Valid) });
        }
        varSpec = Object.keys(varSpec)
            .reduce((a, k) => {
            let n = k.startsWith('$') ? (hideMap[k.substring(1)] = k.substring(1)) : k;
            a[n] = varSpec[k];
            return a;
        }, {});
        // Builder nodes of the other library (Gubu nodes for shape, shape nodes
        // for Gubu) are not read by the validator, so they are refused.
        const isShapeLib = null != Valid({}).shape;
        const at = Intern.findForeignNode(varSpec, isShapeLib ? 'gubu$' : 'shape$');
        if (null != at) {
            throw new Error(`@seneca/env: the var option is built with ` +
                `${isShapeLib ? 'Gubu' : 'shape'} builders (at ${at}), but this ` +
                `Seneca validates with ${isShapeLib ? 'shape' : 'Gubu'}, which does ` +
                `not read them. Use the builders passed to a var function, or ` +
                `seneca.valid.`);
        }
        return Valid(varSpec);
    }
    function handleFile(contextVarMap, fileSpec) {
        if (null != fileSpec) {
            let filePaths = 'string' === typeof fileSpec ? [fileSpec] : fileSpec;
            // override right to left, like Object.assign
            for (let filePath of filePaths) {
                let varMap;
                // check if optional
                if (filePath.endsWith(';?')) {
                    const optionalPath = filePath.substring(0, filePath.length - 2);
                    try {
                        varMap = require(optionalPath);
                    }
                    catch (e) {
                        // Only ignore the optional file itself being missing. A module
                        // that the file requires but that cannot be found also has the
                        // code MODULE_NOT_FOUND; that is a real failure and is thrown.
                        if (!Intern.isMissingModule(e, optionalPath)) {
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
        let varMap = seneca.context.SenecaEnv.var;
        if ('string' === typeof val && '$' === val[0]) {
            let rval = varMap[val.slice(1)];
            if (undefined === rval) {
                throw new Error(`@seneca/env: Environment variable ${val} not loaded.`);
            }
            return 'object' === typeof rval ? injectVars(rval) : rval;
        }
        return val;
    }
    seneca.prepare(async function () {
        const seneca = this;
        const extraVars = await seneca.post('sys:env,hook:vars', { default$: {} });
        if (null != extraVars && 'object' == typeof extraVars) {
            Object.assign(varMap, extraVars);
        }
    });
    return {
        exports: {
            injectVars
        }
    };
}
// Default options, built with the builders Seneca passes in `valid`:
// shape on Seneca 4, Gubu on Seneca 3. Seneca 4 rejects Gubu shapes.
env.defaults = ({ valid }) => ({
    // Specify needed environment variables
    var: valid.One({}, Function),
    // Defaults from a file or set of files
    file: valid.Skip(valid.One(String, [String])),
    // Provide preset environment variable values
    process: valid.Skip({
        env: valid.Skip({})
    }),
    debug: false
});
const Intern = {
    isMissingModule: (err, modulePath) => {
        if (null == err || 'MODULE_NOT_FOUND' !== err.code) {
            return false;
        }
        // Node names the module that could not be found in the message:
        // "Cannot find module '<path>'". A missing dependency of the file
        // names that dependency instead.
        const message = String(err.message || '');
        return message.includes("'" + modulePath + "'");
    },
    // Builder nodes carry a marker in `$`: `shape$` or `gubu$`. Returns the
    // path of the first node with the given marker, or null.
    findForeignNode: (spec, marker, path = '', seen = new Set()) => {
        if (null == spec || 'object' !== typeof spec || seen.has(spec)) {
            return null;
        }
        seen.add(spec);
        if (null != spec.$ && 'object' === typeof spec.$ &&
            Object.prototype.hasOwnProperty.call(spec.$, marker)) {
            return path || '(root)';
        }
        for (const key of Object.keys(spec)) {
            const found = Intern.findForeignNode(spec[key], marker, path ? path + '.' + key : key, seen);
            if (null != found) {
                return found;
            }
        }
        return null;
    },
    // The builders are made from the validator they are used with (shape or
    // Gubu), as builder nodes of one are not read by the other.
    makeCustomShapeBuilders: (valid) => ({
        // TODO: could be moved to shape as a standard shape builder
        Numeric: function (dval, base = 10) {
            let node = valid.buildize(this);
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
                            valid.makeErr(state, `Value "$VALUE" for property "$PATH" is ` +
                                `not defined; should be numeric (base ${base}).`)
                        ];
                        return false;
                    }
                }
                let nval = parseNumeric(val, base);
                if (isNaN(nval)) {
                    update.err = [
                        valid.makeErr(state, `Value "$VALUE" for property "$PATH" is ` +
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
        Json: function (dval) {
            let node = valid.buildize(this);
            node.b.push((val, update, state) => {
                // use default if val is undefined
                if (undefined === val) {
                    update.val = dval;
                    return true;
                }
                try {
                    let jval = JSON.parse(val);
                    update.val = jval;
                    return true;
                }
                catch (e) {
                    update.err = [
                        valid.makeErr(state, `Value "$VALUE" for property "$PATH" is ` +
                            `not valid JSON: ` + e.message)
                    ];
                    return false;
                }
            });
            return node;
        },
    })
};
exports.Intern = Intern;
exports.default = env;
if ('undefined' !== typeof (module)) {
    module.exports = env;
}
//# sourceMappingURL=env.js.map