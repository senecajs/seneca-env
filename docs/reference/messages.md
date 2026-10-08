# Messages

The plugin adds no actions. It posts one message while it initializes,
which other plugins can handle to contribute variables.

## `sys:env,hook:vars`

Posted once, during the plugin's initialization stage
(`seneca.prepare`), after the variables from files and the environment
have been validated:

```js
seneca.post('sys:env,hook:vars', { default$: {} })
```

| Aspect | Specification |
| ------ | ------------- |
| Parameters | None beyond the pattern properties `sys: 'env'` and `hook: 'vars'`. |
| Reply | An object mapping variable names to values. It is merged into `seneca.context.SenecaEnv.var` with `Object.assign`, so its values override values of the same name from files and the environment. Hook values are not validated or converted by the `var` shapes and do not need to be declared. |
| No handler | `default$: {}` makes the post resolve with `{}`, and nothing is merged. |
| Several handlers | Each plugin that adds the pattern becomes the current handler; the one added last runs first and reaches the earlier ones with `this.prior(msg, ...)`. A handler should extend the prior reply rather than replace it. |
| Timing | Only handlers that exist when the plugin initializes are called, so the plugins that provide them must be loaded before `@seneca/env`. The merged values are in place before the next plugin's definition function runs and before `seneca.ready()` fires. |
| Errors | An error reply fails the plugin's initialization, which is fatal; the error is reported as replied. A reply that is not an object or array is rejected by Seneca's `strict.result` check as a fatal `result_not_objarr` error. See [Errors](errors.md#hook-errors). |

Handler examples, in callback and async form, are in
[Add variables from another source](../how-to/add-variables-from-another-source.md).

On Seneca 3 the `sys:` prefix needs no special treatment: Seneca 3
translates only `sys:seneca` patterns to `role:seneca`.
