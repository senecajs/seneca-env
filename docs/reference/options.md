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

A [Gubu](https://github.com/rjrodger/gubu) shape describing the
variables. Each key is a variable name; each value is a type, a default
value or a shape builder:

| Value | Meaning |
| ----- | ------- |
| `String` | Required string. |
| `'text'` | Optional string with this default. |
| `Numeric(...)`, `Json(...)` | Converted values; see [Shape builders](api.md#shape-builders). |
| `Required(shape)`, `Skip(shape)`, `Exact(...)`, `Default(...)` and other Gubu builders | As in Gubu. |

A key with a `$` prefix (`$API_KEY: String`) declares the variable
without the prefix (`API_KEY`) and hides its value from the `debug`
output. Nothing else changes for hidden variables.

The function form receives one argument, an object with every Gubu
builder plus the plugin's own `Numeric` and `Json`, and returns the
shape:

```js
var: ({ Numeric, Json, Required }) => ({
  PORT: Numeric(3000),
  RATES: Json({ EU: 0.2 }),
  NAME: Required(String),
})
```

With the object form the Gubu builders must come from your own `gubu`
dependency; the function form avoids that.

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
ignored. Any other failure (a missing file without the suffix, a syntax
error) fails the load.

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
