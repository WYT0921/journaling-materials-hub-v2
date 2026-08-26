import { get } from './request'

export const getTextDecorationTemplates = category =>
  get('/text-decoration/templates', category && category !== 'all' ? { category } : undefined)

export const getRandomTextDecoration = params => get('/text-decoration/random', params)
