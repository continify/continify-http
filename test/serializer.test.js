const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('serializer: default handler', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 7000 })

  t.plan(3)
  await ins.ready()
  ins.route({
    method: 'POST',
    url: '/hello-world'
  })
  ins.removeSerializer('application/json')
  ins.addHook('onError', err => {
    t.equal(err.message, 'serializer not fond: [application/json]')
  })

  const res = await ins.inject({
    method: 'POST',
    url: '/hello-world',
    payload: { a: 1 }
  })

  t.equal(res.statusCode, 500)
  t.equal(res.payload, 'serializer not fond: [application/json]')

  await ins.close()
})

tap.test('serializer: custom content type 1', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 7001 })

  t.plan(3)
  await ins.ready()
  ins.route({
    method: 'POST',
    url: '/hello-world',
    handler (req, rep) {
      t.equal(req.$body, 1)
      rep.end('application/blob')
    }
  })
  ins.addSerializer('application/blob', async function (req, done) {
    req.$body = 1
    done()
  })

  const res = await ins.inject({
    method: 'POST',
    url: '/hello-world',
    payload: { a: 1 },
    headers: {
      'content-type': 'application/blob'
    }
  })

  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'application/blob')

  await ins.close()
})

tap.test('serializer: custom content type 2', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 7001 })

  t.plan(3)
  await ins.ready()
  ins.route({
    method: 'POST',
    url: '/hello-world',
    handler (req, rep) {
      t.equal(req.$body, 1)
      rep.end('application/blob')
    }
  })
  ins.addSerializer('application/blob', function (req, done) {
    req.$body = 1
    done()
  })

  const res = await ins.inject({
    method: 'POST',
    url: '/hello-world',
    payload: { a: 1 },
    headers: {
      'content-type': 'application/blob'
    }
  })

  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'application/blob')

  await ins.close()
})

tap.test('serializer: custom content type 3', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 7002 })

  t.plan(3)
  await ins.ready()
  ins.route({
    method: 'POST',
    url: '/hello-world',
    handler (req, rep) {
      t.fail('assert')
    }
  })

  ins.addSerializer('application/blob', function (req) {
    throw new Error('serializer error')
  })
  ins.addHook('onError', err => {
    t.equal(err.message, 'serializer error')
  })

  const { payload, statusCode } = await ins.inject({
    method: 'POST',
    url: '/hello-world',
    payload: { a: 1 },
    headers: {
      'content-type': 'application/blob'
    }
  })

  t.equal(statusCode, 500)
  t.equal(payload, 'serializer error')
  await ins.close()
})
