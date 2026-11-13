export const STORAGE_KEYS = {
  tasks: 'phoenix-todos',
  currentUser: 'phoenix-current-user',
}

export const todayKey = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const normalizeTask = (task, fallbackDate = todayKey()) => {
  const normalizedDate = task.date || task.dueDate || fallbackDate
  const normalizedDueDate = task.dueDate || normalizedDate

  return {
    ...task,
    title: task.title || task.text || 'Untitled task',
    description: task.description || '',
    dueDate: normalizedDueDate,
    priority: task.priority || 'Medium',
    category: task.category || 'General',
    date: normalizedDate,
  }
}

export const taskMatchesDate = (task, dateKey) => {
  if (!task || !dateKey) {
    return false
  }

  return task.date === dateKey || task.dueDate === dateKey
}

export const getStoredTasks = (rawTasks) => {
  if (rawTasks !== undefined) {
    if (!Array.isArray(rawTasks)) {
      return []
    }

    return rawTasks.map((task) => normalizeTask(task))
  }

  if (typeof localStorage === 'undefined') {
    return []
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.tasks)
    const parsed = saved ? JSON.parse(saved) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((task) => normalizeTask(task))
  } catch {
    return []
  }
}
