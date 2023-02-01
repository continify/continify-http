const tap = require('tap')
const Continify = require('continify')
const ContinifyHTTP = require('..')
const { default: AXIOS } = require('axios')

tap.test('axios: get method', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 9000 })

  t.plan(6)
  ins.register(async i1 => {
    i1.route({
      method: 'GET',
      url: '/axios/get',
      handler (req, rep) {
        t.equal(req.$body, undefined)
        t.equal(req.$query.q1, '1')
        t.equal(req.$query.q2, 'ggg')
        rep.send('get method')
      }
    })
  })

  await ins.ready()
  const getRes = await AXIOS.get('http://127.0.0.1:9000/axios/get?q1=1&q2=ggg')
  t.equal(getRes.status, 200)
  t.equal(getRes.headers['content-type'], 'text/plain')
  t.equal(getRes.data, 'get method')
  await ins.close()
})

tap.test('axios: post method', async t => {
  const ins = Continify()
  ins.register(ContinifyHTTP, { port: 9001 })

  t.plan(7)
  ins.register(async i1 => {
    i1.route({
      method: 'POST',
      url: '/axios/post',
      handler (req, rep) {
        t.equal(req.$body.b1, 1)
        t.equal(req.$body.b2, 'ccc')
        t.equal(req.$query.q1, '1')
        t.equal(req.$query.q2, 'ggg')
        rep.send({ method: 'post' })
      }
    })
  })

  await ins.ready()
  const getRes = await AXIOS.post(
    'http://127.0.0.1:9001/axios/post?q1=1&q2=ggg',
    { b1: 1, b2: 'ccc' }
  )
  t.equal(getRes.status, 200)
  t.equal(getRes.headers['content-type'], 'application/json')
  t.equal(getRes.data.method, 'post')
  await ins.close()
})
