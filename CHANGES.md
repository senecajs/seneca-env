# Changes

## 0.6.0 2026-10-07

* Seneca 4 prerelease support: the tests run against `seneca@4.0.0-rc5`
  (now a development dependency, `^4.0.0-rc5`) and against the 4.0.0
  development build. The peer dependency range `>=3||>=4.0.0-rc2` is
  unchanged, so Seneca 3 (with seneca-promisify) is still supported.
* `gubu` is declared as a dependency of the plugin; it was previously
  available only through Seneca's own dependency on it.
* `.npmrc` sets `legacy-peer-deps=true` while published dependencies
  (seneca-msg-test) exclude the Seneca 4 prerelease from their peer
  range. Remove it once Seneca 4.0.0 is published.
* Node.js 24 (default) and 22 are tested; `engines.node` is `>=18`.
* The `injectVars` error for an unknown reference now reads
  `Environment variable $NAME not loaded` (typo fixed).
* A `Numeric` variable without a default that is marked `Required` now
  fails with `is not defined; should be numeric` instead of `is not
  numeric`.
* Tests cover files, the environment, precedence, typed values, hidden
  variables, `injectVars`, the `sys:env,hook:vars` message, plugin
  options and validation errors, and close every instance. The
  repository hygiene check runs with `npm run maintain`, separate from
  `npm test`.
* Documentation reorganized under `docs/` following the Diátaxis
  structure (tutorial, how-to guides, reference, explanation) with a
  runnable example; the README is a landing page.
* The continuous integration workflow patch in `.patches/` adds Node.js
  22 to the build matrix and triggers on both `master` and `main`.
