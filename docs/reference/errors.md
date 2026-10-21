# Errors

The plugin defines no error codes of its own. It throws plain errors
while it loads (`Error`, or from validation a `ShapeError` on Seneca
4.0.0 and a `GubuError` on Seneca 3.38 and 4.0.0-rc5), and Seneca
treats a throw during plugin loading as fatal. This page lists every
message and what Seneca does with it. `NAME` stands for the variable
name and `VALUE` for the offending value.

## Validation errors

Thrown while the collected values are checked against the `var` shape,
by the validator of the Seneca instance. On Seneca 4.0.0 the error is a
`ShapeError` (`name: 'ShapeError'`, `shape: true`, `code: 'shape'`); on
Seneca 3.38 and 4.0.0-rc5 it is a `GubuError` (`name: 'GubuError'`,
`gubu: true` instead of `shape: true`, `code: 'shape'`). Both have
`props`, one entry per failure with its `path`, and `desc()`, which
returns the full details. The messages are the same in shape and Gubu,
except for a missing required value. When several variables fail, the
messages are joined, one per line.

| Situation | Message |
| --------- | ------- |
| A required variable (`String`, `Required(...)`) has no value | Seneca 4.0.0 (shape): `Validation failed for property "NAME" because the property is missing.` Seneca 3.38 and 4.0.0-rc5 (Gubu): `Validation failed for property "NAME" with value "undefined" because the value is required.` |
| A `Numeric` value does not parse | `Value "VALUE" for property "NAME" is not numeric (base 10).` (the base is the one declared) |
| A required `Numeric` has no value | `Value "undefined" for property "NAME" is not defined; should be numeric (base 10).` |
| A `Json` value does not parse | `Value "VALUE" for property "NAME" is not valid JSON: ` followed by the `JSON.parse` message |
| The value does not match a plain typed default such as `PORT: 3000` or `FLAG: false` | `Validation failed for property "NAME" with string "VALUE" because the string is not of type number.` (or `boolean`) |
| The value is not in an `Exact` list | `Value "VALUE" for property "NAME" must be exactly one of: a, b` |
| A file contains a name that is not declared (and `var` is not empty) | `Validation failed for object "{...}" because the property "NAME" is not allowed.` |

## File errors

| Situation | Error |
| --------- | ----- |
| A file without the `;?` suffix does not exist | Node's `Cannot find module '<path>'` (`code: 'MODULE_NOT_FOUND'`). |
| A file exists but fails to load (a syntax error, a throw in the module) | The error thrown by `require`, unchanged. This applies to `;?` files too: only `MODULE_NOT_FOUND` is ignored for them. |

## Option errors

The plugin options themselves are validated by Seneca against the
plugin's `defaults` shape, which `env.defaults` builds with Seneca's own
builders (shape on Seneca 4.0.0, Gubu on Seneca 3.38 and 4.0.0-rc5). A
wrong type or an unknown option name is a fatal plugin load error
(`invalid_plugin_option`). On Seneca 4.0.0 the message is
`seneca: Plugin env: option value is not valid: REASON.`, where the
reason names the property but not its value, for example:

| Options | `REASON` (Seneca 4.0.0) |
| ------- | ----------------------- |
| `{ debug: 'yes' }` | `property "debug" is not of type boolean` |
| `{ file: 123 }` | `property "file" does not satisfy one of: String, ["String"]` |
| `{ var: 'x' }` | `property "var" does not satisfy one of: {}, Function` |
| `{ process: { env: 'x' } }` | `property "process.env" is not of type object` |
| `{ unknown: 1 }` | `the object does not allow the property "unknown"` |

Seneca 3.38 and 4.0.0-rc5 leave the reason out of the message and show
the options instead, for example
`seneca: Plugin env: option value is not valid:  in options {debug:yes,var:{},file:[],init$:true}`
(Seneca 3.38).

The plugin itself refuses a `var` object that contains builder nodes of
the other library, because the validator does not read them (see
[Options: var](options.md#var)). On Seneca 4.0.0, `{ PORT: Default(8080) }`
with `Default` imported from the `gubu` package fails with:

```
Error: @seneca/env: the var option is built with Gubu builders (at PORT), but this Seneca validates with shape, which does not read them. Use the builders passed to a var function, or seneca.valid.
```

On Seneca 3.38 and 4.0.0-rc5 shape builders are refused in the same
way (`built with shape builders (at PORT), but this Seneca validates
with Gubu`). The path in parentheses names the first variable with such
a node. The error is thrown by the definition function, so Seneca
reports it as `plugin_define_failed`.

## Hook errors

| Situation | Error |
| --------- | ----- |
| A `sys:env,hook:vars` handler replies with an error | That error, with its own message and code. |
| A handler replies with a value that is not an object or array | Seneca's `result_not_objarr`: `seneca: Action hook:vars,sys:env responded with result that was not an object or array: VALUE; Use option strict:{result:false} to allow; ...` |

Both occur during the plugin's initialization, which is fatal.

## injectVars errors

| Situation | Error |
| --------- | ----- |
| A `$NAME` reference names a variable that is not loaded | `Error: @seneca/env: Environment variable $NAME not loaded.` |

The error is thrown synchronously to the caller of `injectVars`. When
the caller is another plugin's definition function, that plugin's
definition fails, which is fatal as described below.

## What Seneca does with them

Validation, file and option errors happen while Seneca runs the
plugin's definition function; hook errors happen in its initialization.
Seneca treats both as fatal: it logs a `fatal` entry, wraps a
definition error as `plugin_define_failed` (message:
`seneca: The definition action for the plugin env has failed: <message> ...`,
with the original error in `details`), calls the error handler given to
`seneca.test(fn)` if there is one, closes the instance and calls
`system.exit`. In Seneca 3 and Seneca 4.0.0 that exits the process with
code 1 (code 2 when closing times out). After a failed definition,
closing does not finish within the `death_delay` option (11 seconds by
default), so in Seneca 3.38 and 4.0.0 the process exits with code 2
after that delay. In Seneca 4.0.0-rc5 the default `system.exit` only
logs the exit. Because of this, the plugin's own tests check the
messages by calling the definition function directly; see
[Test a misconfiguration](../how-to/test-code-that-uses-env.md#test-a-misconfiguration).
