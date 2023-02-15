const Continify = require('continify')
const ContinifyHTTP = require('.')

async function init () {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 6006 })
  ins.register(async i1 => {
    i1.addHook('beforeDeserializer', async function (req, rep) {})
    i1.route({
      method: 'POST',
      url: '/reply/aaa',
      async handler (req, rep) {
        rep.error(1000, 'reply error message')
      }
    })
  })

  await ins.ready()
  await ins.inject({ url: '/reply/aaa', method: 'POST' }).then(res => {
    console.log(res.json())
  })
  await ins.close()
}

init()
