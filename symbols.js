module.exports = {
  kRoutePrefix: Symbol('route.prefix'),
  kRouteContinify: Symbol('route.continify'),

  kRequestId: Symbol('request.id'),
  kRequestRaw: Symbol('request.raw'),
  kRequestPayload: Symbol('request.payload'),
  kRequestParams: Symbol('request.params'),
  kRequestQuery: Symbol('request.query'),
  kRequestRoute: Symbol('request.route'),
  kRequestContinify: Symbol('request.continify'),

  kReplyId: Symbol('reply.id'),
  kReplyRequest: Symbol('reply.request'),
  kReplyRaw: Symbol('reply.raw'),
  kReplyRoute: Symbol('reply.route'),
  kReplyContinify: Symbol('reply.continify'),
  kReplySent: Symbol('reply.sent'),
  kReplyPayload: Symbol('reply.payload'),

  kContinifySerializer: Symbol('continify.serializer'),
  kContinifyDeserializer: Symbol('continify.deserializer')
}
