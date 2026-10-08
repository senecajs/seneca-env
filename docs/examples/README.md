# Examples

Runnable programs that accompany the documentation. Each file requires
the plugin from this repository; in your own project use
`require('@seneca/env')` instead.

| File | Shows | Used by |
| ---- | ----- | ------- |
| `getting-started/shop.js` | Declaring variables with types and defaults, a defaults file, an optional local file, a hidden variable, `debug` output, reading the variables in a plugin, `injectVars` for plugin options. | [Getting started](../tutorials/getting-started.md) |
| `getting-started/defaults.js` | A defaults file loaded with the `file` option. | [Getting started](../tutorials/getting-started.md) |
| `hook-vars.js` | Adding variables from other plugins with the `sys:env,hook:vars` message. | [Add variables from another source](../how-to/add-variables-from-another-source.md) |

Run an example from the repository root after `npm install`, for example:

```sh
SHOP_NAME=demo SHOP_API_KEY=secret SHOP_UNIT_PRICE=2.5 node docs/examples/getting-started/shop.js
node docs/examples/hook-vars.js
```
