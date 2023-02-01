const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('hook: onRoute', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 5000 })

  t.plan(3)
  ins.register(async i1 => {
    i1.addHook('onRoute', async function (r) {
      t.equal(this.$fullname, 'root')
      t.equal(r.url, '/hook/aaa')
      t.equal(r.method, 'GET')
    })
    i1.route({
      url: '/hook/aaa'
    })
  })

  await ins.ready()
  await ins.close()
})

tap.test('hook: onRequest', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 5001 })

  t.plan(5)
  ins.register(async i1 => {
    i1.addHook('onRequest', async function (req, rep) {
      t.equal(this.$fullname, 'root')
      t.equal(req.url, '/hook/aaa')
      t.equal(req.method, 'GET')
      t.equal(req.$body, undefined)
      t.ok(rep)
    })
    i1.route({
      url: '/hook/aaa'
    })
  })

  await ins.ready()
  await ins.inject({ url: '/hook/aaa' })
  await ins.close()
})

tap.test('hook: beforeSerializer', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 5002 })

  t.plan(4)
  ins.register(async i1 => {
    i1.addHook('beforeSerializer', async function (req, rep) {
      t.equal(req.$payload, req.$raw)
      t.equal(req.$body, undefined)
      req.$payload = 'new payload'
    })
    i1.route({
      method: 'POST',
      url: '/hook/aaa',
      handler (req, rep) {
        t.equal(req.$payload, 'new payload')
        rep.end('beforeSerializer')
      }
    })
  })

  await ins.ready()
  await ins.inject({ url: '/hook/aaa', method: 'POST' }).then(({ payload }) => {
    t.equal(payload, 'beforeSerializer')
  })
  await ins.close()
})
