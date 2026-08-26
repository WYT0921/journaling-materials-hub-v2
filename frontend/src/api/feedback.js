/**
 * 反馈建议 API
 */
import { get, post } from './request'

export const submitFeedback = (content) => {
  return post('/feedback', { content })
}

export const getMyFeedbacks = () => get('/feedback/my')
