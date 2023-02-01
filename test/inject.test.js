const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('inject: default handler', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 4000 })

  t.plan(2)
  await ins.ready()
  const res = await ins.inject({
    method: 'GET',
    url: '/hello-world'
  })

  t.equal(res.statusCode, 404)
  t.equal(res.payload, `Powered By Continify: ${ins.$version}`)

  await ins.close()
})

tap.test('inject: route not handler function', async t => {
  const ins = Continify()
  const url = '/hello-world'
  ins.register(ContinifyHTTP, { port: 4001 })
  ins.register(async i1 => {
    i1.route({
      url
    })
  })

  t.plan(2)
  await ins.ready()
  const res = await ins.inject({
    method: 'GET',
    url
  })

  t.equal(res.statusCode, 404)
  t.equal(res.payload, `Powered By Continify: ${ins.$version}`)

  await ins.close()
})

tap.test('inject: get method', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 4002 })

  t.plan(5)
  ins.register(async i1 => {
    i1.route({
      url: '/aaa',
      handler (req, rep) {
        t.equal(Object.keys(req.$query).length, 0)
        t.equal(Object.keys(req.$params).length, 0)
        t.equal(rep.statusCode, 200)
        rep.code(302)
        rep.end('')
      }
    })
  })

  await ins.ready()
  await ins
    .inject({
      method: 'GET',
      url: '/aaa'
    })
    .then(({ statusCode, payload }) => {
      t.equal(statusCode, 302)
      t.equal(payload, '')
    })

  await ins.close()
})

tap.test('inject: get method with query params', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 4003 })

  t.plan(8)
  ins.register(async i1 => {
    i1.route({
      url: '/aaa/:name',
      handler (req, rep) {
        t.equal(Object.keys(req.$query).length, 2)
        t.equal(Object.keys(req.$params).length, 1)
        t.equal(req.$query.q1, '1')
        t.equal(req.$query.q2, 'aaa')
        t.equal(req.$params.name, 'test')
        t.equal(req.$headers.token, 'jwt-token')
        rep.end('ok')
      }
    })
  })

  await ins.ready()
  await ins
    .inject({
      method: 'GET',
      url: '/aaa/test?q1=1&q2=aaa',
      headers: {
        token: 'jwt-token'
      }
    })
    .then(({ statusCode, payload }) => {
      t.equal(statusCode, 200)
      t.equal(payload, 'ok')
    })

  await ins.close()
})

tap.test('inject: post method application/json', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 4004 })

  t.plan(5)
  ins.register(async i1 => {
    i1.route({
      method: 'POST',
      url: '/aaa',
      handler (req, rep) {
        t.equal(Object.keys(req.$query).length, 0)
        t.equal(Object.keys(req.$params).length, 0)
        t.equal(req.$body.a, 1)
        t.equal(req.$body.b, 2)
        rep.end('post')
      }
    })
  })

  await ins.ready()
  await ins
    .inject({
      method: 'POST',
      url: '/aaa',
      payload: { a: 1, b: 2 }
    })
    .then(({ payload }) => {
      t.equal(payload, 'post')
    })

  await ins.close()
})

tap.test('inject: post method text/plain', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 4005 })

  t.plan(2)
  ins.register(async i1 => {
    i1.route({
      method: 'POST',
      url: '/aaa',
      handler (req, rep) {
        t.equal(req.$body, '111')
        rep.end('post')
      }
    })
  })

  await ins.ready()
  await ins
    .inject({
      method: 'POST',
      url: '/aaa',
      payload: '111',
      headers: {
        'content-type': 'text/plain'
      }
    })
    .then(({ payload }) => {
      t.equal(payload, 'post')
    })

  await ins.close()
})
