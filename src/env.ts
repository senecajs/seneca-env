/* Copyright © 2022 Richard Rodger, MIT License. */


function env(this: any, options: any) {
  let seneca: any = this
}


// Default options.
env.defaults = {

  debug: false
}


export default env

if ('undefined' !== typeof (module)) {
  module.exports = env
}
