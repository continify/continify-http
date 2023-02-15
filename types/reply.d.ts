import { OutgoingMessage, OutgoingHttpHeaders } from 'http'
import { Continify } from 'continify'
import { Route } from './route'
import { Request } from './request'

export interface Reply {
  $id: Readonly<string>
  $raw: Readonly<OutgoingMessage>
  $route: Readonly<Route>
  $continify: Readonly<Continify>

  $sent: boolean
  $payload?: unknown

  url: string
  method: string
  statusCode: number

  code(statusCode: number): Reply
  type(contentType: string): Reply
  redirect(url: string): void
  setHeader(name: string, value: number | string | ReadonlyArray<string>): Reply
  getHeader(name: string): number | string | string[] | undefined
  getHeaders(): OutgoingHttpHeaders
  getHeaderNames(): string[]
  hasHeader(name: string): boolean
  removeHeader(name: string): void

  error(errCode: number, message: string, statusCode?: number): void
  send(data: unknown): void
  end(data: unknown): void
}
