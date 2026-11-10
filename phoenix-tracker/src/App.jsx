import { useEffect, useMemo, useState } from 'react'
import './App.css'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createStarterTasks = () => {
  const today = new Date()
  const addDays = (amount) => {
    const date = new Date(today)
    date.setDate(today.getDate() + amount)
    return toDateKey(date)
  }

  return [
    { id: 1, text: 'Design review', done: true, tag: 'Work', date: toDateKey(today) },
    { id: 2, text: 'Reply to client notes', done: false, tag: 'Team', date: toDateKey(today) },
    { id: 3, text: 'Gym session', done: false, tag: 'Personal', date: addDays(1) },
    { id: 4, text: 'Read product brief', done: true, tag: 'Study', date: addDays(2) },
    { id: 5, text: 'Plan focus blocks', done: false, tag: 'Work', date: addDays(-1) },
  ]
}

const filterOptions = ['all', 'active', 'completed']

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('phoenix-todos')
    return saved ? JSON.parse(saved) : createStarterTasks()
  })
  const [taskText, setTaskText] = useState('')
  const [taskTag, setTaskTag] = useState('Personal')
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))

  useEffect(() => {
    localStorage.setItem('phoenix-todos', JSON.stringify(tasks))
  }, [tasks])

  const selectedDateTasks = useMemo(
    () => tasks.filter((task) => task.date === selectedDate),
    [selectedDate, tasks],
  )

  const visibleTasks = useMemo(() => {
    if (filter === 'active') {
      return selectedDateTasks.filter((task) => !task.done)
    }

    if (filter === 'completed') {
      return selectedDateTasks.filter((task) => task.done)
    }

    return selectedDateTasks
  }, [filter, selectedDateTasks])

  const monthlyDays = useMemo(() => {
    const baseDate = new Date(selectedDate + 'T00:00:00')
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const start = new Date(firstDay)
    start.setDate(start.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }, [selectedDate])

  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const selectedDayProgress = selectedDateTasks.length
    ? (selectedDateTasks.filter((task) => task.done).length / selectedDateTasks.length) * 100
    : 0

  const remainingCount = selectedDateTasks.filter((task) => !task.done).length
  const completedCount = selectedDateTasks.length - remainingCount

  const addTask = (event) => {
    event.preventDefault()
    const trimmedText = taskText.trim()
    if (!trimmedText) {
      return
    }

    setTasks((currentTasks) => [
      {
        id: Date.now(),
        text: trimmedText,
        done: false,
        tag: taskTag,
        date: selectedDate,
      },
      ...currentTasks,
    ])

    setTaskText('')
    setTaskTag('Personal')
  }

  const toggleTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    )
  }

  const deleteTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
  }

  const clearCompleted = () => {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.date !== selectedDate || !task.done),
    )
  }

  return (
    <main className="todo-app">
      <section className="todo-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark">P</span>
            <div>
              <p className="eyebrow">Planner</p>
              <h2>Phoenix</h2>
            </div>
          </div>

          <div className="calendar-card">
            <div className="calendar-header">
              <span>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>

            <div className="calendar-grid">
              {dayNames.map((day) => (
                <span key={day} className="weekday-pill">
                  {day}
                </span>
              ))}

              {monthlyDays.map((date) => {
                const key = toDateKey(date)
                const dayTasks = tasks.filter((task) => task.date === key)
                const isSelected = key === selectedDate
                const isCurrentMonth = date.getMonth() === new Date(`${selectedDate}T00:00:00`).getMonth()

                return (
                  <button
                    key={key}
                    type="button"
                    className={isSelected ? 'day-cell selected' : 'day-cell'}
                    data-current-month={isCurrentMonth}
                    onClick={() => setSelectedDate(key)}
                  >
                    <span className="day-number">{date.getDate()}</span>
                    {dayTasks.length > 0 && <span className="day-dot" aria-label={`${dayTasks.length} tasks`} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="focus-card">
            <p className="eyebrow">Daily progress</p>
            <h3>{selectedDateLabel}</h3>

            <div className="progress-summary">
              <span>{Math.round(selectedDayProgress)}%</span>
              <div className="progress-bar" aria-label="Task completion progress">
                <span style={{ width: `${selectedDayProgress}%` }} />
              </div>
            </div>

            <ul className="mini-stats">
              <li>
                <strong>{remainingCount}</strong>
                <span>Open</span>
              </li>
              <li>
                <strong>{completedCount}</strong>
                <span>Done</span>
              </li>
            </ul>
          </div>
        </aside>

        <section className="todo-panel">
          <header className="topbar">
            <div>
              <p className="eyebrow">Schedule</p>
              <h1>{selectedDateLabel}</h1>
            </div>

            <button
              type="button"
              className="ghost-button"
              onClick={clearCompleted}
              disabled={completedCount === 0}
            >
              Clear done
            </button>
          </header>

          <form className="task-form" onSubmit={addTask}>
            <input
              type="text"
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
              placeholder="Add a task for this day"
              aria-label="Add a new task"
            />

            <select
              value={taskTag}
              onChange={(event) => setTaskTag(event.target.value)}
              aria-label="Select a tag"
            >
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Team">Team</option>
              <option value="Study">Study</option>
            </select>

            <button type="submit" className="primary-button">
              Add task
            </button>
          </form>

          <div className="filters" role="tablist" aria-label="Todo filters">
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={filter === option ? 'filter-button active' : 'filter-button'}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <ul className="todo-list">
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task) => (
                <li key={task.id} className={task.done ? 'todo-item done' : 'todo-item'}>
                  <button
                    type="button"
                    className="checkbox"
                    onClick={() => toggleTask(task.id)}
                    aria-label={task.done ? `Mark ${task.text} as active` : `Mark ${task.text} as done`}
                  >
                    {task.done ? '✓' : ''}
                  </button>

                  <div className="task-copy">
                    <p>{task.text}</p>
                    <span className="tag">{task.tag}</span>
                  </div>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => deleteTask(task.id)}
                  >
                    Remove
                  </button>
                </li>
              ))
            ) : (
              <li className="empty-state">No tasks planned for this day yet.</li>
            )}
          </ul>
        </section>
      </section>
    </main>
  )
}

export default App
