"use strict";
/* Copyright © 2022 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intern = void 0;
const gubu_1 = require("gubu");
function env(options) {
    var _a;
    let seneca = this;
    const processEnv = { ...(((_a = options.process) === null || _a === void 0 ? void 0 : _a.env) || {}), ...process.env };
    const env = { var: {} };
    handleVars(options, env.var);
    seneca.root.context.env = env;
    function handleVars(options, contextVarMap) {
        let varSpec = options.var || {};
        let varShape;
        if ('function' === typeof varSpec) {
            varShape = (0, gubu_1.Gubu)(varSpec({ ...gubu_1.Gubu, ...Intern.customShapeBuilders }));
        }
        else {
            varShape = (0, gubu_1.Gubu)(varSpec);
        }
        let rawVarMap = Object.keys(varShape.spec().v)
            .reduce((a, n) => (a[n] = processEnv[n], a), {});
        // TODO: Gubu really needs some customization of the error message
        let varMap = varShape(rawVarMap);
        Object.assign(contextVarMap, varMap);
    }
}
// Default options.
env.defaults = {
    // Specify needed environment variables
    var: (0, gubu_1.One)({}, Function),
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
        }
    }
};
exports.Intern = Intern;
exports.default = env;
if ('undefined' !== typeof (module)) {
    module.exports = env;
}
//# sourceMappingURL=env.js.map