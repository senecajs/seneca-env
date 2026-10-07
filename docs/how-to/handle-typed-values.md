# Handle typed values

Environment variables are strings. How to get numbers, booleans, lists,
objects and enumerations out of them, and how to mark variables as
required or optional.

Use the function form of the `var` option. The function receives the
plugin's own shape builders (`Numeric`, `Json`) together with every
[Gubu](https://github.com/rjrodger/gubu) builder (`Required`, `Skip`,
`Exact`, `Default` and the others):

```js
.use('@seneca/env', {
  var: ({ Numeric, Json, Required, Skip, Exact, Default }) => ({
    ...
  }),
})
```

## Numbers

```js
SHOP_PORT: Numeric(3000),      // integer (parseInt), default 3000
SHOP_RATE: Numeric(1.5),       // decimal (parseFloat), default 1.5
SHOP_MASK: Numeric(0, 16),     // base 16: 'ff' becomes 255
SHOP_LIMIT: Numeric('int'),    // integer, no default
SHOP_RATIO: Numeric('float'),  // decimal, no default
```

An integer default selects `parseInt`, a decimal default selects
`parseFloat`. Both accept a value with trailing characters (`'12abc'`
becomes `12`) and `parseInt` truncates (`'12.9'` becomes `12`). A value
that does not parse fails the load with
`Value "abc" for property "SHOP_PORT" is not numeric (base 10).`

Do not write a plain number as the default (`SHOP_PORT: 3000`): the
value from the environment is a string, and Gubu rejects it with
`the string is not of type number`.

## Booleans

Declare the variable as JSON with a boolean default:

```js
SHOP_OPEN: Json(false),  // 'true' and 'false' become booleans
```

Any other text (for example `yes`) fails with `is not valid JSON`.

## Lists and objects

```js
SHOP_REGIONS: Json([]),            // SHOP_REGIONS='["eu","us"]'
SHOP_RATES: Json({ EU: 0.2 }),     // SHOP_RATES='{"EU":0.21,"US":0}'
```

The value is parsed with `JSON.parse`, so numbers and quoted strings
work too. Quote the value in the shell so that the braces and quotes
reach the process intact.

## Enumerations

```js
SHOP_MODE: Exact('live', 'test'),                   // required, one of the two
SHOP_THEME: Default('light', Exact('light', 'dark')), // with a default
```

A value outside the list fails with
`Value "blue" for property "SHOP_THEME" must be exactly one of: light, dark`.

## Required and optional

| Declaration | Missing variable |
| ----------- | ---------------- |
| `String`, `Required(String)` | Fails: `the value is required`. |
| `'EUR'` (a default) | The default is used. |
| `Skip(String)` | The name is left out of `var`. |
| `Numeric('int')`, `Json()` (no default) | The name is left out of `var`. |
| `Numeric('int').Required()`, `Required(Json())` | Fails. For `Numeric` the message is `is not defined; should be numeric`. |

Shapes can be chained (`Numeric('int').Required()`) or wrapped
(`Required(Numeric('int'))`); both forms are equivalent.

## Check the result

Set `debug: true` to print the converted values at startup, or read
`seneca.context.SenecaEnv.var` in a `ready` callback. The full list of
builders is in [Shape builders](../reference/api.md#shape-builders) and
every error message in [Errors](../reference/errors.md).
