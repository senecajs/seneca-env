// Adding variables from another source with the sys:env,hook:vars message.
// Plugins that handle the message must be loaded before @seneca/env.
// In your own project use `require('@seneca/env')` instead of `require('../..')`.

const Seneca = require('seneca')
const Env = require('../..')

// Pretend these come from a secrets store or a remote configuration service.
function secrets() {
  this.add('sys:env,hook:vars', function (msg, reply) {
    this.prior(msg, function (err, vars) {
      if (err) return reply(err)
      reply(null, { ...(vars || {}), DB_PASSWORD: 'from-the-vault' })
    })
  })
}

function region() {
  this.message('sys:env,hook:vars', async function (msg) {
    const vars = await this.prior(msg)
    return { ...(vars || {}), REGION: 'eu-west-1' }
  })
}

const seneca = Seneca({ log: 'warn' })
  .use(secrets)
  .use(region)
  .use(Env, {
    var: { APP_NAME: 'demo' },
  })

seneca.ready(function () {
  console.log(this.context.SenecaEnv.var)
  this.close()
})
