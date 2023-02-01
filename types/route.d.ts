import { Continify } from 'continify'
import { Request } from './request'
import { Reply } from './reply'

export type RouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type RouteHandler = (
  this: Continify,
  req: Request,
  rep?: Reply
) => Promise<unknown> | void

export interface RouteOptions {
  $usePrefix?: boolean

  url: string
  method?: RouteMethod
  handler: RouteHandler
}

export interface Route extends RouteOptions {
  $continify: Readonly<Continify>
}
