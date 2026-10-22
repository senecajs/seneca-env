# Changes

## 0.6.0 2026-10-21

* An optional configuration file (path ending in `;?`) is ignored only when
  the file itself is missing. A module that the file requires but that
  cannot be found used to be swallowed as well (same `MODULE_NOT_FOUND`
  code); it now fails the load, as the documentation says.
* Seneca 4 support. Seneca 4.0.0 validates with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so 0.5 stops the
  process at startup there (`plugin_gubu_shape`). `defaults` is now a
  function of `{ valid }`, the builders Seneca passes to it: shape on
  Seneca 4, Gubu on Seneca 3. The options are unchanged.
* The variable shape (`var`) is built with the validator of the Seneca
  instance (`seneca.valid`): shape on Seneca 4, Gubu on Seneca 3. A
  `var` function receives that validator's builders, plus `Numeric` and
  `Json`, which are made from it. A failed validation throws a
  `ShapeError` on Seneca 4 and a `GubuError` on Seneca 3; for a missing
  required variable shape's text is `because the property is missing`.
* A `var` object that holds builder nodes of the other library, such as
  builders imported from the gubu package on Seneca 4, is refused with
  an error that names the variable (fatal, as `plugin_define_failed`).
  It failed with unrelated validation errors.
* The gubu dependency is removed; the plugin has no dependencies. It
  was previously available only through Seneca's own dependency on it.
* Breaking: Seneca 3 support starts at 3.38. The peer range is
  `>=3.38||>=4.0.0-rc5` (was `>=3||>=4.0.0-rc2`). The tests run against
  Seneca 4.0.0, 4.0.0-rc5 (the development dependency, `^4.0.0-rc5`) and
  3.38 (with seneca-promisify).
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
