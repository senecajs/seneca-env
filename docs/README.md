# @seneca/env documentation

The documentation follows the [Diátaxis](https://diataxis.fr/)
structure: tutorials to learn, how-to guides for tasks, reference for
facts, explanation for understanding. Start with the tutorial if the
plugin is new to you.

## Tutorials

| Tutorial | What you build |
| -------- | -------------- |
| [Getting started](tutorials/getting-started.md) | A service that declares its variables with types and defaults, loads them from a defaults file and the environment, and uses them in a plugin. |

The programs from the tutorial are in [examples](examples/).

## How-to guides

| Guide | Covers |
| ----- | ------ |
| [Configure a plugin from the environment](how-to/configure-a-plugin-from-the-environment.md) | Declaring variables, defaults files and optional local files, reading values in plugins and actions, `$NAME` references with `injectVars`, hiding secrets, Seneca options. |
| [Handle typed values](how-to/handle-typed-values.md) | Integers, decimals, bases, booleans, lists, objects, enumerations, required and optional variables. |
| [Add variables from another source](how-to/add-variables-from-another-source.md) | The `sys:env,hook:vars` message, handler chains, load order. |
| [Test code that uses env](how-to/test-code-that-uses-env.md) | Preset values, fixture files, seneca-msg-test, testing misconfiguration, Seneca 3. |

## Reference

| Reference | Describes |
| --------- | --------- |
| [Options](reference/options.md) | Every option, its type, default and effect; precedence of sources. |
| [API](reference/api.md) | The module export, the context entry, the `env/injectVars` export, the `Numeric` and `Json` shape builders. |
| [Messages](reference/messages.md) | The `sys:env,hook:vars` message. |
| [Errors](reference/errors.md) | Every error the plugin produces and what Seneca does with it. |

## Explanation

| Explanation | Topic |
| ----------- | ----- |
| [How the plugin works](explanation/design.md) | Lifecycle, design decisions, Seneca 3 versus Seneca 4, limits. |

## Feature index

Every option, message, export, context entry, builder and error of the
plugin, with the page that documents it. The plugin adds no actions and
has no command line flags.

| Feature | Reference | Guides |
| ------- | --------- | ------ |
| Option `var` (declared variables, types, defaults; function form) | [Options: var](reference/options.md#var) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md), [Handle typed values](how-to/handle-typed-values.md) |
| Hidden variables (`$NAME` keys in `var`) | [Options: var](reference/options.md#var) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md#5-hide-secrets-from-the-debug-output) |
| Option `file` (defaults files, `;?` optional suffix, `default` export) | [Options: file](reference/options.md#file) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md#2-keep-defaults-in-a-committed-file) |
| Option `process.env` (preset values) | [Options: process.env](reference/options.md#processenv) | [Test code that uses env](how-to/test-code-that-uses-env.md) |
| Option `debug` (print loaded variables) | [Options: debug](reference/options.md#debug) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md#6-check-what-was-loaded) |
| Precedence of files, presets, environment and hook values | [Options: precedence](reference/options.md#precedence) | |
| Plugin options from `use()` and `options.plugin.env` | [Options: where the options come from](reference/options.md#where-the-options-come-from) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md#7-configure-through-seneca-options) |
| Module export (the `env` function, `env.defaults`, plugin name `env`) | [API: module](reference/api.md#module) | [Getting started](tutorials/getting-started.md) |
| Context entry `seneca.context.SenecaEnv.var` (and `seneca.root.context`) | [API: context](reference/api.md#context) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md#3-read-the-values-in-your-plugin) |
| Export `env/injectVars`, `$NAME` references, `value$` escape | [API: injectVars](reference/api.md#injectvars) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md#4-reference-variables-in-plugin-options) |
| Shape builder `Numeric(default, base)` | [API: Numeric](reference/api.md#numericdefault-base) | [Handle typed values](how-to/handle-typed-values.md#numbers) |
| Shape builder `Json(default)` | [API: Json](reference/api.md#jsondefault) | [Handle typed values](how-to/handle-typed-values.md#booleans) |
| Gubu builders in the `var` function (`Required`, `Skip`, `Exact`, `Default`, ...) | [API: shape builders](reference/api.md#shape-builders) | [Handle typed values](how-to/handle-typed-values.md#required-and-optional) |
| Message `sys:env,hook:vars` | [Messages](reference/messages.md) | [Add variables from another source](how-to/add-variables-from-another-source.md) |
| Error: required variable missing | [Errors](reference/errors.md#validation-errors) | [Handle typed values](how-to/handle-typed-values.md#required-and-optional) |
| Error: value is not numeric, or not defined (`Numeric`) | [Errors](reference/errors.md#validation-errors) | [Handle typed values](how-to/handle-typed-values.md#numbers) |
| Error: value is not valid JSON (`Json`) | [Errors](reference/errors.md#validation-errors) | [Handle typed values](how-to/handle-typed-values.md#lists-and-objects) |
| Error: wrong type for a plain default | [Errors](reference/errors.md#validation-errors) | [Handle typed values](how-to/handle-typed-values.md#numbers) |
| Error: undeclared name in a file | [Errors](reference/errors.md#validation-errors) | [Configure a plugin](how-to/configure-a-plugin-from-the-environment.md#2-keep-defaults-in-a-committed-file) |
| Error: file not found or failed to load | [Errors](reference/errors.md#file-errors) | |
| Error: hook reply is an error or not an object | [Errors](reference/errors.md#hook-errors) | [Add variables from another source](how-to/add-variables-from-another-source.md#3-know-the-rules) |
| Error: `Environment variable $NAME not loaded` (`injectVars`) | [Errors](reference/errors.md#injectvars-errors) | |
| Fatal `plugin_define_failed` and initialization failures | [Errors](reference/errors.md#what-seneca-does-with-them) | |

## Other documents

* [Change log](../CHANGES.md)
* [Code of conduct](../CODE_OF_CONDUCT.md)
* [License](../LICENSE)
