# API

Everything the plugin adds to a Seneca instance: the module export, the
context entry, the `env/injectVars` export and the shape builders. The
plugin adds no actions of its own; the one message it uses is described
in [Messages](messages.md).

## Module

`require('@seneca/env')` returns the plugin definition function, named
`env`, with the property `env.defaults`: a function
`({ valid }) => ({ ... })` that builds the options shape (see
[Options](options.md)) with the shape builders Seneca passes in
`valid`. Load the plugin by its module or by its full name:

```js
seneca.use(require('@seneca/env'), options)
seneca.use('@seneca/env', options)
```

The plugin name is `env` in both cases, so the resolved options are
`seneca.options().plugin.env` and the export key is `env/injectVars`.

In TypeScript, `import Env from '@seneca/env'` gives the same function.
The type declarations also name an `Intern` export; it is not provided
by the compiled module at runtime.

The module has no runtime dependencies. It validates with the validator
of the Seneca instance, `seneca.valid`, and needs `seneca.prepare` and
`seneca.post`, which Seneca 4 provides. The peer dependency is `seneca`
`^4.0.0`.

## Context

| Property | Value |
| -------- | ----- |
| `seneca.context.SenecaEnv` | `{ var: {...} }`, where `var` maps each loaded variable name to its converted value. |
| `seneca.root.context.SenecaEnv` | The same object. |

The entry is set on the root context, so it is visible to `ready`
callbacks, to actions (`this.context.SenecaEnv`) and to delegates
created afterwards with `seneca.delegate()`. Inside another plugin's
definition function use `this.root.context.SenecaEnv`, because plugin
delegates receive a context object of their own (`{ plugin, name, tag,
full }`). Values from the `sys:env,hook:vars` message are added to the
same `var` object during initialization.

## Exports

### `injectVars`

```js
const injectVars = seneca.export('env/injectVars')
const resolved = injectVars(value)
```

Replaces variable references in a value and returns it:

| Input | Result |
| ----- | ------ |
| A string starting with `$`, such as `'$PORT'` | The value of the variable `PORT`, with its converted type. An object value is itself resolved recursively. |
| Any other string, number, boolean, `null`, `undefined` | Returned unchanged. A string containing `$` elsewhere (`'in $USD'`) is unchanged. |
| An object `{ value$: x }` | `x`, unchanged (the escape for literal `$` strings). |
| Any other object or array | Walked recursively; every nested value is resolved as above. The object is modified in place and returned. |

A reference to a name that is not loaded throws
`Error('@seneca/env: Environment variable $NAME not loaded.')`. The
name is looked up in `seneca.context.SenecaEnv.var`, so values added by
the hook message are available too.

## Shape builders

The function form of the `var` option receives an object with every
builder of the validator the Seneca instance uses,
[shape](https://github.com/rjrodger/shape) (`Required`, `Skip`,
`Optional`, `Exact`, `Default`, `One`, `Open`, `Closed`, `Min`, `Max`,
`Len`, `Check`, `Integer`, `Email` and the rest). The object also holds
the validator itself, as `Shape`. The plugin adds these two builders:

### `Numeric(default, base)`

Parses the string value into a number.

| Call | Parser | Default |
| ---- | ------ | ------- |
| `Numeric(3000)` (integer) | `parseInt` | `3000` |
| `Numeric(1.5)` (non-integer) | `parseFloat` | `1.5` |
| `Numeric('int')` | `parseInt` | none |
| `Numeric('float')` | `parseFloat` | none |
| `Numeric()` | `parseFloat` | none |
| `Numeric(0, 16)` | `parseInt` with base 16 | `0` |

`base` defaults to 10 and only affects `parseInt`. A value that parses
to `NaN` fails with `Value "abc" for property "NAME" is not numeric
(base 10).`. The parsers accept trailing characters and `parseInt`
truncates decimals. When the variable is missing, the default is used;
without a default the name is left out of `var`, unless the shape is
required (`Numeric('int').Required()` or `Required(Numeric('int'))`),
in which case the load fails with `is not defined; should be numeric`.
A default that is not a number (`Numeric('7')`) is used as given, as a
string.

### `Json(default)`

Parses the string value with `JSON.parse`, so objects, arrays, numbers
and the booleans `true` and `false` are all accepted. When the variable
is missing, the default is used; without a default the name is left out
of `var`, unless the shape is wrapped in `Required`. A value that does
not parse fails with `Value "{bad" for property "NAME" is not valid
JSON: ` followed by the `JSON.parse` message.

Both builders are made from the validator of the instance, with its
`buildize` and `makeErr`, and return nodes of that validator, so its
methods can be chained (`Numeric('int').Required()`).

### Plain values

Without a builder, the validator's own rules apply: `String` is a
required string, a string literal is a
default, and a number or boolean literal is a typed default that an
environment string cannot satisfy.
