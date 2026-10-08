# Errors

The plugin defines no error codes of its own. It throws plain errors
(`Error`, or `GubuError` from validation) while it loads, and Seneca
treats a throw during plugin loading as fatal. This page lists every
message and what Seneca does with it. `NAME` stands for the variable
name and `VALUE` for the offending value.

## Validation errors

Thrown while the collected values are checked against the `var` shape.
The messages come from Gubu. When several variables fail, the messages
are joined, one per line.

| Situation | Message |
| --------- | ------- |
| A required variable (`String`, `Required(...)`) has no value | `Validation failed for property "NAME" with value "undefined" because the value is required.` |
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
plugin's `defaults` shape. A wrong type or an unknown option name is a
fatal plugin load error (`invalid_plugin_option`) with a Gubu message,
for example:

| Options | Message |
| ------- | ------- |
| `{ debug: 'yes' }` | `Validation failed for property "debug" with string "yes" because the string is not of type boolean.` |
| `{ file: 123 }` | `Value "123" for property "file" does not satisfy one of: String, ["String"]` |
| `{ var: 'x' }` | `Value "x" for property "var" does not satisfy one of: {}, Function` |
| `{ process: { env: 'x' } }` | `Validation failed for property "process.env" with string "x" because the string is not of type object.` |
| `{ unknown: 1 }` | `Validation failed for object "{unknown:1}" because the property "unknown" is not allowed.` |

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
code 1 (code 2 when closing times out); in Seneca 4.0.0-rc5 the default
`system.exit` only logs the exit. Because of this, the plugin's own
tests check the messages by calling the definition function directly;
see [Test a misconfiguration](../how-to/test-code-that-uses-env.md#test-a-misconfiguration).
