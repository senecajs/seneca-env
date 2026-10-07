# Configure a plugin from the environment

How to give a plugin its settings (a port, a key, a rate table) from
environment variables, with safe defaults kept in a file. Each step is
independent; take the ones you need.

## 1. Declare the variables

Load `@seneca/env` before the plugins that need the values, and list
every variable with its type or default:

```js
const seneca = Seneca()
  .use('@seneca/env', {
    var: ({ Numeric, Json }) => ({
      SHOP_PORT: Numeric(3000),       // integer, default 3000
      SHOP_CURRENCY: 'EUR',           // string, default 'EUR'
      SHOP_RATES: Json({ EU: 0.2 }),  // JSON document, default given
      $SHOP_API_KEY: String,          // required, hidden from debug output
    }),
  })
  .use(shop)
```

Only declared variables are read from `process.env`. A declared variable
without a default and without a value fails the load, so a
misconfigured service does not start. The available shapes are listed
in [Shape builders](../reference/api.md#shape-builders).

## 2. Keep defaults in a committed file

```js
// config/defaults.js
module.exports = {
  SHOP_PORT: '3000',
  SHOP_CURRENCY: 'EUR',
}
```

```js
.use('@seneca/env', {
  file: [
    __dirname + '/config/defaults.js',
    __dirname + '/config/local.js;?',
  ],
  var: { ... },
})
```

Files are loaded with `require`, so `.js` and `.json` both work, and a
module that exports a `default` object is accepted. Later files override
earlier ones, and environment variables override all files. The `;?`
suffix marks a file that may be absent (for example a developer's local
overrides, excluded from version control). Use absolute paths built with
`__dirname`: a relative path would be resolved from the plugin's own
module, not from your file.

Every name in a file must be declared in `var` (unless `var` is empty),
otherwise the load fails with `the property "NAME" is not allowed`.

## 3. Read the values in your plugin

The loaded variables are at `seneca.context.SenecaEnv.var`. Inside a
plugin definition function use the root instance, because plugin
delegates have a context object of their own:

```js
function shop(options) {
  const env = this.root.context.SenecaEnv.var

  this.add('role:shop,cmd:price', function (msg, reply) {
    // Inside actions this.context.SenecaEnv.var works as well.
    reply({ total: msg.quantity * options.unit, currency: env.SHOP_CURRENCY })
  })
}
```

`ready` callbacks and delegates created with `seneca.delegate()` also
see `this.context.SenecaEnv`.

## 4. Reference variables in plugin options

Write `'$NAME'` where a value should come from a variable, and resolve
the options with the `env/injectVars` export at the start of the
definition function:

```js
function shop(options) {
  options = this.export('env/injectVars')(options)
  // options.unit is now the number from SHOP_UNIT_PRICE
}

seneca.use(shop, {
  unit: '$SHOP_UNIT_PRICE',
  rates: '$SHOP_RATES',             // objects are resolved recursively
  label: { value$: '$literal' },    // escape: the value is the string '$literal'
})
```

`injectVars` walks nested objects and arrays, replaces every string that
starts with `$`, and throws
`@seneca/env: Environment variable $NAME not loaded.` for a name that
is not loaded. It changes the object in place and returns it. Strings
that merely contain a `$` (such as `'price in $USD'`) are left alone.
See [injectVars](../reference/api.md#injectvars).

## 5. Hide secrets from the debug output

Prefix the name with `$` in the declaration (`$SHOP_API_KEY: String`).
The variable is still loaded as `SHOP_API_KEY` and still available in
`var`; only the `debug` output omits it.

## 6. Check what was loaded

Set `debug: true` while developing. The plugin prints the variables
(hidden ones excluded) between `===ENV=START==` and `===ENV=END====`
when it loads. The tutorial shows the exact
[output](../tutorials/getting-started.md#4-run-it).

## 7. Configure through Seneca options

The plugin options can also come from the instance options, which is
convenient when a deployment already configures Seneca from a file:

```js
Seneca({
  plugin: {
    env: {
      var: { SHOP_PORT: '3000' },
    },
  },
}).use('@seneca/env')
```

On Seneca 4 plugin options come only from `use()` and
`options.plugin.env`; a top level `options.env` block is not merged. See
[Where the options come from](../reference/options.md#where-the-options-come-from).
