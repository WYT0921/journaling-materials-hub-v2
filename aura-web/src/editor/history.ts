export class EditHistory<T> {
  private past: T[] = []
  private future: T[] = []

  constructor(private current: T, private readonly limit = 50) {}

  push(next: T) {
    this.past.push(clone(this.current))
    if (this.past.length > this.limit) this.past.shift()
    this.current = clone(next)
    this.future = []
  }

  undo(): T | undefined {
    const previous = this.past.pop()
    if (!previous) return undefined
    this.future.push(clone(this.current))
    this.current = clone(previous)
    return clone(previous)
  }

  redo(): T | undefined {
    const next = this.future.pop()
    if (!next) return undefined
    this.past.push(clone(this.current))
    this.current = clone(next)
    return clone(next)
  }

  get canUndo() { return this.past.length > 0 }
  get canRedo() { return this.future.length > 0 }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
