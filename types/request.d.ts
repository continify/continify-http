import * as stream from 'node:stream'
import { IncomingMessage } from 'http'
import { Continify } from 'continify'
import { Route, RouteMethod } from './route'

export interface Request {
  $id: Readonly<string>
  $raw: Readonly<IncomingMessage>
  $route: Readonly<Route>
  $continify: Readonly<Continify>

  url: string
  method: RouteMethod

  $headers: Readonly<Record<string, unknown>>

  $payload: stream.Readable
  $params: Record<string, unknown>
  $query: Record<string, unknown>
  $body?: Record<string, unknown>
}
