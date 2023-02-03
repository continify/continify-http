const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')

tap.test('hook: onRoute', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 9100 })

  process.env.NODE_ENV = 'prod'
  t.plan(1)
  await ins.ready()
  ins.route({
    // $useInBeta: true,
    // $useInProd: true,
    url: '/aaa'
  })
  ins.route({
    $useInBeta: true,
    $useInProd: false,
    url: '/bbbb'
  })
  ins.route({
    $useInBeta: false,
    $useInProd: true,
    url: '/cccc'
  })
  ins.route({
    $useInBeta: false,
    $useInProd: false,
    url: '/dddd'
  })

  t.equal(ins.$router.routes.length, 1)
  await ins.close()
})
