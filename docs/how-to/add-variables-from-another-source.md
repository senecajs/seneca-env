# Add variables from another source

How to add values that do not come from the environment or from files,
such as secrets from a vault or settings from a configuration service,
so that they appear in `seneca.context.SenecaEnv.var` next to the other
variables. The program is in [docs/examples/hook-vars.js](../examples/hook-vars.js).

## 1. Handle the hook message in a plugin

While it initializes, `@seneca/env` posts the message
`sys:env,hook:vars` and merges the reply into the variables. Add an
action for that pattern and reply with an object of names and values.
Call `prior` so that other handlers keep their say:

```js
function secrets() {
  this.add('sys:env,hook:vars', function (msg, reply) {
    this.prior(msg, function (err, vars) {
      if (err) return reply(err)
      reply(null, { ...(vars || {}), DB_PASSWORD: 'from-the-vault' })
    })
  })
}
```

The async form works too:

```js
function region() {
  this.message('sys:env,hook:vars', async function (msg) {
    const vars = await this.prior(msg)
    return { ...(vars || {}), REGION: 'eu-west-1' }
  })
}
```

## 2. Load the handlers before the plugin

The message is posted during the plugin's initialization, so only
handlers that already exist are called. A handler loaded after
`@seneca/env` is never called.

```js
const seneca = Seneca({ log: 'warn' })
  .use(secrets)
  .use(region)
  .use('@seneca/env', {
    var: { APP_NAME: 'demo' },
  })

seneca.ready(function () {
  console.log(this.context.SenecaEnv.var)
})
```

Output (seneca 4.0.0-rc5):

```
{
  APP_NAME: 'demo',
  DB_PASSWORD: 'from-the-vault',
  REGION: 'eu-west-1'
}
```

## 3. Know the rules

* Hook values are merged with `Object.assign` over the loaded variables,
  so they override files and environment variables of the same name.
* Hook values are not validated or converted by the `var` shapes, and
  they do not need to be declared.
* A reply must be an object; Seneca rejects any other value with a fatal
  `result_not_objarr` error. When no handler exists the plugin receives
  `{}` (it posts the message with `default$: {}`).
* An error reply fails the plugin's initialization, which is fatal.
* The values are present by the time `seneca.ready()` fires, and by the
  time the next plugin's definition function runs.

The message is specified in [Messages](../reference/messages.md).
