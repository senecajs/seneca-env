# Test code that uses env

How to write tests for plugins and services whose configuration comes
from `@seneca/env`: supplying values without touching the real
environment, using seneca-msg-test, and testing misconfiguration. The
examples use Jest, as this repository does; any test runner works the
same way.

## Supply values with the `process.env` option

The `process.env` option provides preset values. Real environment
variables with the same name still win, so use names that are unlikely
to exist in the environment of a CI machine:

```js
const Seneca = require('seneca')
const Env = require('@seneca/env')

test('price', async () => {
  const seneca = Seneca({ legacy: false }).test()
    .use(Env, {
      process: { env: { SHOP_TEST_UNIT: '2.5' } },
      var: ({ Numeric }) => ({ SHOP_TEST_UNIT: Numeric(1) }),
    })
    .use(shop, { unit: '$SHOP_TEST_UNIT' })

  await seneca.ready()
  expect(await seneca.post('role:shop,cmd:price,quantity:4')).toEqual({ total: 10 })
  await seneca.close()
})
```

`seneca.test()` turns on test mode (readable logs at level `warn`,
errors with code locations). Close the instance at the end of each test
so that the process exits.

Alternatively set `process.env.NAME` in the test and delete it
afterwards (in a `finally` block), which exercises exactly the production
code path.

## Point the `file` option at fixtures

```js
.use(Env, {
  file: [__dirname + '/fixtures/base.js', __dirname + '/fixtures/local.json;?'],
  var: { FOO: String, BAR: String },
})
```

Build the paths with `__dirname`; relative paths are not resolved from
the test file.

## Run message specifications with seneca-msg-test

[seneca-msg-test](https://github.com/senecajs/seneca-msg-test) runs a
list of messages against an instance and checks each reply. The
instance is configured once, so the values from `@seneca/env` apply to
every call:

```js
// shop.messages.js
module.exports = {
  print: false,
  pattern: 'role:shop',
  calls: [
    { pattern: 'cmd:price', params: { quantity: 4 }, out: { total: 10 } },
  ],
}
```

```js
const SenecaMsgTest = require('seneca-msg-test')
const ShopMessages = require('./shop.messages')

test('messages', async () => {
  const seneca = Seneca({ legacy: false }).test()
    .use(Env, {
      process: { env: { SHOP_TEST_UNIT: '2.5' } },
      var: ({ Numeric }) => ({ SHOP_TEST_UNIT: Numeric(1) }),
    })
    .use(shop, { unit: '$SHOP_TEST_UNIT' })

  await SenecaMsgTest(seneca, ShopMessages)()
  await seneca.close()
})
```

`SenecaMsgTest(seneca, spec)` returns a function that runs the calls in
order and waits for the instance to be ready first. This repository's
own `test/env.test.ts` and `test/basic.messages.ts` use the same shape.

## Test a misconfiguration

A plugin that fails to load is a fatal error in Seneca: the instance
closes and, outside test mode, the process exits. To check the error
messages for a missing or malformed variable, call the plugin
definition directly on a minimal instance stub, as the plugin's own
tests do:

```js
const Env = require('@seneca/env')

function define(options) {
  const stub = { root: { context: {} }, context: {}, prepare() {} }
  Env.call(stub, { debug: false, ...options })
  return stub.context.SenecaEnv.var
}

test('missing variable', () => {
  expect(() => define({ var: { SHOP_TEST_NAME: String } }))
    .toThrow('Validation failed for property "SHOP_TEST_NAME" with value "undefined" because the value is required.')
})
```

The messages are listed in [Errors](../reference/errors.md).

## Seneca 3

On Seneca 3 load `seneca-promisify` before the plugin
(`Seneca().test().use('promisify').use(Env)`), because the plugin uses
`seneca.prepare` and `seneca.post`. On Seneca 4 the same line is
harmless: seneca-promisify is a no-op there.
