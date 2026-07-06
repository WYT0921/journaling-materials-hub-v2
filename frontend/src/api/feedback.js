/**
 * 反馈建议 API
 */
import { post } from './request'

export const submitFeedback = (content) => {
  return post('/feedback', { content })
}
