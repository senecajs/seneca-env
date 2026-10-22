# Options

Every option of the plugin, with its type, default and effect. Seneca
validates the options against the plugin's `defaults` shape when the
plugin loads; a value of the wrong type or an unknown option name is a
fatal load error. See [Where the options come from](#where-the-options-come-from)
for the ways to pass them.

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| [`var`](#var) | object or function | `{}` | The variables to load, as a shape of names to types or defaults. |
| [`file`](#file) | string or array of strings | none | Files with default values, loaded with `require`. |
| [`process.env`](#processenv) | object | none | Preset values, used when the real environment has no value. |
| [`debug`](#debug) | boolean | `false` | Print the loaded variables at startup. |

## `var`

A shape describing the variables, built with the validator of the
Seneca instance (`seneca.valid`): [shape](https://github.com/rjrodger/shape)
on Seneca 4.0.0, [Gubu](https://github.com/rjrodger/gubu) 9 on Seneca
3.38 and 4.0.0-rc5. Each key is a variable name; each value is a type,
a default value or a shape builder:

| Value | Meaning |
| ----- | ------- |
| `String` | Required string. |
| `'text'` | Optional string with this default. |
| `Numeric(...)`, `Json(...)` | Converted values; see [Shape builders](api.md#shape-builders). |
| `Required(shape)`, `Skip(shape)`, `Exact(...)`, `Default(...)` and the other builders of the validator | As in shape or Gubu; these four exist in both. |

A key with a `$` prefix (`$API_KEY: String`) declares the variable
without the prefix (`API_KEY`) and hides its value from the `debug`
output. Nothing else changes for hidden variables.

The function form receives one argument, an object with every builder
of the validator Seneca uses (shape's on Seneca 4.0.0, Gubu's on Seneca
3.38 and 4.0.0-rc5) plus the plugin's own `Numeric` and `Json`, and
returns the shape:

```js
var: ({ Numeric, Json, Required }) => ({
  PORT: Numeric(3000),
  RATES: Json({ EU: 0.2 }),
  NAME: Required(String),
})
```

The function form is the recommended form: its builders always match
the validator Seneca uses.

With the object form, builder nodes must come from the validator the
Seneca instance uses: on Seneca 4.0.0 shape builders (`Seneca.valid` or
`seneca.valid`, or the `shape` package), on Seneca 3.38 and 4.0.0-rc5
Gubu builders (`Seneca.valid` or the `gubu` package). The validator
does not read builder nodes of the other library, so a `var` object
that contains them (for example `{ PORT: Default(8080) }` with `Default`
imported from the `gubu` package, on Seneca 4.0.0) is refused when the
plugin loads; see [Option errors](errors.md#option-errors). On Seneca
4.0.0 `Seneca.util.Gubu` is a deprecated alias of shape
(`SENECA_DEP_UTIL_GUBU`); use `Seneca.valid`.

Only declared names are read from the environment. Names present in a
file but not declared fail validation (`the property "NAME" is not
allowed`), except when `var` is empty, in which case the shape accepts
any object and the file contents are passed through unchanged.

Do not use a plain number or boolean as a default (`PORT: 3000`):
environment values are strings and the type check fails. Use `Numeric`
and `Json` instead; see [Handle typed values](../how-to/handle-typed-values.md).

## `file`

One path or an array of paths. Each file is loaded with `require`, so it
may be a `.js` module or a `.json` file; a module exporting a `default`
object (such as a compiled ES module) is unwrapped. Files are applied in
order with `Object.assign`, so later files override earlier ones.

A path ending in `;?` is optional: a file that does not exist is
ignored. Any other failure fails the load: a missing file without the
suffix, a syntax error, or a module that the file itself requires but
that cannot be found (Node reports that with the same `MODULE_NOT_FOUND`
code; only an error naming the optional file is ignored).

Paths are resolved by `require` from the plugin's module, not from your
file, so pass absolute paths (for example `__dirname + '/config.js'`).

In `seneca.options().plugin.env` the resolved value is an array (`[]`
when the option was not given).

## `process.env`

An object of preset values, merged under the real `process.env`: a real
environment variable with the same name wins. Only declared names are
taken, as with the real environment. Values should be strings, as in a
real environment; a number or boolean would fail a `String` shape. The
option exists mainly for tests; see
[Test code that uses env](../how-to/test-code-that-uses-env.md).

## `debug`

When true, the plugin prints the loaded variables with `console.dir`
when it loads, omitting hidden variables:

```

===ENV=START==
{
  var: {
    SHOP_PORT: 3000,
    SHOP_CURRENCY: 'EUR'
  }
}
===ENV=END====

```

Values added later by the `sys:env,hook:vars` message are not included,
because they arrive after the plugin has printed.

## Precedence

Values are combined in this order; later sources override earlier ones:

1. Files named in `file`, in order.
2. The `process.env` option (presets).
3. The real `process.env`.
4. Replies to the `sys:env,hook:vars` message, which are merged after
   validation and are not converted by the `var` shapes.

Validation and conversion (steps 1 to 3) happen when the plugin is
defined; the hook (step 4) runs during the plugin's initialization. All
values are in place before the next plugin loads and before
`seneca.ready()` fires.

## Where the options come from

As for every Seneca plugin, the options are built from, in increasing
precedence: the `defaults` above, `options.plugin.env` in the Seneca
instance options, and the second argument of `seneca.use(...)`. On
Seneca 4 a top level `options.env` block is not merged (Seneca 3 merged
it only with `legacy.top_plugins`). The resolved options are available
as `seneca.options().plugin.env`.
