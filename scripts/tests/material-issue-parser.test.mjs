import test from 'node:test'
import assert from 'node:assert/strict'

import { extractIssueCandidates, resolveIssueCandidate } from '../lib/material-issue-parser.mjs'

test('extracts Arabic year and Chinese issue number', () => {
  assert.deepEqual(extractIssueCandidates('2026 第七期 / 灰紫色背景图'), [
    { issueYear: 2026, issueNumber: 7 }
  ])
})

test('extracts hyphenated Arabic issue number', () => {
  assert.deepEqual(extractIssueCandidates('2025-第21期-基础素材'), [
    { issueYear: 2025, issueNumber: 21 }
  ])
})

test('marks conflicting candidates for review', () => {
  const resolution = resolveIssueCandidate([
    { source: 'title', text: '2026 第七期' },
    { source: 'report', text: '2025 第六期' }
  ])

  assert.equal(resolution.confidence, 'conflict')
  assert.equal(resolution.issueYear, null)
  assert.equal(resolution.issueNumber, null)
})
