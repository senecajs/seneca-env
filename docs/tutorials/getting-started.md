# Getting started

In this tutorial you will declare the configuration a small Seneca
service needs, load it from a defaults file and from environment
variables, and use it inside a plugin. It takes about ten minutes. The
finished program is in [docs/examples/getting-started](../examples/getting-started/).

## 1. Install

The plugin works with Seneca 4 (tested with 4.0.0-rc5 and the 4.0.0
development build) and with Seneca 3. Node.js 22 or later is
recommended. In a new directory:

```sh
npm init -y
npm install seneca @seneca/env
```

On Seneca 3 also install `seneca-promisify` and load it before the
plugin; see [Seneca 3 and Seneca 4](../explanation/design.md#seneca-3-and-seneca-4).

## 2. Write a defaults file

Create `defaults.js`. Values in this file are safe to commit; the
environment overrides them:

```js
// Default values that are safe to commit. Environment variables override them.
module.exports = {
  SHOP_PORT: '3000',
  SHOP_CURRENCY: 'EUR',
}
```

## 3. Declare the variables and use them

Create `shop.js`:

```js
const Seneca = require('seneca')
const Env = require('@seneca/env')

// A plugin that reads its configuration from the loaded variables.
function shop(options) {
  // Plugin delegates have their own context object, so read the variables
  // from the root instance here.
  const env = this.root.context.SenecaEnv.var

  // Replace '$NAME' references in the plugin options with variable values.
  options = this.export('env/injectVars')(options)

  this.add('role:shop,cmd:price', function (msg, reply) {
    reply({
      shop: env.SHOP_NAME,
      total: msg.quantity * options.unit,
      currency: env.SHOP_CURRENCY,
    })
  })
}

const seneca = Seneca({ log: 'warn' })
  .use(Env, {
    // Print the loaded variables (hidden ones excluded) at startup.
    debug: true,

    // Files with default values; later files override earlier ones.
    // The ';?' suffix marks a file that may be missing.
    file: [
      __dirname + '/defaults.js',
      __dirname + '/local.js;?',
    ],

    // The variables to load, with their types and defaults.
    var: ({ Numeric, Json }) => ({
      SHOP_NAME: String,              // required string
      SHOP_PORT: Numeric(3000),       // integer, default 3000
      SHOP_UNIT_PRICE: Numeric(1.5),  // decimal, default 1.5
      SHOP_CURRENCY: 'EUR',           // string, default 'EUR'
      SHOP_RATES: Json({ EU: 0.2 }),  // JSON, default { EU: 0.2 }
      $SHOP_API_KEY: String,          // required, hidden from debug output
    }),
  })
  .use(shop, { unit: '$SHOP_UNIT_PRICE' })

seneca.ready(function () {
  console.log('loaded:', this.context.SenecaEnv.var)

  this.act('role:shop,cmd:price,quantity:3', function (err, out) {
    if (err) throw err
    console.log('price:', out)
    this.close()
  })
})
```

## 4. Run it

```sh
SHOP_NAME=demo SHOP_API_KEY=secret SHOP_UNIT_PRICE=2.5 node shop.js
```

The output (produced with seneca 4.0.0-rc5):

```

===ENV=START==
{
  var: {
    SHOP_PORT: 3000,
    SHOP_CURRENCY: 'EUR',
    SHOP_NAME: 'demo',
    SHOP_UNIT_PRICE: 2.5,
    SHOP_RATES: {
      EU: 0.2
    }
  }
}
===ENV=END====

loaded: {
  SHOP_PORT: 3000,
  SHOP_CURRENCY: 'EUR',
  SHOP_NAME: 'demo',
  SHOP_UNIT_PRICE: 2.5,
  SHOP_API_KEY: 'secret',
  SHOP_RATES: { EU: 0.2 }
}
price: { shop: 'demo', total: 7.5, currency: 'EUR' }
```

## 5. What happened

* The `var` option declared six variables. `String` means a required
  string, a plain string such as `'EUR'` is a default, `Numeric` parses
  a number and `Json` parses a JSON document. These shapes are
  [Gubu](https://github.com/rjrodger/gubu) shapes; `Numeric` and `Json`
  are supplied by the plugin through the function form of `var`.
* The files named in `file` were loaded first: `defaults.js` provided
  `SHOP_PORT` and `SHOP_CURRENCY`. `local.js` does not exist, and the
  `;?` suffix told the plugin to ignore that.
* Declared variables were then read from `process.env`: `SHOP_NAME`,
  `SHOP_API_KEY` and `SHOP_UNIT_PRICE`. Environment variables override
  file values, and variables that are not declared are ignored.
* The collected values were validated and converted: `SHOP_PORT` became
  the number `3000`, `SHOP_UNIT_PRICE` the number `2.5`, and
  `SHOP_RATES` fell back to its default object.
* The result was stored as `seneca.context.SenecaEnv.var`, where the
  `ready` callback and the actions read it. Because `debug` was true,
  the plugin also printed the variables, leaving out `SHOP_API_KEY`,
  which was declared with a `$` prefix.
* The `shop` plugin loaded after the plugin, read the variables from the
  root context, and resolved the `'$SHOP_UNIT_PRICE'` reference in its
  options with the `env/injectVars` export.

## 6. Leave out a required variable

Run the program without `SHOP_NAME`:

```sh
SHOP_API_KEY=secret node shop.js
```

The plugin fails to load. Seneca reports a fatal `plugin_define_failed`
error whose message names the variable:

```
seneca: The definition action for the plugin env has failed: Validation failed
for property "SHOP_NAME" with value "undefined" because the value is required.
```

Missing or malformed configuration is detected at startup, before any
message is handled. The instance closes and, in Seneca 3 and Seneca
4.0.0, the process exits; see [Errors](../reference/errors.md).

## 7. Add a local override file

Create `local.js` next to `defaults.js`:

```js
module.exports = { SHOP_CURRENCY: 'USD' }
```

Run the program again. The last lines of the output change to:

```
price: { shop: 'demo', total: 7.5, currency: 'USD' }
```

Later files override earlier ones, so a developer can keep personal
settings in a file that is not committed, while the committed defaults
stay in place.

## Next steps

* [Configure a plugin from the environment](../how-to/configure-a-plugin-from-the-environment.md)
  covers the patterns for feeding plugin options from variables.
* [Handle typed values](../how-to/handle-typed-values.md) shows
  numbers, booleans, lists, objects and enumerations.
* [Options](../reference/options.md) and [API](../reference/api.md)
  describe every option, the context entry, the export and the shape
  builders.
* [How the plugin works](../explanation/design.md) explains the design
  and the differences between Seneca 3 and Seneca 4.
