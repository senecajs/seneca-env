# How the plugin works

This page explains what `@seneca/env` does when it loads, why it is
built the way it is, and what it relies on in Seneca 4. The
specification is in the [reference](../README.md#reference).

## The problem

Services read their settings from the environment: ports, hosts, keys,
feature switches. Done by hand this scatters `process.env.X` reads
across plugins, every read gets a string that has to be parsed again,
missing values surface only when the code that needs them runs, and
secrets end up in log output. The plugin replaces this with one
declaration per instance: a shape that names every variable, its type
and its default, checked once at startup.

## One declaration, available everywhere

The `var` option is a shape, built with the validator of the Seneca
instance, `seneca.valid`: [shape](https://github.com/rjrodger/shape),
the successor of [Gubu](https://github.com/rjrodger/gubu). That is the
validation library Seneca itself uses for options and messages, so declaring variables feels the
same as declaring plugin options, and the error messages have the same
form (they name the property and the reason).

The validated values are stored in the instance context as
`seneca.context.SenecaEnv.var`, not behind a message. Configuration is
needed synchronously, at the moment a plugin defines its actions, and
a context lookup gives exactly that. The plugin writes the entry on the
root instance's context (`seneca.root.context`) so that delegates
created later, which copy the root context, inherit it. Plugin
definition delegates are the exception: Seneca gives them a context of
their own, which is why a plugin definition function reads
`this.root.context.SenecaEnv`, while its actions can use
`this.context.SenecaEnv`.

## Lifecycle

When Seneca runs the plugin's definition function:

1. The `var` shape is built with `seneca.valid`; a `var` function is
   first called with that validator's builders plus `Numeric` and
   `Json`. Keys with a `$` prefix are renamed without it and recorded
   as hidden. Builder nodes of the `gubu` package are refused here.
2. The files named in `file` are loaded with `require`, in order, each
   one's values overriding the previous ones. A `;?` suffix makes a
   missing file acceptable.
3. The environment is read: the `process.env` option is merged under
   the real `process.env`, and only the declared names are taken.
   Environment values override file values.
4. The collected object is validated and converted by the shape. A
   failure here throws, which makes the plugin's definition fail.
5. The result is stored as `seneca.root.context.SenecaEnv` (and on the
   plugin's own delegate), and printed when `debug` is true.
6. The export `env/injectVars` is returned.

Then, during the plugin's initialization stage (`seneca.prepare`), the
message `sys:env,hook:vars` is posted with `default$: {}` and the reply
is merged into the same `var` object. Because Seneca loads plugins one
at a time and completes initialization before the next plugin defines
itself, every value, including hook values, is in place before the next
plugin's definition function runs and before `seneca.ready()` fires.
The same ordering means that only hook handlers added by plugins loaded
earlier are called.

## Files are checked, the environment is filtered

The two sources are treated differently on purpose. The environment is
shared with the shell, the container runtime and every other process,
so it is full of names the service does not care about; the plugin
takes only the declared names and ignores the rest. A defaults file,
on the other hand, is written for this service, so a name that is not
declared is most likely a typo or a leftover, and the closed shape
reports it (`the property "NAME" is not allowed`). The one exception is
an empty `var`: shape treats `{}` as "any object", so with no
declarations the file contents pass through unchanged.

## Types

Environment values are always strings, so the plugin supplies two
shape builders that convert them: `Numeric`, which chooses `parseInt`
or `parseFloat` from the default value you give (an integer such as
`3000` or `1.0` means integers, `1.5` means decimals; `'int'` and
`'float'` select the parser without a default), and `Json`, which runs
`JSON.parse` and therefore also covers booleans, arrays and nested
objects. They are made from the validator of the instance, with its
`buildize` and `makeErr`, so they are ordinary builders of that validator and combine with its own
(`Numeric('int').Required()`). They are handed to the function form of
`var` together with the validator's builders, so your code needs no
validation library of its own and always gets builders that match the
validator Seneca uses.

A `Numeric` or `Json` variable without a default is optional: shape
reports no validator errors for an absent optional value,
so the name is simply left out of `var`. Wrap it in `Required` when
the service cannot start without it.

## Hidden variables

The `$` prefix exists for the `debug` output. Printing the resolved
configuration at startup is the quickest way to see what a deployment
actually received, but the print must not leak keys and passwords into
logs. Hidden variables are loaded and used exactly like the others;
only the print leaves them out.

## injectVars

Plugin options are usually written as literals. `injectVars` lets them
be written as references instead: any string starting with `$` names a
variable, nested objects and arrays are walked, and a `{ value$: x }`
wrapper escapes a literal that happens to start with `$`. A plugin
calls it once on its options and then uses typed values. Unknown names
throw, because a reference that resolves to `undefined` would be a
silent misconfiguration. The function changes the object it is given
in place and returns it.

## Seneca 4 and earlier versions

Version 0.6 supports Seneca 4 only: the peer dependency is `seneca`
`^4.0.0`, and like Seneca 4 it needs Node.js 24 or later. Seneca 3
users stay on `@seneca/env@0.5`. What the plugin relies on in Seneca 4:

| Topic | Seneca 4 |
| ----- | -------- |
| `seneca.prepare` and `seneca.post`, which the plugin uses for the hook | Built in. `seneca-promisify` is not needed; loading it logs the deprecation warning `SENECA_DEP_PROMISIFY`. |
| Plugin options | From `seneca.use(...)` and `options.plugin.env` only. |
| Failed definition or initialization | Fatal: the instance closes and the process exits. |
| The `sys:` prefix of the hook message | Native. |
| Validator (`seneca.valid`), for the plugin options and the `var` shape | shape 11. |
| Validation errors | `ShapeError`; a missing value reads `because the property is missing.` |

Since version 0.6.0 the plugin has no validator of its own and no
runtime dependencies. Seneca 4 validates with shape and rejects
plugin option defaults built with Gubu (fatal `plugin_gubu_shape`):
0.5.0 built its defaults with the `gubu` package, so it stops the
process at startup on Seneca 4. Builder nodes of the `gubu` package
are also not read by shape. So `env.defaults` is a function that builds
the options shape with the builders Seneca passes in, the `var` shape
is built with `seneca.valid`, and a `var` function receives that
validator's builders, with `Numeric` and `Json` made from it. A `var`
object written with builders from the `gubu` package, such as its
`Default`, is refused when the plugin loads, with a message that names
the variable.

## Limits

* Values are strings until a shape converts them; there is no builder
  for comma separated lists (use `Json` with a JSON array).
* File paths are resolved by `require` from the plugin's module; use
  absolute paths.
* Values are read once, when the plugin loads. There is no reload and
  no watching of files or the environment.
* Hook values are merged after validation, so they are neither checked
  nor converted.
* Hiding affects the `debug` print only; anything that logs
  `seneca.context` or the `var` object sees every value.
* `injectVars` mutates its argument, including object values stored in
  `var` when they contain references.
