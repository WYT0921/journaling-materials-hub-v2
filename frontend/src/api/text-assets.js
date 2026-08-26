import { get } from './request'

export const getTextAssets = params => get('/text-assets', params)

export const getTextAssetCategories = type => get('/text-assets/categories', { type })
