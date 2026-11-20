# Changes

## 0.6.0 2026-11-20

First entry of this change log. Earlier versions are on npm and in the
git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/env@0.5`.
* Node.js 24 or later (`engines.node` `>=24`, was `>=18`).
* Seneca 4 validates with [shape](https://github.com/rjrodger/shape),
  the renamed successor of Gubu, and rejects option defaults built with
  Gubu, so 0.5 stops the process at startup there
  (`plugin_gubu_shape`). `defaults` is now a function of `{ valid }`,
  the shape builders Seneca passes to it (B1). The options are
  unchanged.
* The variable shape (`var`) is built with the validator of the Seneca
  instance (`seneca.valid`). A `var` function receives its builders,
  plus `Numeric` and `Json`, which are made from it. A failed
  validation throws a `ShapeError`; for a missing required variable the
  text is now `because the property is missing` (was `with value
  "undefined" because the value is required`).
* A `var` object that holds builder nodes of the `gubu` package is
  refused with an error that names the variable (fatal, as
  `plugin_define_failed`). It failed with unrelated validation errors.
* The `gubu` dependency is removed; the plugin has no runtime
  dependencies.
* An optional configuration file (path ending in `;?`) is ignored only
  when the file itself is missing. A module that the file requires but
  that cannot be found used to be swallowed as well (same
  `MODULE_NOT_FOUND` code); it now fails the load, as the documentation
  says.
* The `injectVars` error for an unknown reference now reads
  `Environment variable $NAME not loaded` (typo fixed).
* A `Numeric` variable without a default that is marked `Required` now
  fails with `is not defined; should be numeric` instead of `is not
  numeric`.
* The tests no longer load `seneca-promisify` (D4); the development
  dependency on it is removed. The development dependencies are
  `seneca` `^4.0.0` and `seneca-msg-test` `^5.0.0`, and the committed
  `.npmrc` (`legacy-peer-deps=true`) is removed. The tests cover files,
  the environment, precedence, typed values, hidden variables,
  `injectVars`, the `sys:env,hook:vars` message, plugin options and
  validation errors, and close every instance. The repository hygiene
  check runs with `npm run maintain`, separate from `npm test`.
* Package metadata for trusted publishing: `repository.url` is
  `git+https://github.com/senecajs/seneca-env.git` and
  `publishConfig.access` is `public`. TypeScript is pinned to a patch
  range (`~5.9.3`), because `dist/` is committed.
* Documentation reorganized under `docs/` following the Diátaxis
  structure (tutorial, how-to guides, reference, explanation) with a
  runnable example; the README is a landing page.
