export function convertText(text, style) {
  const characters = [...String(text ?? '')]
  const source = style.reverse ? characters.reverse() : characters
  return source.map(character => style.map[character] || character).join('')
}

export function generateFontResults(text, styles) {
  if (!text) return []
  return styles.map(style => ({
    id: style.id,
    name: style.name,
    text: convertText(text, style)
  }))
}
