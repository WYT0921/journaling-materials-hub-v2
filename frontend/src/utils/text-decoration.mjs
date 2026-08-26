export function renderDecoration(template, sourceText) {
  const text = String(sourceText ?? '')
  if (!template || !text) return ''

  if (template.type === 'inline') {
    return `${template.prefix || ''}${text}${template.suffix || ''}`
  }
  if (template.type === 'multiline') {
    return String(template.template || '').replaceAll('{text}', text)
  }
  if (template.type === 'replace') {
    return Array.from(text).join(String(template.template || ''))
  }
  return text
}

export function chooseRandomTemplate(templates, previousId, random = Math.random) {
  const available = (templates || []).filter(item => item.enabled !== false)
  if (!available.length) return null
  const candidates = available.length > 1
    ? available.filter(item => item.id !== previousId)
    : available
  return candidates[Math.floor(random() * candidates.length)] || candidates[0]
}
