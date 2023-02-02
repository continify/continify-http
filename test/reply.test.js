const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('reply', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 6000 })

  t.plan(15)
  ins.register(async i1 => {
    i1.route({
      url: '/reply/aaa',
      handler (req, rep) {
        t.equal(rep.statusCode, 200)
        rep.code(400)
        t.equal(rep.statusCode, 400)

        t.equal(rep.getHeader('content-type'), undefined)
        rep.type('text/plain')
        t.equal(rep.getHeader('content-type'), 'text/plain')

        rep.setHeader('token', '12345')

        rep.setHeader('token-remove', 'aaa')
        t.ok(rep.hasHeader('token-remove'))
        rep.removeHeader('token-remove')
        t.ok(!rep.hasHeader('token-remove'))

        t.ok(rep.getHeaderNames().length > 0)
        t.ok(Object.keys(rep.getHeaders()).length > 0)
        rep.send('reply')
        rep.send('reply0') // duplicate send
      }
    })

    i1.route({
      url: '/reply/redirect',
      handler (req, rep) {
        rep.redirect('/new-page')
      }
    })

    i1.route({
      url: '/reply/async',
      async handler (req, rep) {
        return 'async'
      }
    })

    i1.route({
      url: '/reply/sync',
      handler (req, rep) {
        rep.end('sync0')
        return 'sync1'
      }
    })

    i1.route({
      url: '/reply/empty',
      handler (req, rep) {
        rep.end()
      }
    })
  })

  await ins.ready()
  await ins.inject({ url: '/reply/aaa' }).then(({ payload, headers }) => {
    t.equal(headers.token, '12345')
    t.equal(payload, 'reply')
  })
  await ins
    .inject({ url: '/reply/redirect' })
    .then(({ statusCode, headers }) => {
      t.equal(headers.location, '/new-page')
      t.equal(statusCode, 302)
    })

  await ins
    .inject({
      url: '/reply/async'
    })
    .then(({ payload }) => {
      t.equal(payload, 'async')
    })
  await ins
    .inject({
      url: '/reply/sync'
    })
    .then(({ payload }) => {
      t.equal(payload, 'sync0')
    })
  await ins
    .inject({
      url: '/reply/empty'
    })
    .then(({ payload }) => {
      t.equal(payload, '')
    })

  await ins.close()
})

tap.test('reply: onRequest', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 6001 })

  t.plan(2)
  ins.register(async i1 => {
    i1.addHook('onRequest', async function (req, rep) {
      t.equal(req.url, '/reply/aaa')
      rep.end('onRequest')
    })
    i1.route({
      url: '/reply/aaa',
      handler (req, rep) {
        t.fail('assert')
      }
    })
  })

  await ins.ready()
  await ins.inject({ url: '/reply/aaa' }).then(({ payload }) => {
    t.equal(payload, 'onRequest')
  })
  await ins.close()
})

tap.test('reply: beforeSerializer', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 6002 })

  t.plan(2)
  ins.register(async i1 => {
    i1.addHook('beforeSerializer', async function (req, rep) {
      t.equal(req.url, '/reply/aaa')
      rep.end('beforeSerializer')
    })
    i1.route({
      method: 'POST',
      url: '/reply/aaa',
      handler (req, rep) {
        t.fail('assert')
      }
    })
  })

  await ins.ready()
  await ins
    .inject({ url: '/reply/aaa', method: 'POST' })
    .then(({ payload }) => {
      t.equal(payload, 'beforeSerializer')
    })
  await ins.close()
})

tap.test('reply: beforeHandler', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 6003 })

  t.plan(2)
  ins.register(async i1 => {
    i1.addHook('beforeHandler', async function (req, rep) {
      t.equal(req.url, '/reply/aaa')
      rep.end('beforeHandler')
    })
    i1.route({
      method: 'POST',
      url: '/reply/aaa',
      handler (req, rep) {
        t.fail('assert')
      }
    })
  })

  await ins.ready()
  await ins
    .inject({ url: '/reply/aaa', method: 'POST' })
    .then(({ payload }) => {
      t.equal(payload, 'beforeHandler')
    })
  await ins.close()
})

tap.test('reply: throw error', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 6004 })

  t.plan(3)
  ins.register(async i1 => {
    i1.addHook('beforeHandler', async function (req, rep) {
      t.equal(req.url, '/reply/aaa')
      throw new Error('error payload')
    })
    i1.route({
      method: 'POST',
      url: '/reply/aaa',
      handler (req, rep) {
        t.fail('assert')
      }
    })
  })

  await ins.ready()
  await ins
    .inject({ url: '/reply/aaa', method: 'POST' })
    .then(({ payload, statusCode }) => {
      t.equal(statusCode, 400)
      t.equal(payload, 'error payload')
    })
  await ins.close()
})

tap.test('reply: throw error', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 6005 })

  t.plan(4)
  ins.register(async i1 => {
    i1.addHook('beforeDeserializer', async function (req, rep) {
      t.equal(req.url, '/reply/aaa')
      const err = new Error('error payload1111')
      err.code = 401
      throw err
    })
    i1.route({
      method: 'POST',
      url: '/reply/aaa',
      async handler (req, rep) {
        t.ok(true)
        return { hello: 'world' }
      }
    })
  })

  await ins.ready()
  await ins
    .inject({ url: '/reply/aaa', method: 'POST' })
    .then(({ payload, statusCode }) => {
      t.equal(statusCode, 401)
      t.equal(payload, 'error payload1111')
    })
  await ins.close()
})
