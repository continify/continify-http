import { Continify } from 'continify'
import { Request } from './request'
import { Reply } from './reply'

export type RouteMethod =
  | 'HEAD'
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'

export type RouteHandler = (
  this: Continify,
  req: Request,
  rep?: Reply
) => Promise<unknown> | void

export interface RouteOptions {
  $usePrefix?: boolean
  $useInBeta?: boolean
  $useInProd?: boolean

  url: string
  method?: RouteMethod
  handler: RouteHandler
}

export interface Route extends RouteOptions {
  $continify: Readonly<Continify>
}
