// Getting started with @seneca/env. This file requires the plugin from this
// repository (`require('../../..')`); in your own project use
// `require('@seneca/env')`.
//
// Run with:
//   SHOP_NAME=demo SHOP_API_KEY=secret SHOP_UNIT_PRICE=2.5 node shop.js

const Seneca = require('seneca')
const Env = require('../../..')

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
