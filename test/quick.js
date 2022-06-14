

const Seneca = require('seneca')


const seneca = Seneca({legacy:false})
      .test()
      .use('..', {
        // process: {
        //   env: {
        //     FOO: 'a',
        //     ZED: 'b',
        //   }
        // },
        var: ({Numeric, List, Json})=>({
          FOO: String,
          BAR: 'red',
          ZED: Numeric(11.5),
          // QAZ: List('mercury, venus, earth'),
          // YUK: Json()
        })})
      .ready(function() {
        console.log(this.context)
      })

