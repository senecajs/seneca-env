
import Env from '../src/env'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')
const BasicMessages = require('./basic.messages').default


// seneca-promisify provides prepare and post on Seneca 3; on Seneca 4 it is a no-op.
function make() {
  return Seneca({ legacy: false }).test().use('promisify')
}


describe('env', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Env)
    await seneca.ready()
    expect(seneca.context.SenecaEnv).toEqual({ var: {} })
    expect(seneca.root.context.SenecaEnv).toBe(seneca.context.SenecaEnv)
    expect(typeof seneca.export('env/injectVars')).toEqual('function')
    expect(seneca.options().plugin.env).toMatchObject({ var: {}, file: [], debug: false })
    await seneca.close()
  })

  test('messages', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Env)
    await (SenecaMsgTest(seneca, BasicMessages)())
    await seneca.close()
  })

  test('vars from files, process.env and defaults', async () => {
    process.env.SENECA_ENV_TEST_NAME = 'alice'
    process.env.SENECA_ENV_TEST_PORT = '8080'
    process.env.SENECA_ENV_TEST_UNDECLARED = 'ignored'
    try {
      const seneca = make().use(Env, {
        file: [
          __dirname + '/base.js',
          __dirname + '/local.json;?',
          __dirname + '/missing.js;?',
        ],
        var: ({ Numeric, Json }: any) => ({
          FOO: String,
          BAR: String,
          SENECA_ENV_TEST_NAME: String,
          SENECA_ENV_TEST_PORT: Numeric(3000),
          SENECA_ENV_TEST_COLOR: 'red',
          SENECA_ENV_TEST_JSON: Json({ q: 1 }),
        }),
      })
      await seneca.ready()
      expect(seneca.context.SenecaEnv.var).toEqual({
        FOO: 'base',
        BAR: 'green',
        SENECA_ENV_TEST_NAME: 'alice',
        SENECA_ENV_TEST_PORT: 8080,
        SENECA_ENV_TEST_COLOR: 'red',
        SENECA_ENV_TEST_JSON: { q: 1 },
      })
      await seneca.close()
    }
    finally {
      delete process.env.SENECA_ENV_TEST_NAME
      delete process.env.SENECA_ENV_TEST_PORT
      delete process.env.SENECA_ENV_TEST_UNDECLARED
    }
  })

  test('precedence: file, preset, process.env, hook', async () => {
    process.env.BAR = 'env'
    try {
      function hook(this: any) {
        this.add('sys:env,hook:vars', function(this: any, msg: any, reply: any) {
          this.prior(msg, (err: any, prev: any) =>
            reply(err, { ...(prev || {}), BAR: 'hook', ZED: 'hook-only' }))
        })
      }
      const seneca = make().use(hook).use(Env, {
        file: [__dirname + '/base.js', __dirname + '/local.json'],
        process: { env: { FOO: 'preset', BAR: 'preset' } },
        var: { FOO: String, BAR: String },
      })
      await seneca.ready()
      expect(seneca.context.SenecaEnv.var).toEqual({
        FOO: 'preset',
        BAR: 'hook',
        ZED: 'hook-only',
      })
      await seneca.close()
    }
    finally {
      delete process.env.BAR
    }
  })

  test('hook chain', async () => {
    function one(this: any) {
      this.add('sys:env,hook:vars', function(this: any, msg: any, reply: any) {
        this.prior(msg, (err: any, prev: any) => reply(err, { ...(prev || {}), one: 11 }))
      })
    }
    function two(this: any) {
      this.message('sys:env,hook:vars', async function(this: any, msg: any) {
        const prev = await this.prior(msg)
        return { ...(prev || {}), two: 22 }
      })
    }
    function late(this: any) {
      this.add('sys:env,hook:vars', function(this: any, msg: any, reply: any) {
        reply(null, { late: true })
      })
    }
    const seneca = make().use(one).use(two).use(Env, { var: { H: 'h' } }).use(late)
    await seneca.ready()
    expect(seneca.context.SenecaEnv.var).toEqual({ H: 'h', one: 11, two: 22 })
    expect(seneca.export('env/injectVars')('$one')).toEqual(11)
    await seneca.close()
  })

  test('hidden vars are kept but not printed', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => { })
    const dir = jest.spyOn(console, 'dir').mockImplementation(() => { })
    try {
      const seneca = make().use(Env, {
        debug: true,
        process: { env: { SENECA_ENV_TEST_SECRET: 's3cr3t', SENECA_ENV_TEST_PUBLIC: 'open' } },
        var: { $SENECA_ENV_TEST_SECRET: String, SENECA_ENV_TEST_PUBLIC: String },
      })
      await seneca.ready()
      expect(seneca.context.SenecaEnv.var).toEqual({
        SENECA_ENV_TEST_SECRET: 's3cr3t',
        SENECA_ENV_TEST_PUBLIC: 'open',
      })
      expect(dir).toHaveBeenCalledWith(
        { var: { SENECA_ENV_TEST_PUBLIC: 'open' } }, expect.anything())
      await seneca.close()
    }
    finally {
      log.mockRestore()
      dir.mockRestore()
    }
  })

  test('injectVars', async () => {
    const seneca = make().use(Env, {
      process: {
        env: {
          SENECA_ENV_TEST_A: 'x',
          SENECA_ENV_TEST_N: '33.3',
          SENECA_ENV_TEST_J: JSON.stringify({ q: ['$SENECA_ENV_TEST_A', { value$: '$SENECA_ENV_TEST_A' }] }),
        }
      },
      var: ({ Numeric, Json }: any) => ({
        SENECA_ENV_TEST_A: String,
        SENECA_ENV_TEST_N: Numeric(1),
        SENECA_ENV_TEST_J: Json(),
      }),
    })
    await seneca.ready()
    const injectVars = seneca.export('env/injectVars')

    const src = {
      a: '$SENECA_ENV_TEST_A',
      b: { value$: '$SENECA_ENV_TEST_A' },
      c: { d: 1, e: [2, '$SENECA_ENV_TEST_N'] },
      f: '$SENECA_ENV_TEST_J',
      g: 'plain $ text',
      h: null,
    }
    const out = injectVars(src)
    expect(out).toBe(src)
    expect(out).toEqual({
      a: 'x',
      b: '$SENECA_ENV_TEST_A',
      c: { d: 1, e: [2, 33] },
      f: { q: ['x', '$SENECA_ENV_TEST_A'] },
      g: 'plain $ text',
      h: null,
    })
    expect(injectVars('$SENECA_ENV_TEST_N')).toEqual(33)
    expect(injectVars(7)).toEqual(7)
    expect(injectVars(null)).toEqual(null)
    expect(() => injectVars({ z: '$SENECA_ENV_TEST_MISSING' }))
      .toThrow('@seneca/env: Environment variable $SENECA_ENV_TEST_MISSING not loaded.')
    await seneca.close()
  })

  test('available to later plugins and actions', async () => {
    const seneca = make().use(Env, {
      process: { env: { SENECA_ENV_TEST_UNIT: '2.5' } },
      var: ({ Numeric }: any) => ({ SENECA_ENV_TEST_UNIT: Numeric(1.5) }),
    })
    seneca.use(function shop(this: any, options: any) {
      // Plugin delegates have their own context, so use the root context here.
      const env = this.root.context.SenecaEnv.var
      options = this.export('env/injectVars')(options)
      this.add('role:shop,cmd:price', function(this: any, msg: any, reply: any) {
        reply({
          total: msg.quantity * options.unit,
          same: this.context.SenecaEnv.var.SENECA_ENV_TEST_UNIT === env.SENECA_ENV_TEST_UNIT,
        })
      })
    }, { unit: '$SENECA_ENV_TEST_UNIT' })
    await seneca.ready()
    expect(await seneca.post('role:shop,cmd:price,quantity:4')).toEqual({ total: 10, same: true })
    await seneca.close()
  })

  test('plugin options from seneca options', async () => {
    const seneca = Seneca({
      legacy: false,
      plugin: { env: { var: { SENECA_ENV_TEST_X: 'from-options' } } },
    }).test().use('promisify').use(Env)
    await seneca.ready()
    expect(seneca.context.SenecaEnv.var).toEqual({ SENECA_ENV_TEST_X: 'from-options' })
    await seneca.close()
  })

})


describe('env validation', () => {

  // A failing plugin definition is a fatal error in Seneca, which closes the
  // instance, so the definition function is called directly on a stub here.
  function define(options: any) {
    const stub: any = { root: { context: {} }, context: {}, prepare() { } }
    Env.call(stub, { debug: false, ...options })
    return stub.context.SenecaEnv.var
  }

  test('typed values', () => {
    expect(define({
      process: {
        env: {
          SENECA_ENV_TEST_HEX: 'ff',
          SENECA_ENV_TEST_FLOAT: '2.5',
          SENECA_ENV_TEST_INT: '12.9',
          SENECA_ENV_TEST_LIST: '[1,"a"]',
          SENECA_ENV_TEST_FLAG: 'true',
        }
      },
      var: ({ Numeric, Json }: any) => ({
        SENECA_ENV_TEST_HEX: Numeric(0, 16),
        SENECA_ENV_TEST_FLOAT: Numeric(1.5),
        SENECA_ENV_TEST_INT: Numeric(1),
        SENECA_ENV_TEST_LIST: Json([]),
        SENECA_ENV_TEST_FLAG: Json(false),
        SENECA_ENV_TEST_DEFAULT: Numeric(7),
        SENECA_ENV_TEST_OPTIONAL: Numeric('int'),
      }),
    })).toEqual({
      SENECA_ENV_TEST_HEX: 255,
      SENECA_ENV_TEST_FLOAT: 2.5,
      SENECA_ENV_TEST_INT: 12,
      SENECA_ENV_TEST_LIST: [1, 'a'],
      SENECA_ENV_TEST_FLAG: true,
      SENECA_ENV_TEST_DEFAULT: 7,
      // SENECA_ENV_TEST_OPTIONAL has no value and no default, so it is omitted.
    })
  })

  test('errors', () => {
    expect(() => define({ var: { SENECA_ENV_TEST_S: String } }))
      .toThrow('Validation failed for property "SENECA_ENV_TEST_S" with value "undefined" because the value is required.')

    expect(() => define({
      process: { env: { SENECA_ENV_TEST_N: 'abc' } },
      var: ({ Numeric }: any) => ({ SENECA_ENV_TEST_N: Numeric(1) }),
    })).toThrow('Value "abc" for property "SENECA_ENV_TEST_N" is not numeric (base 10).')

    expect(() => define({
      var: ({ Numeric }: any) => ({ SENECA_ENV_TEST_N: Numeric('int').Required() }),
    })).toThrow('Value "undefined" for property "SENECA_ENV_TEST_N" is not defined; should be numeric (base 10).')

    expect(() => define({
      process: { env: { SENECA_ENV_TEST_J: '{bad' } },
      var: ({ Json }: any) => ({ SENECA_ENV_TEST_J: Json() }),
    })).toThrow('Value "{bad" for property "SENECA_ENV_TEST_J" is not valid JSON')

    expect(() => define({
      process: { env: { SENECA_ENV_TEST_P: '8080' } },
      var: { SENECA_ENV_TEST_P: 3000 },
    })).toThrow('because the string is not of type number')

    // An empty var shape accepts anything; a declared shape rejects unknown names.
    expect(define({ file: __dirname + '/base.js', var: {} })).toEqual({ FOO: 'base' })
    expect(() => define({ file: __dirname + '/base.js', var: { BAR: 'x' } }))
      .toThrow('because the property "FOO" is not allowed')

    expect(() => define({ file: __dirname + '/missing.js', var: {} }))
      .toThrow(/Cannot find module/)
  })

})
