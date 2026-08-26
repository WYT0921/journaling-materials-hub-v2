const copy = value => JSON.parse(JSON.stringify(value))

export const createHistory = (initialState, limit = 50) => {
  let entries = [copy(initialState)]
  let index = 0

  const current = () => copy(entries[index])

  const commit = state => {
    entries = entries.slice(0, index + 1)
    entries.push(copy(state))
    if (entries.length > limit + 1) {
      entries.shift()
    }
    index = entries.length - 1
    return current()
  }

  const undo = () => {
    if (index > 0) index -= 1
    return current()
  }

  const redo = () => {
    if (index < entries.length - 1) index += 1
    return current()
  }

  const reset = state => {
    entries = [copy(state)]
    index = 0
    return current()
  }

  return {
    current,
    commit,
    undo,
    redo,
    reset,
    canUndo: () => index > 0,
    canRedo: () => index < entries.length - 1
  }
}
