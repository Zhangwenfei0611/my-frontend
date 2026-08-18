import { useEffect, useMemo, useState } from 'react'
import { eosApi, eosConfigured, supabase } from './eosClient'
import './App.css'

const SPLASH_KEY = 'eos-splash-played'
const VIEW_KEY = 'eos-current-view'

const emptyWorkspace = {
  profile: null,
  settings: { model_key: 'eos-calm', memory_enabled: true, context_length: 16 },
  models: [],
  conversations: [],
  journals: [],
  memories: [],
}

function getInitialView() {
  try {
    if (!window.sessionStorage.getItem(SPLASH_KEY)) return 'splash'
    return window.sessionStorage.getItem(VIEW_KEY) || 'chat'
  } catch {
    return 'splash'
  }
}

function formatDate(dateValue) {
  return new Date(`${dateValue}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function conversationForView(conversation) {
  return { ...conversation, preview: conversation.preview || 'A quiet space for your thoughts.', updated: formatDateTime(conversation.updated_at) }
}

function journalForView(entry) {
  return { ...entry, date: entry.entry_date }
}

function memoryForView(memory) {
  return { ...memory, label: memory.title, text: memory.description || memory.content, date: formatDateTime(memory.updated_at) }
}

function messageForView(message) {
  return { ...message, time: formatTime(message.created_at) }
}

function newClientMessageId() {
  return window.crypto?.randomUUID?.() || `message-${Date.now()}`
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'moon') return <svg {...common}><path d="M17.8 4.5a8.6 8.6 0 1 0 1.7 15.2A8.3 8.3 0 0 1 17.8 4.5Z" /><path d="M5.5 19.2c3.2-.1 6.1-.9 8.5-2.5" /></svg>
  if (name === 'chat') return <svg {...common}><path d="M20 14.5a6.7 6.7 0 0 1-6.7 6.7H8.8L4 23l1.4-4A6.7 6.7 0 1 1 20 14.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
  if (name === 'history') return <svg {...common}><path d="M4 7.5a8 8 0 1 1-1 8.1" /><path d="M4 3.5v4H8M12 8v4l2.8 1.7" /></svg>
  if (name === 'journal') return <svg {...common}><path d="M6.5 3.5h8.8l3.2 3.2v13.8H6.5Z" /><path d="M15.3 3.5v3.3h3.2M9 11h6M9 14.5h4" /></svg>
  if (name === 'calendar') return <svg {...common}><rect x="3.5" y="5.5" width="17" height="15" rx="1.6" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" /></svg>
  if (name === 'memory') return <svg {...common}><rect x="3.5" y="4" width="17" height="16" rx="1.6" /><path d="m6.5 16 3.4-3.5 2.4 2.3 2.2-2.2 3.1 3.4M8 8.8h.01" /></svg>
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3.1" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3.2v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.2-2.2.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1h-.2v-3.2h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3.2v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>
  if (name === 'send') return <svg {...common}><path d="m21 3-7.8 18-2.7-7.5L3 10.8Z" /><path d="M10.5 13.5 21 3" /></svg>
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
  if (name === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></svg>
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  if (name === 'back') return <svg {...common}><path d="m14.5 5-7 7 7 7M8 12h11" /></svg>
  if (name === 'check') return <svg {...common}><path d="m5 12.5 4.3 4.3L19 7" /></svg>
  return null
}

function EosLogo({ showWordmark = true, light = false }) {
  return <span className={`eos-logo ${light ? 'eos-logo--light' : ''}`}><span className="eos-logo__mark"><Icon name="moon" size={28} /></span>{showWordmark && <span className="eos-logo__type">Eos</span>}</span>
}

function Splash({ onComplete }) {
  useEffect(() => {
    window.sessionStorage.setItem(SPLASH_KEY, 'true')
    const timer = window.setTimeout(onComplete, 1500)
    return () => window.clearTimeout(timer)
  }, [onComplete])

  return <main className="eos-splash" aria-label="Eos splash screen"><img className="eos-splash__image" src="/eos-splash.jpg" alt="" /><div className="eos-splash__veil" /><div className="eos-splash__center"><EosLogo light /><p>A quiet space for two</p></div></main>
}

function Header({ view, navigate, onSignOut }) {
  return <header className="app-header"><button className="brand-button" type="button" onClick={() => navigate('chat')} aria-label="Go to conversation"><EosLogo /></button><div className="header-actions">{view !== 'chat' && <button className="icon-button" type="button" onClick={() => navigate('chat')} aria-label="Back to conversation"><Icon name="back" /></button>}<button className="icon-button" type="button" onClick={() => navigate('settings')} aria-label="Open settings"><Icon name="settings" /></button><button className="icon-button" type="button" onClick={onSignOut} aria-label="Sign out">×</button></div></header>
}

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>
}

function AccountView({ title, description, action, detail }) {
  return <main className="auth-shell"><section className="auth-card"><EosLogo light={false} /><p className="eyebrow">PRIVATE SPACE</p><h1>{title}</h1><p className="page-description">{description}</p>{detail && <p className="auth-detail">{detail}</p>}{action}</section></main>
}

function ChatView({ conversation, messages, messagesLoading, draft, setDraft, onSend, onNew, navigate, notice, sending }) {
  const title = conversation?.title || 'A soft place to land'
  return <section className="view chat-view"><div className="chat-heading"><div><p className="eyebrow">PRIVATE CONVERSATION</p><h1>{title}</h1><p className="page-description">A gentle place to begin again.</p></div><button className="secondary-button" type="button" onClick={onNew}><Icon name="plus" size={17} />New</button></div><div className="message-list">{messagesLoading ? <p className="empty-state">Opening your conversation…</p> : messages.length ? messages.map(message => <article className={`message ${message.role === 'user' ? 'message--user' : ''} ${message.status === 'failed' ? 'message--failed' : ''}`} key={message.id}><div className="message-avatar">{message.role === 'user' ? 'W' : <Icon name="moon" size={16} />}</div><div className="message-copy"><p className="message-author">{message.role === 'user' ? 'Winfrey' : 'Eos'} <span>{message.time}</span></p><p className="message-bubble">{message.content}</p>{message.status === 'failed' && <p className="message-error">{message.error_message || 'Eos could not reply. You can try again.'}</p>}</div></article>) : <div className="empty-panel"><Icon name="moon" size={28} /><p>Start wherever you are. Eos will meet you there.</p></div>}{notice && <p className="inline-notice" role="status">{notice}</p>}</div><form className="composer" onSubmit={onSend}><label className="sr-only" htmlFor="message">Message Eos</label><textarea id="message" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(event) } }} placeholder="Whatever you need, just ask Eos." rows="2" disabled={sending} /><button className="send-button" type="submit" disabled={!draft.trim() || sending} aria-label="Send message"><Icon name="send" size={19} /></button></form><div className="chat-shortcuts"><button type="button" onClick={() => navigate('journal')}><Icon name="journal" /><span>Write a note</span></button><button type="button" onClick={() => navigate('calendar')}><Icon name="calendar" /><span>Look at calendar</span></button><button type="button" onClick={() => navigate('memories')}><Icon name="memory" /><span>Open memories</span></button></div></section>
}

function HistoryView({ conversations, activeId, search, setSearch, onSelect, onNew }) {
  const filtered = conversations.filter(conversation => `${conversation.title} ${conversation.preview}`.toLowerCase().includes(search.toLowerCase()))
  return <section className="view"><PageIntro eyebrow="LOOKING BACK" title="Your conversations" description="Every gentle beginning stays close." action={<button className="primary-button" type="button" onClick={onNew}><Icon name="plus" size={17} />New chat</button>} /><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">Search conversations</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your history" /></label><div className="history-list">{filtered.length ? filtered.map(conversation => <button className={`history-card ${conversation.id === activeId ? 'history-card--active' : ''}`} type="button" key={conversation.id} onClick={() => onSelect(conversation.id)}><span className="history-card__icon"><Icon name="chat" size={19} /></span><span className="history-card__copy"><strong>{conversation.title}</strong><small>{conversation.preview}</small></span><span className="history-card__date">{conversation.updated}</span></button>) : <p className="empty-state">No conversations found.</p>}</div></section>
}

function JournalView({ journals, journalDate, setJournalDate, journalTitle, setJournalTitle, journalBody, setJournalBody, mood, setMood, customMood, setCustomMood, onSave, navigate, saving }) {
  const moods = ['Quiet', 'Bright', 'Tender', 'Heavy']
  return <section className="view"><PageIntro eyebrow="A PLACE TO NOTICE" title="Journal" description="Leave a small note for the version of you who comes later." action={<button className="secondary-button" type="button" onClick={() => navigate('calendar')}><Icon name="calendar" size={17} />Calendar</button>} /><form className="journal-form" onSubmit={onSave}><label className="field-label" htmlFor="journal-date">Date</label><input className="text-field" id="journal-date" type="date" value={journalDate} onChange={event => setJournalDate(event.target.value)} /><label className="field-label" htmlFor="journal-title">Title</label><input className="text-field" id="journal-title" value={journalTitle} onChange={event => setJournalTitle(event.target.value)} placeholder="A thought worth keeping" /><fieldset className="mood-field"><legend className="field-label">How does today feel?</legend><div className="mood-grid">{moods.map(moodName => <button className={`mood-chip ${mood === moodName.toLowerCase() ? 'mood-chip--active' : ''}`} type="button" key={moodName} onClick={() => setMood(moodName.toLowerCase())}>{moodName}</button>)}<button className={`mood-chip ${mood === 'custom' ? 'mood-chip--active' : ''}`} type="button" onClick={() => setMood('custom')}>Custom</button></div>{mood === 'custom' && <input className="text-field mood-custom" value={customMood} onChange={event => setCustomMood(event.target.value)} placeholder="Name this feeling" aria-label="Custom mood" />}</fieldset><label className="field-label" htmlFor="journal-body">Your note</label><textarea className="journal-textarea" id="journal-body" value={journalBody} onChange={event => setJournalBody(event.target.value)} placeholder="What is sitting with you today?" rows="6" /><button className="primary-button primary-button--wide" type="submit" disabled={!journalBody.trim() || saving}><Icon name="check" size={18} />{saving ? 'Saving…' : 'Save note'}</button></form><div className="saved-notes"><div className="section-heading"><h2>Saved notes</h2><span>{journals.length}</span></div>{journals.slice(0, 3).map(entry => <article className="note-card" key={entry.id}><div className="note-card__meta"><span>{entry.mood || 'Unlabeled'}</span><time>{formatDate(entry.date)}</time></div><h3>{entry.title}</h3><p>{entry.body}</p></article>)}</div></section>
}

function CalendarView({ journals, selectedDate, setSelectedDate, navigate }) {
  const entries = journals.filter(entry => entry.date === selectedDate)
  return <section className="view"><PageIntro eyebrow="A SOFTER RHYTHM" title="Calendar" description="Notice the days that ask to be remembered." action={<button className="secondary-button" type="button" onClick={() => navigate('journal')}><Icon name="journal" size={17} />Write note</button>} /><div className="calendar-card"><label className="field-label" htmlFor="calendar-date">Choose a day</label><input className="date-picker" id="calendar-date" type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} /><div className="calendar-date-readout"><span>{formatDate(selectedDate)}</span><small>{entries.length ? `${entries.length} note${entries.length === 1 ? '' : 's'}` : 'A quiet day'}</small></div></div><div className="calendar-results">{entries.length ? entries.map(entry => <article className="note-card" key={entry.id}><div className="note-card__meta"><span>{entry.mood || 'Unlabeled'}</span><time>{formatDate(entry.date)}</time></div><h3>{entry.title}</h3><p>{entry.body}</p></article>) : <div className="empty-panel"><Icon name="moon" size={28} /><p>No notes on this day yet.</p><button className="text-button" type="button" onClick={() => navigate('journal')}>Leave one here <Icon name="arrow" size={15} /></button></div>}</div></section>
}

function MemoriesView({ memories, memoryEnabled }) {
  return <section className="view"><PageIntro eyebrow="KEPT WITH CARE" title="Memories" description="The little things Eos keeps close for you." /><div className="memory-intro"><span className="memory-orb"><Icon name="moon" size={23} /></span><p>{memoryEnabled ? 'Memory is on. You can always change this in settings.' : 'Memory is paused. Eos will not use these notes in new replies.'}</p></div><div className="memory-list">{memories.length ? memories.map(memory => <article className="memory-card" key={memory.id}><div className="memory-card__top"><span>{memory.label}</span><time>{memory.date}</time></div><p>{memory.text}</p></article>) : <div className="empty-panel"><Icon name="moon" size={28} /><p>No memories have been saved yet.</p></div>}</div></section>
}

function SettingsView({ settings, models, onUpdate, onClear, saving }) {
  const selectedModel = models.find(model => model.key === settings.model_key)
  return <section className="view"><PageIntro eyebrow="YOUR EOS SPACE" title="Settings" description="Shape the way this quiet space feels." /><div className="settings-list"><section className="settings-section"><div className="settings-heading"><div><h2>Companion model</h2><p>Choose the tone you want to meet today.</p></div><span className="settings-value">{selectedModel?.name || 'Eos'}</span></div><div className="model-grid">{models.map(model => <button className={`model-button ${settings.model_key === model.key ? 'model-button--active' : ''}`} type="button" key={model.key} onClick={() => onUpdate({ modelKey: model.key })} disabled={saving}>{model.name.replace('Eos ', '')}</button>)}</div></section><section className="settings-section"><div className="settings-heading"><div><h2>Memory</h2><p>Let Eos remember the things you choose to keep.</p></div><button className={`toggle ${settings.memory_enabled ? 'toggle--on' : ''}`} type="button" role="switch" aria-checked={settings.memory_enabled} onClick={() => onUpdate({ memoryEnabled: !settings.memory_enabled })} disabled={saving}><span /></button></div></section><section className="settings-section"><div className="settings-heading"><div><h2>Context length</h2><p>How much recent conversation Eos can hold.</p></div><span className="settings-value">{settings.context_length}k</span></div><input className="range" type="range" min="4" max="32" step="4" value={settings.context_length} onChange={event => onUpdate({ contextLength: Number(event.target.value) })} aria-label="Context length" disabled={saving} /><div className="range-labels"><span>4k</span><span>32k</span></div></section><section className="settings-section settings-section--last"><div className="settings-heading"><div><h2>Private data</h2><p>Delete all cloud conversations, notes, memories, and records. This cannot be undone.</p></div><button className="danger-button" type="button" onClick={onClear} disabled={saving}>Clear data</button></div></section></div></section>
}

function BottomNav({ view, navigate }) {
  const items = [['chat', 'chat', 'Chat'], ['history', 'history', 'History'], ['journal', 'journal', 'Journal'], ['settings', 'settings', 'Settings']]
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(([target, icon, label]) => <button className={view === target ? 'bottom-nav__item--active' : ''} type="button" key={target} onClick={() => navigate(target)}><Icon name={icon} size={20} /><span>{label}</span></button>)}</nav>
}

export default function App() {
  const [view, setView] = useState(getInitialView)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!eosConfigured)
  const [workspace, setWorkspace] = useState(emptyWorkspace)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [remoteError, setRemoteError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const [sending, setSending] = useState(false)
  const [savingJournal, setSavingJournal] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [journalDate, setJournalDate] = useState(today)
  const [journalTitle, setJournalTitle] = useState('')
  const [journalBody, setJournalBody] = useState('')
  const [mood, setMood] = useState('quiet')
  const [customMood, setCustomMood] = useState('')
  const [selectedDate, setSelectedDate] = useState(today)

  const activeConversation = useMemo(() => workspace.conversations.find(conversation => conversation.id === activeConversationId) || null, [activeConversationId, workspace.conversations])

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setAuthReady(true)
      setWorkspaceLoading(Boolean(currentSession))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setWorkspaceLoading(Boolean(nextSession))
      setRemoteError('')
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return undefined

    let cancelled = false
    Promise.all([eosApi('/api/v1/me'), eosApi('/api/v1/models'), eosApi('/api/v1/conversations?limit=50'), eosApi('/api/v1/journals?limit=100'), eosApi('/api/v1/memories?limit=100')])
      .then(([me, models, conversations, journals, memories]) => {
        if (cancelled) return
        const nextConversations = conversations.map(conversationForView)
        setWorkspace({ profile: me.profile, settings: me.settings, models, conversations: nextConversations, journals: journals.map(journalForView), memories: memories.map(memoryForView) })
        setActiveConversationId(nextConversations[0]?.id || null)
        setMessagesLoading(Boolean(nextConversations[0]))
      })
      .catch(error => {
        if (!cancelled) setRemoteError(error.message)
      })
      .finally(() => {
        if (!cancelled) setWorkspaceLoading(false)
      })
    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    if (!session || !activeConversationId) return undefined

    let cancelled = false
    eosApi(`/api/v1/conversations/${activeConversationId}/messages?limit=100`)
      .then(data => { if (!cancelled) setMessages(data.map(messageForView)) })
      .catch(error => { if (!cancelled) setNotice(error.message) })
      .finally(() => { if (!cancelled) setMessagesLoading(false) })
    return () => { cancelled = true }
  }, [activeConversationId, session])

  const navigate = nextView => {
    setView(nextView)
    window.sessionStorage.setItem(VIEW_KEY, nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showNotice = message => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const signIn = async () => {
    if (!supabase) return
    setLoginBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } })
    if (error) {
      setRemoteError(error.message)
      setLoginBusy(false)
    }
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setWorkspace(emptyWorkspace)
    setActiveConversationId(null)
    setMessages([])
    setRemoteError('')
    navigate('chat')
  }

  const createConversation = () => {
    setActiveConversationId(null)
    setMessages([])
    setDraft('')
    navigate('chat')
    showNotice('Write your first message to begin a new conversation.')
  }

  const selectConversation = id => {
    setMessagesLoading(true)
    setActiveConversationId(id)
    navigate('chat')
  }

  const sendMessage = async event => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setSending(true)
    setDraft('')
    const clientMessageId = newClientMessageId()
    try {
      const result = activeConversationId
        ? await eosApi(`/api/v1/conversations/${activeConversationId}/messages`, { method: 'POST', body: JSON.stringify({ content, clientMessageId }) })
        : await eosApi('/api/v1/conversations', { method: 'POST', body: JSON.stringify({ initialMessage: content, clientMessageId }) })
      const conversation = activeConversationId ? activeConversation : result.conversation
      const userMessage = messageForView(result.message)
      const assistantMessage = result.assistantMessage ? messageForView(result.assistantMessage) : null
      const updatedConversation = conversationForView({ ...conversation, preview: content, updated_at: new Date().toISOString() })
      setWorkspace(current => ({ ...current, conversations: [updatedConversation, ...current.conversations.filter(item => item.id !== updatedConversation.id)] }))
      setActiveConversationId(updatedConversation.id)
      setMessages(current => [...current, userMessage, ...(assistantMessage ? [assistantMessage] : [])])
      if (!assistantMessage) showNotice('Your message was saved. Eos needs a moment before replying.')
    } catch (error) {
      const failedConversation = error.data?.conversation
      const failedMessage = error.data?.message
      if (failedConversation) {
        const updatedConversation = conversationForView({ ...failedConversation, preview: content, updated_at: new Date().toISOString() })
        setWorkspace(current => ({ ...current, conversations: [updatedConversation, ...current.conversations.filter(item => item.id !== updatedConversation.id)] }))
        setActiveConversationId(updatedConversation.id)
      }
      if (failedMessage) setMessages(current => [...current, messageForView(failedMessage)])
      showNotice(error.message)
    } finally {
      setSending(false)
    }
  }

  const saveJournal = async event => {
    event.preventDefault()
    const body = journalBody.trim()
    if (!body || savingJournal) return

    setSavingJournal(true)
    try {
      const entry = await eosApi('/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify({ date: journalDate, title: journalTitle.trim() || 'A note from today', body, mood: mood === 'custom' ? customMood.trim() || 'Custom' : mood[0].toUpperCase() + mood.slice(1) }),
      })
      setWorkspace(current => ({ ...current, journals: [journalForView(entry), ...current.journals] }))
      setJournalTitle('')
      setJournalBody('')
      setSelectedDate(journalDate)
      showNotice('Note saved to your private journal.')
    } catch (error) {
      showNotice(error.message)
    } finally {
      setSavingJournal(false)
    }
  }

  const updateSettings = async patch => {
    if (savingSettings) return
    setSavingSettings(true)
    try {
      const settings = await eosApi('/api/v1/settings', { method: 'PATCH', body: JSON.stringify(patch) })
      setWorkspace(current => ({ ...current, settings }))
    } catch (error) {
      showNotice(error.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const clearData = async () => {
    if (!window.confirm('Delete all Eos conversations, notes, memories, and records permanently?')) return
    if (savingSettings) return
    setSavingSettings(true)
    try {
      const result = await eosApi('/api/v1/me/data', { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE MY EOS DATA' }) })
      setWorkspace(current => ({ ...current, settings: result.settings, conversations: [], journals: [], memories: [] }))
      setActiveConversationId(null)
      setMessages([])
      navigate('chat')
      showNotice('Your private Eos data has been deleted.')
    } catch (error) {
      showNotice(error.message)
    } finally {
      setSavingSettings(false)
    }
  }

  if (view === 'splash') return <Splash onComplete={() => navigate('chat')} />
  if (!eosConfigured) return <AccountView title="Eos is almost ready" description="Add the three public Vite settings before opening your private space." detail="Use .env.example for local development, then add the same values in Vercel." />
  if (!authReady) return <AccountView title="Opening Eos" description="Checking your private session…" />
  if (!session) return <AccountView title="A quiet space for two" description="Sign in with your approved GitHub account to enter Eos." action={<button className="primary-button primary-button--wide" type="button" onClick={signIn} disabled={loginBusy}>{loginBusy ? 'Opening GitHub…' : 'Continue with GitHub'}</button>} detail={remoteError || 'Only the configured GitHub account can access this space.'} />
  if (workspaceLoading) return <AccountView title="Opening your space" description="Loading your private conversations and notes…" />
  if (remoteError) return <AccountView title="Eos could not open" description={remoteError} action={<button className="secondary-button" type="button" onClick={signOut}>Sign out</button>} />

  return <div className="eos-shell"><Header view={view} navigate={navigate} onSignOut={signOut} /><main className="eos-main">{view === 'chat' && <ChatView conversation={activeConversation} messages={messages} messagesLoading={messagesLoading} draft={draft} setDraft={setDraft} onSend={sendMessage} onNew={createConversation} navigate={navigate} notice={notice} sending={sending} />}{view === 'history' && <HistoryView conversations={workspace.conversations} activeId={activeConversationId} search={historySearch} setSearch={setHistorySearch} onSelect={selectConversation} onNew={createConversation} />}{view === 'journal' && <JournalView journals={workspace.journals} journalDate={journalDate} setJournalDate={setJournalDate} journalTitle={journalTitle} setJournalTitle={setJournalTitle} journalBody={journalBody} setJournalBody={setJournalBody} mood={mood} setMood={setMood} customMood={customMood} setCustomMood={setCustomMood} onSave={saveJournal} navigate={navigate} saving={savingJournal} />}{view === 'calendar' && <CalendarView journals={workspace.journals} selectedDate={selectedDate} setSelectedDate={setSelectedDate} navigate={navigate} />}{view === 'memories' && <MemoriesView memories={workspace.memories} memoryEnabled={workspace.settings.memory_enabled} />}{view === 'settings' && <SettingsView settings={workspace.settings} models={workspace.models} onUpdate={updateSettings} onClear={clearData} saving={savingSettings} />}</main><BottomNav view={view} navigate={navigate} />{notice && view !== 'chat' && <div className="toast" role="status">{notice}</div>}</div>
}
