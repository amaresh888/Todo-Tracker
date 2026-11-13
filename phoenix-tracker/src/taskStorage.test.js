import { describe, expect, it } from 'vitest'
import { getStoredTasks, taskMatchesDate } from './taskStorage'

describe('taskStorage', () => {
  it('normalizes legacy task dates and still matches the saved due date', () => {
    const storedTasks = [
      {
        id: 1,
        title: 'Yesterday task',
        dueDate: '2026-11-12',
        userId: 'user@example.com',
        done: false,
      },
      {
        id: 2,
        title: 'Today task',
        date: '2026-11-13',
        userId: 'user@example.com',
        done: false,
      },
    ]

    const tasks = getStoredTasks(storedTasks)

    expect(tasks[0].date).toBe('2026-11-12')
    expect(tasks[0].dueDate).toBe('2026-11-12')
    expect(taskMatchesDate(tasks[0], '2026-11-12')).toBe(true)
    expect(taskMatchesDate(tasks[1], '2026-11-13')).toBe(true)
  })
})
