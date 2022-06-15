

const Seneca = require('seneca')


const seneca = Seneca({legacy:false})
      .test()
      .use('..', {
        debug: true,

        // process: {
        //   env: {
        //     FOO: 'a',
        //     ZED: 'b',
        //   }
        // },

        file: [
          __dirname+'/base.js', // this would be in git

          // ';?' suffic means optional
          __dirname+'/local.json;?' // this would not, for example
        ],
        
        var: ({Numeric, List, Json})=>({
          // $ prefix means hide in debug output
          $FOO: String,
          BAR: 'red',
          ZED: Numeric(11.5),
          // QAZ: List('mercury, venus, earth'),
          // YUK: Json()
        })})
      .ready(function() {
        console.log(this.context)
      })

