const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('server', async t => {
  const ins = Continify({ server: { port: 5100 } })

  t.plan(3)

  ins.register(async i1 => {
    t.ok(!i1.hasDecorator('$server')) // plugin not register
  })
  ins.register(ContinifyHTTP)
  ins.register(async i2 => {
    t.ok(i2.hasDecorator('$server')) // plugin register
  })

  await ins.ready()
  t.ok(ins.hasDecorator('$server'))
  await ins.close()
})

tap.test('server: option override', async t => {
  const host = '0.0.0.0'
  const port = 5101
  const ins = Continify({
    server: {
      port
    }
  })
  ins.register(ContinifyHTTP, {
    host
  })

  t.plan(2)
  await ins.ready()
  const addr = ins.$server.address()
  t.equal(addr.address, host)
  t.equal(addr.port, port)
  await ins.close()
})

tap.test('server: maxRequestsPerSocket', async t => {
  const maxRequestsPerSocket = 100
  const ins = Continify()
  ins.register(ContinifyHTTP, { maxRequestsPerSocket, port: 5102 })

  t.plan(2)
  await ins.ready()
  t.ok(ins.hasDecorator('$server'))
  t.equal(ins.$server.maxRequestsPerSocket, maxRequestsPerSocket)
  await ins.close()
})
