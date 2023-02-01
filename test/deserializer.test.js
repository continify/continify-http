const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('serializer: default handler', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 8000 })

  t.plan(3)
  await ins.ready()
  ins.route({
    method: 'POST',
    url: '/hello-world',
    async handler (req, rep) {
      return { hello: 'world' }
    }
  })
  ins.removeDeserializer('application/json')
  ins.addHook('onError', err => {
    t.equal(err.message, 'deserializer not fond: [application/json]')
  })

  const res = await ins.inject({
    method: 'POST',
    url: '/hello-world',
    payload: { a: 1 }
  })

  t.equal(res.statusCode, 400)
  t.equal(res.payload, 'deserializer not fond: [application/json]')

  await ins.close()
})
