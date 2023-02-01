const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('router', async t => {
  const ins = Continify()
  t.plan(3)

  ins.register(async i1 => {
    t.ok(!i1.hasDecorator('$router'))
  })
  ins.register(ContinifyHTTP, { port: 3001 })
  ins.register(async i2 => {
    t.ok(i2.hasDecorator('$router'))
  })

  await ins.ready()
  t.ok(ins.hasDecorator('$router'))
  await ins.close()
})

tap.test('router: add route', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 3002 })
  ins.register(async i1 => {
    i1.route({
      // method: 'GET',
      url: '/hello-world'
    })
  })

  t.plan(4)
  await ins.ready()
  const { store } = ins.$router.find('GET', '/hello-world')
  t.equal(ins.$router.routes.length, 1)
  t.equal(store.method, 'GET')
  t.equal(store.url, '/hello-world')
  t.equal(store.$continify, ins)
  await ins.close()
})

tap.test('router: url format', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 3003, routePrefix: 'global' })
  ins.register(async i1 => {
    i1.route({
      // method: 'GET', default
      url: 'aaa'
    })

    i1.route({
      // method: 'POST',
      // url: '/bbb'
    })

    i1.route({
      method: 'POST',
      url: '/bbb'
    })

    i1.route({
      $usePrefix: false,
      // method: 'GET', default
      url: '/ccc'
    })
  })
  ins.register(
    async i2 => {
      i2.route({
        url: 'ddd'
      })
    },
    { name: 'i2' }
  )

  t.plan(6)
  await ins.ready()
  t.equal(ins.$router.routes.length, 5)
  t.ok(ins.$router.find('GET', '/global/aaa'))
  t.ok(ins.$router.find('GET', '/global'))
  t.ok(ins.$router.find('POST', '/global/bbb'))
  t.ok(ins.$router.find('GET', '/ccc'))
  t.ok(ins.$router.find('GET', '/global/i2/ddd'))
  await ins.close()
})

tap.test('router: duplicate route', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 3004 })
  ins.register(async i1 => {
    i1.route({
      // method: 'GET', default
      url: 'aaa'
    })
    i1.route({
      // method: 'GET', default
      url: 'aaa'
    })
  })

  t.plan(1)
  const hasError = await ins
    .ready()
    .then(() => false)
    .catch(() => true)
  t.ok(hasError)
  await ins.close()
})
