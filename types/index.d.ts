import { Continify, HookCallbackDone } from 'continify'
import { Server, ServerOptions } from 'http'
import * as FMW from 'find-my-way'
import * as LMQ from 'light-my-request'
import { RouteOptions, Route } from './route'
import { Request } from './request'
import { Reply } from './reply'

export interface ContinifyHTTPOptions
  extends FMW.Config<FMW.HTTPVersion.V1>,
    ServerOptions {
  host?: string
  port?: number
  bodyLimit?: number
  maxRequestsPerSocket?: number
  connectionTimeout?: number
  routePrefix?: string
}

export type ContinifyHTTPPlugin = (
  ins: Continify,
  options: ContinifyHTTPOptions
) => Promise<void>

export type SerializerCallback = (
  this: Continify,
  req: Request,
  done: HookCallbackDone
) => Promise<void> | void

export type DeserializerCallback = (
  this: Continify,
  rep: Reply,
  done: HookCallbackDone
) => Promise<void> | void

export type OnRouteHook = (
  this: Continify,
  route: Route,
  done?: HookCallbackDone
) => Promise<void> | void

export type OnRequestHook = (
  this: Continify,
  req: Request,
  rep: Reply,
  done?: HookCallbackDone
) => Promise<void> | void

export type OnBeforeSerializerHook = (
  this: Continify,
  req: Request,
  rep: Reply,
  done?: HookCallbackDone
) => Promise<void> | void

export type OnBeforeHandlerHook = (
  this: Continify,
  req: Request,
  rep: Reply,
  done?: HookCallbackDone
) => Promise<void> | void

export type OnBeforeDeserializerHook = (
  this: Continify,
  req: Request,
  rep: Reply,
  done?: HookCallbackDone
) => Promise<void> | void

export type OnServerErrorHook = (
  this: Continify,
  rep: Reply,
  err: Error,
  done?: HookCallbackDone
) => Promise<void> | void

declare const plugin: ContinifyHTTPPlugin
export = plugin
export * from './route'
export * from './request'
export * from './reply'

declare module 'avvio' {
  interface Use<I, C = context<I>> {
    (fn: ContinifyHTTPPlugin, options?: ContinifyHTTPOptions): C
  }
}

declare module 'continify' {
  interface ContinifyOptions {
    server?: ContinifyHTTPOptions
  }

  interface Continify {
    $serverOptions: ContinifyHTTPOptions
    $server: Server
    $router: FMW.Instance<FMW.HTTPVersion.V1>

    route(options: RouteOptions): Continify
    inject(options: LMQ.InjectOptions): Promise<LMQ.Response>

    addSerializer(contentType: string, fn: SerializerCallback): Continify
    removeSerializer(contentType: string): Continify

    addDeserializer(contentType: string, fn: DeserializerCallback): Continify
    removeDeserializer(contentType: string): Continify

    addHook(name: 'onRoute', fn: OnRouteHook): Continify
    addHook(name: 'onRequest', fn: OnRequestHook): Continify
    // set req.$payload
    addHook(name: 'beforeSerializer', fn: OnBeforeSerializerHook): Continify
    addHook(name: 'beforeHandler', fn: OnBeforeHandlerHook): Continify
    addHook(name: 'beforeDeserializer', fn: OnBeforeDeserializerHook): Continify

    runHook(name: 'onRoute', route: Route): Continify
    runHook(name: 'onRequest', req: Request, rep: Reply): Continify
    runHook(name: 'beforeSerializer', req: Request, rep: Reply): Continify
    runHook(name: 'beforeHandler', req: Request, rep: Reply): Continify
    runHook(name: 'beforeDeserializer', req: Request, rep: Reply): Continify
  }
}
