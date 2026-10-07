![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/env

[![npm version](https://img.shields.io/npm/v/@seneca/env.svg)](https://npmjs.com/package/@seneca/env)
[![build](https://github.com/senecajs/seneca-env/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-env/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-env/badge.svg)](https://snyk.io/test/github/senecajs/seneca-env)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19453/branches/505563/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19453&bid=505563)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-env/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-env?branch=main)
[![Maintainability](https://api.codeclimate.com/v1/badges/9d54b38a991fe7b92a43/maintainability)](https://codeclimate.com/github/senecajs/seneca-env/maintainability)

Load configuration for Seneca plugins from environment variables and
files. You declare the variables once, with their types and defaults;
the plugin reads them from defaults files and from `process.env`,
validates and converts them at startup, and makes them available to
every plugin on the instance as `seneca.context.SenecaEnv.var`. It works
with Seneca 4 (tested with 4.0.0-rc5 and the 4.0.0 development build)
and with Seneca 3 (with seneca-promisify).

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install @seneca/env
```

On Seneca 3 also install `seneca-promisify` and load it before this
plugin. Node.js 22 or later is recommended (the package declares
`node >= 18`).

## Quick Example

```js
const Seneca = require('seneca')

const seneca = Seneca()
  .use('@seneca/env', {
    var: ({ Numeric }) => ({
      SHOP_NAME: String,         // required string
      SHOP_PORT: Numeric(3000),  // integer with a default
      $SHOP_API_KEY: String,     // required, hidden from debug output
    }),
  })

seneca.ready(function () {
  const env = this.context.SenecaEnv.var
  console.log(env.SHOP_NAME, env.SHOP_PORT) // for example: demo 3000
})
```

Run it with `SHOP_NAME=demo SHOP_API_KEY=secret node shop.js`. A
missing required variable or a value of the wrong form fails the start
of the instance with a message that names the variable.

## More Examples

* [Getting started](docs/tutorials/getting-started.md): a complete
  service with a defaults file, an optional local file, typed values and
  a plugin configured from the variables (the program is in
  [docs/examples](docs/examples/)).
* [Configure a plugin from the environment](docs/how-to/configure-a-plugin-from-the-environment.md)
* [Handle typed values](docs/how-to/handle-typed-values.md)
* [Add variables from another source](docs/how-to/add-variables-from-another-source.md)
* [Test code that uses env](docs/how-to/test-code-that-uses-env.md)

## Motivation

Configuration read straight from `process.env` is stringly typed,
scattered across plugins and checked only when the code that needs it
runs. This plugin moves it to one declaration per instance, validated
with the same [Gubu](https://github.com/rjrodger/gubu) shapes Seneca
uses for options, so that a misconfigured service fails at startup
with a clear message. See [How the plugin works](docs/explanation/design.md).

## Support

* Open a [GitHub issue](https://github.com/senecajs/seneca-env/issues).
* The [Seneca documentation](https://senecajs.org) covers plugins,
  options and messages in general.
* [Voxgig](https://www.voxgig.com) sponsors and supports this module.

## API

| Option | Purpose | Reference |
| ------ | ------- | --------- |
| `var` | The variables to load, with types and defaults; `$` prefix hides a value from the debug output. | [Options: var](docs/reference/options.md#var) |
| `file` | Defaults files; `;?` suffix for optional files. | [Options: file](docs/reference/options.md#file) |
| `process.env` | Preset values for tests. | [Options: process.env](docs/reference/options.md#processenv) |
| `debug` | Print the loaded variables at startup. | [Options: debug](docs/reference/options.md#debug) |

| Feature | Purpose | Reference |
| ------- | ------- | --------- |
| `seneca.context.SenecaEnv.var` | The loaded variables (use `this.root.context` inside plugin definitions). | [API: context](docs/reference/api.md#context) |
| `seneca.export('env/injectVars')` | Replace `$NAME` references in options with variable values. | [API: injectVars](docs/reference/api.md#injectvars) |
| `Numeric`, `Json` | Shape builders that convert strings to numbers and JSON values. | [API: shape builders](docs/reference/api.md#shape-builders) |
| `sys:env,hook:vars` | Message other plugins handle to add variables. | [Messages](docs/reference/messages.md) |
| Errors | Validation, file, hook and `injectVars` errors. | [Errors](docs/reference/errors.md) |

The [feature index](docs/README.md#feature-index) lists everything the
plugin provides.

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open
participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features please get in
touch.

### Running tests

The tests run with Jest on Node.js 24 and 22 against the Seneca 4
prerelease (`seneca@^4.0.0-rc5`, a development dependency):

```sh
npm install
npm run build
npm test
```

`.npmrc` sets `legacy-peer-deps=true` while published dependencies
exclude the Seneca 4 prerelease from their peer ranges; remove it once
Seneca 4.0.0 is published. `npm run maintain` runs the repository
hygiene checks of `@seneca/maintain`.

Changes to the GitHub Actions workflow are provided as patches in
[.patches](.patches/README.md), because pushing workflow files needs a
GitHub scope the preparing session did not have.

## Background

The plugin was created in 2022 by Richard Rodger to give Seneca
services a single, validated view of their environment. Version 0.6.0
adds Seneca 4 prerelease support and this documentation.

| Seneca | Node.js | Status |
| ------ | ------- | ------ |
| 4.0.0-rc5 and the 4.0.0 development build | 24, 22 | Tested on both; peer range `>=4.0.0-rc2`. |
| 3.38 with seneca-promisify | 24 | Tested; peer range `>=3`. |

Part of the [Senecajs org](https://github.com/senecajs/). Licensed
under the [MIT license](LICENSE).
