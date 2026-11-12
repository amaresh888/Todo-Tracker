import { useEffect, useMemo, useState } from 'react'
import {
  AlarmClockCheck,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Inbox,
  ListTodo,
  LogOut,
  Pencil,
  Play,
  Plus,
  Search,
  Settings,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import './App.css'

const STORAGE_KEYS = {
  tasks: 'phoenix-todos',
  currentUser: 'phoenix-current-user',
}

const navItems = [
  { label: 'Overview', icon: Inbox },
  { label: 'My Tasks', icon: ListTodo },
  { label: 'Today', icon: CalendarDays },
  { label: 'Upcoming', icon: AlarmClockCheck },
  { label: 'Completed', icon: CheckCheck },
  { label: 'Settings', icon: Settings },
]

const priorityOptions = ['High', 'Medium', 'Low']
const categoryOptions = ['General', 'Work', 'Personal', 'Study', 'Health']

const todayKey = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStoredUser = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.currentUser)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const getStoredTasks = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.tasks)
    const parsed = saved ? JSON.parse(saved) : []
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((task) => ({
      ...task,
      title: task.title || task.text || 'Untitled task',
      description: task.description || '',
      dueDate: task.dueDate || task.date || todayKey(),
      priority: task.priority || 'Medium',
      category: task.category || 'General',
      date: task.date || task.dueDate || todayKey(),
    }))
  } catch {
    return []
  }
}

const getDefaultTaskForm = (selectedDate) => ({
  title: '',
  description: '',
  dueDate: selectedDate || todayKey(),
  priority: 'Medium',
  category: 'General',
})

const formatDateLabel = (dateValue) => {
  if (!dateValue) {
    return 'No due date'
  }

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const isTaskOverdue = (task) => {
  if (!task.dueDate || task.done) {
    return false
  }

  const today = new Date(`${todayKey()}T00:00:00`)
  const due = new Date(`${task.dueDate}T00:00:00`)
  return due < today
}

const formatDuration = (totalMilliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(totalMilliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
  }

  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
}

const getTaskElapsedMs = (task, now = Date.now()) => {
  const baseMs = Number(task.elapsedMs || 0)

  if (!task.timerStartedAt) {
    return baseMs
  }

  const startedAt = new Date(task.timerStartedAt).getTime()
  return baseMs + Math.max(0, now - startedAt)
}

function App() {
  const [tasks, setTasks] = useState(() => getStoredTasks())
  const [currentUser, setCurrentUser] = useState(() => getStoredUser())
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [searchQuery, setSearchQuery] = useState('')
  const [taskFilter, setTaskFilter] = useState('all')
  const [activeNav, setActiveNav] = useState('My Tasks')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [taskForm, setTaskForm] = useState(getDefaultTaskForm(todayKey()))
  const [loginForm, setLoginForm] = useState({ name: '', email: '' })
  const [loginError, setLoginError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser)
    }
  }, [currentUser])

  const currentUserTasks = useMemo(
    () => tasks.filter((task) => task.userId === currentUser?.id),
    [currentUser, tasks],
  )

  const selectedDateTasks = useMemo(
    () => currentUserTasks.filter((task) => task.date === selectedDate),
    [currentUserTasks, selectedDate],
  )

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return selectedDateTasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery)

      if (taskFilter === 'pending') {
        return matchesQuery && !task.done
      }

      if (taskFilter === 'completed') {
        return matchesQuery && task.done
      }

      return matchesQuery
    })
  }, [searchQuery, selectedDateTasks, taskFilter])

  const monthlyDays = useMemo(() => {
    const baseDate = new Date(`${selectedDate}T00:00:00`)
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const start = new Date(firstDay)
    start.setDate(start.getDate() - firstDay.getDay())

    const days = []
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      days.push(date)
    }

    return days
  }, [selectedDate])

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const totalTasks = selectedDateTasks.length
  const completedTasks = selectedDateTasks.filter((task) => task.done).length
  const pendingTasks = selectedDateTasks.filter((task) => !task.done).length
  const overdueTasks = selectedDateTasks.filter((task) => isTaskOverdue(task)).length

  const selectedDayProgress = selectedDateTasks.length
    ? (selectedDateTasks.filter((task) => task.done).length / selectedDateTasks.length) * 100
    : 0

  const handleNavClick = (label) => {
    setActiveNav(label)

    if (label === 'Today') {
      setSelectedDate(todayKey())
      setTaskFilter('all')
      return
    }

    if (label === 'Completed') {
      setTaskFilter('completed')
      return
    }

    if (label === 'Upcoming') {
      setTaskFilter('pending')
      return
    }

    setTaskFilter('all')
  }

  const openCreateModal = () => {
    setEditingTaskId(null)
    setTaskForm(getDefaultTaskForm(selectedDate))
    setIsModalOpen(true)
  }

  const openEditModal = (task) => {
    setEditingTaskId(task.id)
    setTaskForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate || selectedDate,
      priority: task.priority,
      category: task.category,
    })
    setIsModalOpen(true)
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const name = loginForm.name.trim()
    const email = loginForm.email.trim()

    if (!name || !email) {
      setLoginError('Please enter both your name and email.')
      return
    }

    setCurrentUser({ id: email.toLowerCase(), name })
    setLoginError('')
    setLoginForm({ name: '', email: '' })
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setTaskFilter('all')
    setSearchQuery('')
    setSelectedDate(todayKey())
  }

  const handleTaskSave = (event) => {
    event.preventDefault()

    const title = taskForm.title.trim()
    if (!title) {
      return
    }

    const normalizedDate = taskForm.dueDate || selectedDate

    if (editingTaskId) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                description: taskForm.description.trim(),
                dueDate: normalizedDate,
                priority: taskForm.priority,
                category: taskForm.category,
                date: normalizedDate,
              }
            : task,
        ),
      )
    } else {
      setTasks((currentTasks) => [
        {
          id: Date.now(),
          title,
          description: taskForm.description.trim(),
          dueDate: normalizedDate,
          priority: taskForm.priority,
          category: taskForm.category,
          date: normalizedDate,
          done: false,
          userId: currentUser.id,
        },
        ...currentTasks,
      ])
    }

    setIsModalOpen(false)
    setEditingTaskId(null)
    setTaskForm(getDefaultTaskForm(selectedDate))
  }

  const startTaskTimer = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId || task.done) {
          return task
        }

        return {
          ...task,
          timerStartedAt: new Date().toISOString(),
          timerStoppedAt: null,
        }
      }),
    )
  }

  const stopTaskTimer = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId || !task.timerStartedAt) {
          return task
        }

        const startedAt = new Date(task.timerStartedAt).getTime()
        const nextElapsedMs = Number(task.elapsedMs || 0) + (Date.now() - startedAt)

        return {
          ...task,
          elapsedMs: nextElapsedMs,
          timerStartedAt: null,
          timerStoppedAt: new Date().toISOString(),
        }
      }),
    )
  }

  const toggleTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const nextDone = !task.done

        if (nextDone && task.timerStartedAt) {
          const startedAt = new Date(task.timerStartedAt).getTime()
          const nextElapsedMs = Number(task.elapsedMs || 0) + (Date.now() - startedAt)

          return {
            ...task,
            done: true,
            elapsedMs: nextElapsedMs,
            timerStartedAt: null,
            timerStoppedAt: new Date().toISOString(),
          }
        }

        return {
          ...task,
          done: nextDone,
          timerStartedAt: nextDone ? null : task.timerStartedAt,
          timerStoppedAt: nextDone ? new Date().toISOString() : task.timerStoppedAt,
        }
      }),
    )
  }

  const deleteTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
  }

  const clearCompleted = () => {
    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.userId !== currentUser.id || task.date !== selectedDate || !task.done,
      ),
    )
  }

  if (!currentUser) {
    return (
      <main className='auth-layout'>
        <section className='auth-card'>
          <div className='auth-badge'>TASKFLOW</div>
          <h1>Welcome back</h1>
          <p>Sign in with your email to keep your personal workspace private and perfectly organized.</p>

          <form onSubmit={handleLogin} className='auth-form'>
            <label>
              <span>Name</span>
              <input
                type='text'
                value={loginForm.name}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder='Enter your name'
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type='email'
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder='you@example.com'
              />
            </label>

            {loginError && <small className='auth-error'>{loginError}</small>}

            <button type='submit' className='primary-button auth-button'>
              Continue
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className='dashboard-app'>
      <div className='dashboard-shell'>
        <aside className='sidebar'>
          <div className='brand-block'>
            <div className='brand-mark'>T</div>
            <div>
              <p className='eyebrow'>Workspace</p>
              <h2>TASKFLOW</h2>
            </div>
          </div>

          <nav className='sidebar-nav' aria-label='Main navigation'>
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type='button'
                className={activeNav === label ? 'nav-item active' : 'nav-item'}
                onClick={() => handleNavClick(label)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className='sidebar-card mini-profile'>
            <p className='eyebrow'>Account</p>
            <h3>{currentUser.name}</h3>
            <span>{currentUser.id}</span>
            <button type='button' className='logout-button' onClick={handleLogout}>
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </aside>

        <section className='main-panel'>
          <header className='topbar'>
            <div>
              <p className='eyebrow'>Dashboard</p>
              <h1>Good evening!</h1>
              <p className='subtitle'>Let’s make today productive.</p>
            </div>

            <div className='header-actions'>
              <div className='date-pill'>{todayLabel}</div>
              <button type='button' className='primary-button' onClick={openCreateModal}>
                <Plus size={16} />
                Add Task
              </button>
            </div>
          </header>

          <section className='stats-grid' aria-label='Task statistics'>
            <article className='stat-card'>
              <div className='stat-icon total'>
                <ListTodo size={18} />
              </div>
              <div>
                <span>Total Tasks</span>
                <strong>{totalTasks}</strong>
              </div>
            </article>

            <article className='stat-card'>
              <div className='stat-icon complete'>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span>Completed</span>
                <strong>{completedTasks}</strong>
              </div>
            </article>

            <article className='stat-card'>
              <div className='stat-icon pending'>
                <CircleDashed size={18} />
              </div>
              <div>
                <span>Pending</span>
                <strong>{pendingTasks}</strong>
              </div>
            </article>

            <article className='stat-card'>
              <div className='stat-icon overdue'>
                <AlarmClockCheck size={18} />
              </div>
              <div>
                <span>Overdue</span>
                <strong>{overdueTasks}</strong>
              </div>
            </article>
          </section>

          <section className='content-panel'>
            <div className='content-header'>
              <div>
                <p className='eyebrow'>My Tasks</p>
                <h2>{selectedDate === todayKey() ? 'Today’s focus' : 'Selected day'}</h2>
              </div>

              <div className='task-controls'>
                <label className='searchbox' aria-label='Search tasks'>
                  <Search size={16} />
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder='Search tasks'
                  />
                </label>

                <button type='button' className='ghost-button' onClick={openCreateModal}>
                  <Plus size={16} />
                  New Task
                </button>
              </div>
            </div>

            <div className='task-toolbar'>
              <div className='tab-strip' role='tablist' aria-label='Task filter tabs'>
                {['all', 'pending', 'completed'].map((filterValue) => (
                  <button
                    key={filterValue}
                    type='button'
                    className={taskFilter === filterValue ? 'tab-button active' : 'tab-button'}
                    onClick={() => setTaskFilter(filterValue)}
                  >
                    {filterValue}
                  </button>
                ))}
              </div>

              <button type='button' className='ghost-button small' onClick={clearCompleted}>
                Clear done
              </button>
            </div>

            <div className='calendar-panel'>
              <div className='calendar-header-row'>
                <span>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>

              <div className='calendar-grid'>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <span key={day} className='weekday-pill'>
                    {day}
                  </span>
                ))}

                {monthlyDays.map((date) => {
                  const key = toDateKey(date)
                  const dateTasks = currentUserTasks.filter((task) => task.date === key)
                  const isSelected = key === selectedDate
                  const isCurrentMonth = date.getMonth() === new Date(`${selectedDate}T00:00:00`).getMonth()

                  return (
                    <button
                      key={key}
                      type='button'
                      className={isSelected ? 'day-cell selected' : 'day-cell'}
                      data-current-month={isCurrentMonth}
                      onClick={() => setSelectedDate(key)}
                    >
                      <span>{date.getDate()}</span>
                      {dateTasks.length > 0 && <span className='calendar-dot' aria-label={`${dateTasks.length} tasks`} />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className='progress-card'>
              <div>
                <p className='eyebrow'>Daily Progress</p>
                <h3>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
              </div>
              <div className='progress-readout'>
                <strong>{Math.round(selectedDayProgress)}%</strong>
                <div className='progress-line' aria-label='Selected day progress'>
                  <span style={{ width: `${selectedDayProgress}%` }} />
                </div>
              </div>
            </div>

            <div className='task-list-wrap'>
              {filteredTasks.length > 0 ? (
                <ul className='task-list'>
                  {filteredTasks.map((task) => (
                    <li key={task.id} className={task.done ? 'task-item done' : 'task-item'}>
                      <button
                        type='button'
                        className={task.done ? 'check-toggle checked' : 'check-toggle'}
                        onClick={() => toggleTask(task.id)}
                        aria-label={task.done ? `Mark ${task.title} as pending` : `Mark ${task.title} as complete`}
                      >
                        {task.done ? <Check size={14} /> : null}
                      </button>

                      <div className='task-copy'>
                        <div className='title-row'>
                          <h3>{task.title}</h3>
                          <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>

                        {task.description && <p>{task.description}</p>}

                        <div className='task-meta'>
                          <span className='meta-pill'>
                            <CalendarDays size={12} />
                            {formatDateLabel(task.dueDate)}
                          </span>
                          <span className='meta-pill muted'>{task.category}</span>
                          <span className='meta-pill timer-pill'>
                            <Clock3 size={12} />
                            {formatDuration(getTaskElapsedMs(task, now))}
                          </span>
                        </div>
                      </div>

                      <div className='task-actions'>
                        {!task.done && (
                          task.timerStartedAt ? (
                            <button type='button' className='timer-button stop' onClick={() => stopTaskTimer(task.id)}>
                              <Square size={12} />
                              End
                            </button>
                          ) : (
                            <button type='button' className='timer-button start' onClick={() => startTaskTimer(task.id)}>
                              <Play size={12} />
                              Start
                            </button>
                          )
                        )}
                        <button type='button' className='icon-button' onClick={() => openEditModal(task)}>
                          <Pencil size={14} />
                        </button>
                        <button type='button' className='icon-button danger' onClick={() => deleteTask(task.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='empty-state'>
                  <div className='empty-icon'>
                    <Inbox size={18} />
                  </div>
                  <h3>No tasks found</h3>
                  <p>Try another filter or create a new task for this day.</p>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      {isModalOpen && (
        <div className='modal-backdrop' onClick={() => setIsModalOpen(false)}>
          <div className='task-modal' onClick={(event) => event.stopPropagation()}>
            <div className='modal-header'>
              <div>
                <p className='eyebrow'>Task details</p>
                <h3>{editingTaskId ? 'Edit task' : 'New task'}</h3>
              </div>
              <button type='button' className='icon-button' onClick={() => setIsModalOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleTaskSave} className='modal-form'>
              <label>
                <span>Title</span>
                <input
                  type='text'
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder='Task title'
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  rows='4'
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder='Add a short description'
                />
              </label>

              <div className='modal-row'>
                <label>
                  <span>Due date</span>
                  <input
                    type='date'
                    value={taskForm.dueDate}
                    onChange={(event) =>
                      setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Priority</span>
                  <select
                    value={taskForm.priority}
                    onChange={(event) =>
                      setTaskForm((prev) => ({ ...prev, priority: event.target.value }))
                    }
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Category</span>
                <select
                  value={taskForm.category}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <div className='modal-actions'>
                <button type='button' className='ghost-button' onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type='submit' className='primary-button'>
                  {editingTaskId ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
