// Test fixture: an optional config file that exists but itself requires a module that is not installed.
module.exports = { FOO: require('seneca-env-test-missing-module') }
