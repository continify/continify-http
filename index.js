const { createServer } = require('http')
const uuid = require('uuid')
const getValue = require('get-value')
const merge = require('lodash.merge')
const findMyWay = require('find-my-way')
const lightMyWay = require('light-my-request')
const ContinifyPlugin = require('continify-plugin')
const rawBody = require('raw-body')
const jsonParse = require('secure-json-parse')

const {
  kRoutePrefix,
  kRouteContinify,

  kRequestId,
  kRequestRaw,
  kRequestPayload,
  kRequestParams,
  kRequestQuery,
  kRequestRoute,
  kRequestContinify,

  kReplyId,
  kReplyRaw,
  kReplySent,
  kReplyRoute,
  kReplyContinify,
  kReplyPayload,
  kReplyRequest,

  kContinifySerializer,
  kContinifyDeserializer
} = require('./symbols')

function promisify (fn, ...args) {
  return new Promise((resolve, reject) => {
    try {
      let done = false
      const next = err => {
        if (done) return
        done = true

        if (err) reject(err)
        else resolve()
      }
      const res = fn(...args, next)
      if (res && typeof res.then === 'function') {
        res.then(() => next()).catch(next)
      }
    } catch (err) {
      reject(err)
    }
  })
}

function defaultRunHookPromise (name, req, rep) {
  return new Promise((resolve, reject) => {
    const next = err => {
      if (err) reject(err)
      else resolve()
    }
    this.runHook(name, req, rep, next)
  })
}

function defaultOnServerError (rep, err) {
  rep.$sent = true
  rep.$raw.statusCode = err.code || 400
  rep.$raw.end(err.message)
  rep.$continify.runHook('onError', err)
}

function defaultHandler (req, rep) {
  rep.statusCode = 404
  rep.end(`Powered By Continify: ${this.$version}`)
}

function defaultSerializer (contentType) {
  return async () => {
    throw new Error(`serializer not fond: [${contentType}]`)
  }
}

function defaultDeserializer (contentType) {
  return async () => {
    throw new Error(`deserializer not fond: [${contentType}]`)
  }
}

async function defaultJsonSerializer (req) {
  const { $serverOptions } = this
  const buf = await rawBody(req.$payload, { limit: $serverOptions.bodyLimit })
  req.$body = jsonParse(buf)
}

async function defaultPlainTextSerializer (req) {
  const buf = await rawBody(req.$payload)
  req.$body = buf.toString()
}

async function defaultJsonDeserializer (rep) {
  rep.$payload = JSON.stringify(rep.$payload)
}

async function defaultPlainTextDeserializer (rep) {
  rep.$payload = Buffer.from(rep.$payload).toString()
}

const routeProperties = {
  $continify: kRouteContinify
}

const requestProperties = {
  $id: kRequestId,
  $raw: kRequestRaw,
  $route: kRequestRoute,
  $continify: kRequestContinify
}

const replyProperties = {
  $id: kReplyId,
  $raw: kReplyRaw,
  $route: kReplyRoute,
  $continify: kReplyContinify
}

function Route (options, ins) {
  this.$useInBeta = true
  this.$useInProd = true
  this.method = 'GET'
  this.url = ''
  this.handler = defaultHandler

  merge(this, options)
  this[kRouteContinify] = ins
  this.handler = this.handler.bind(ins)
  this.method = this.method.toUpperCase()

  if (this.$usePrefix !== false) {
    const prefix = ins[kRoutePrefix]
    if (this.url === '') this.url = prefix
    else if (this.url.charAt(0) !== '/') this.url = `${prefix}/${this.url}`
    else this.url = `${prefix}${this.url}`
  }

  if (this.url.charAt(0) !== '/') {
    this.url = `/${this.url}`
  }
  // export properties
  Object.keys(routeProperties).forEach(name => {
    Object.defineProperty(this, name, {
      get () {
        return this[routeProperties[name]]
      }
    })
  })
}

function Request (id, raw, params, query, route, ins) {
  this[kRequestId] = id
  this[kRequestRaw] = raw
  this[kRequestRoute] = route
  this[kRequestContinify] = ins

  // export properties
  Object.keys(requestProperties).forEach(name => {
    Object.defineProperty(this, name, {
      get () {
        return this[requestProperties[name]]
      }
    })
  })

  this.$payload = raw
  this.$query = query
  this.$params = params
}

Object.defineProperties(Request.prototype, {
  url: {
    get () {
      return this.$raw.url
    }
  },
  method: {
    get () {
      return this.$raw.method
    }
  },
  $payload: {
    get () {
      return this[kRequestPayload]
    },
    set (val) {
      this[kRequestPayload] = val
    }
  },
  $headers: {
    get () {
      return this.$raw.headers
    }
  },
  $query: {
    get () {
      return this[kRequestQuery]
    },
    set (v) {
      this[kRequestQuery] = v
    }
  },
  $params: {
    get () {
      return this[kRequestParams]
    },
    set (v) {
      this[kRequestParams] = v
    }
  }
})

function Reply (id, raw, req, route, ins) {
  this[kReplyId] = id
  this[kReplyRaw] = raw
  this[kReplyRequest] = req
  this[kReplyRoute] = route
  this[kReplyContinify] = ins

  // export properties
  Object.keys(replyProperties).forEach(name => {
    Object.defineProperty(this, name, {
      get () {
        return this[replyProperties[name]]
      }
    })
  })

  this.$sent = false
  this.statusCode = 200
}

Object.defineProperties(Reply.prototype, {
  url: {
    get () {
      return this[kReplyRequest].url
    }
  },
  method: {
    get () {
      return this[kReplyRequest].method
    }
  },
  statusCode: {
    get () {
      return this.$raw.statusCode
    },
    set (val) {
      this.$raw.statusCode = val
    }
  },
  $sent: {
    get () {
      return this[kReplySent]
    },
    set (v) {
      this[kReplySent] = this[kReplySent] || !!v
    }
  },
  $payload: {
    get () {
      return this[kReplyPayload]
    },
    set (v) {
      this[kReplyPayload] = v
    }
  }
})

Reply.prototype.code = function (statusCode) {
  this.statusCode = statusCode
  return this
}

Reply.prototype.type = function (contentType) {
  this.$raw.setHeader('content-type', contentType)
  return this
}

Reply.prototype.redirect = function (url) {
  this.code(302)
  this.setHeader('location', url)
  this.end()
}

Reply.prototype.setHeader = function (name, value) {
  this.$raw.setHeader(name, value)
}

Reply.prototype.getHeader = function (name) {
  return this.$raw.getHeader(name)
}

Reply.prototype.getHeaders = function () {
  return this.$raw.getHeaders()
}

Reply.prototype.getHeaderNames = function () {
  return this.$raw.getHeaderNames()
}

Reply.prototype.hasHeader = function (name) {
  return this.$raw.hasHeader(name)
}

Reply.prototype.removeHeader = function (name) {
  return this.$raw.removeHeader(name)
}

Reply.prototype.send = function (data) {
  if (this.$sent) return
  this.$sent = true

  this.$payload = data
  const { $continify } = this

  defaultRunHookPromise
    .call($continify, 'beforeDeserializer', this[kReplyRequest], this)
    .then(async () => {
      let cType = this.getHeader('content-type')
      if (cType === undefined) {
        if (typeof this.$payload === 'string') cType = 'text/plain'
        else cType = 'application/json'
      }

      const deserializer = $continify[kContinifyDeserializer]
      const fn = deserializer[cType] || defaultDeserializer(cType)

      await promisify(fn.bind($continify), this)
      // if (typeof this.$payload.pipe === 'function') {
      //   this.$payload.pipe(this.$raw)
      // }

      const cLength = Buffer.byteLength(this.$payload || '')
      this.setHeader('content-type', cType)
      this.setHeader('content-length', cLength || '0')

      this.$raw.end(this.$payload)
    })
    .catch(err => defaultOnServerError(this, err))
    .finally(() => {
      const msg = `http request complete ${this.$id}:[${this.method}] ${this.url}`
      $continify.$log.info(msg)
    })
}

Reply.prototype.end = Reply.prototype.send

module.exports = ContinifyPlugin(
  async function (ins, options) {
    const { $options } = ins
    const envOption = getValue($options, 'server', {
      default: {}
    })
    const httpOption = merge(options, envOption)
    httpOption.defaultRoute = defaultHandler.bind(ins)

    const serializer = {}
    const deserializer = {}
    const router = findMyWay(httpOption)

    function dispatch (req, rep) {
      router.lookup(req, rep)
    }

    function inject (options) {
      return lightMyWay(dispatch, options)
    }

    async function handler (req, rep, route) {
      const msg = `http request incoming ${req.$id}:[${req.method}] ${req.url}`
      this.$log.info(msg)
      await defaultRunHookPromise.call(this, 'onRequest', req, rep)
      if (rep.$sent) return

      const hasBodyMethods = ['POST', 'PUT', 'PATCH']
      if (hasBodyMethods.includes(req.method)) {
        await defaultRunHookPromise.call(this, 'beforeSerializer', req, rep)
        if (rep.$sent) return

        const headers = req.$headers
        const cType = (headers['content-type'] || '').split(';')[0]
        const hasPayload = (headers['content-length'] || '0') !== '0'
        if (hasPayload) {
          const fn = serializer[cType] || defaultSerializer(cType)
          await promisify(fn.bind(this), req)
        }
      }

      await defaultRunHookPromise.call(this, 'beforeHandler', req, rep)
      if (rep.$sent) return

      const res = await route.handler(req, rep)
      if (res && !rep.$sent) rep.send(res)
    }

    function wrap (reqRaw, repRaw, params, route, query) {
      const id = uuid.v4()
      const req = new Request(id, reqRaw, params, query, route, this)
      const rep = new Reply(id, repRaw, req, route, this)

      handler
        .call(this, req, rep, route)
        .catch(err => defaultOnServerError(rep, err))
    }

    function route (options) {
      const rt = new Route(options, this)

      if (this.isBeta() && !rt.$useInBeta) {
        this.$log.warn(`use beta mode; skip path:[${rt.method}] ${rt.url}`)
        return this
      }

      if (this.isProd() && !(rt.$useInBeta && rt.$useInProd)) {
        this.$log.warn(`use prod mode; skip path:[${rt.method}] ${rt.url}`)
        return this
      }

      router.on(rt.method, rt.url, wrap.bind(this), rt)
      this.runHook('onRoute', rt)
      this.$log.info(`http service path:[${rt.method}] ${rt.url}`)
      return this
    }

    function addSerializer (contentType, fn) {
      serializer[contentType] = fn.bind(this)
      return this
    }

    function removeSerializer (contentType) {
      delete serializer[contentType]
      return this
    }

    function addDeserializer (contentType, fn) {
      deserializer[contentType] = fn.bind(this)
      return this
    }

    function removeDeserializer (contentType) {
      delete deserializer[contentType]
      return this
    }

    ins[kRoutePrefix] = httpOption.routePrefix
    ins.decorate('route', route.bind(ins))
    ins.decorate('inject', inject.bind(ins))
    ins.addHook('onRegister', async function (nIns) {
      const prefix = nIns[kRoutePrefix]
      nIns[kRoutePrefix] = `${prefix}/${nIns.$name}`
      nIns.decorate('route', route.bind(nIns))
    })

    ins.decorate('addSerializer', addSerializer.bind(ins))
    ins.decorate('removeSerializer', removeSerializer.bind(ins))
    ins.addSerializer('application/json', defaultJsonSerializer)
    ins.addSerializer('text/plain', defaultPlainTextSerializer)

    ins.decorate('addDeserializer', addDeserializer.bind(ins))
    ins.decorate('removeDeserializer', removeDeserializer.bind(ins))
    ins.addDeserializer('application/json', defaultJsonDeserializer)
    ins.addDeserializer('text/plain', defaultPlainTextDeserializer)

    const server = createServer(httpOption, dispatch)
    server.setTimeout(httpOption.connectionTimeout)
    if (httpOption.maxRequestsPerSocket > 0) {
      server.maxRequestsPerSocket = httpOption.maxRequestsPerSocket
    }

    ins.addHook('onClose', async function () {
      ins.$log.info('http server closing')
      server.close()
    })

    ins.$avvio._readyQ.unshift(() => {
      ins.$avvio._readyQ.pause()
      server.listen(httpOption.port, httpOption.host, () => {
        const { address, port } = server.address()
        ins.$log.info(`http server listening at http://${address}:${port}/`)
        ins.$avvio._readyQ.resume()
      })
    })

    ins[kContinifySerializer] = serializer
    ins[kContinifyDeserializer] = deserializer
    ins.decorate('$server', server)
    ins.decorate('$router', router)
    ins.decorate('$serverOptions', httpOption)
  },
  {
    host: '127.0.0.1',
    port: 3000,
    keepAliveTimeout: 72000,
    requestTimeout: 0,
    maxRequestsPerSocket: 0,
    connectionTimeout: 0,
    routePrefix: '',
    bodyLimit: '1mb',
    continify: '>=0.1.11'
  }
)
