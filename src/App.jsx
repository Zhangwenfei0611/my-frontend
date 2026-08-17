import { useEffect, useMemo, useState } from 'react'
import './App.css'

const SPLASH_KEY = 'eos-splash-played'
const VIEW_KEY = 'eos-current-view'
const DATA_KEY = 'eos-static-data'

const initialData = {
  model: 'Eos Calm',
  memoryEnabled: true,
  contextLength: 16,
  conversations: [
    {
      id: 'first-light',
      title: 'A soft place to land',
      updated: 'Today',
      preview: 'Your thoughts are safe here.',
      messages: [
        { id: 'welcome', role: 'eos', text: "I'm here, Winfrey. Take your time.", time: '09:41' },
      ],
    },
  ],
  journals: [
    {
      id: 'first-note',
      date: '2026-08-17',
      mood: 'Quiet',
      title: 'A quiet beginning',
      body: 'A small place to leave the thoughts that deserve a little more time.',
    },
  ],
  memories: [
    { id: 'memory-1', label: 'About Winfrey', text: 'You like conversations that leave room for a quiet pause.', date: 'Saved recently' },
    { id: 'memory-2', label: 'Our rhythm', text: 'Eos keeps the tone gentle, warm and unhurried.', date: 'Saved recently' },
  ],
}

function readData() {
  try {
    const saved = window.localStorage.getItem(DATA_KEY)
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData
  } catch {
    return initialData
  }
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

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'moon') return <svg {...common}><path d="M17.8 4.5a8.6 8.6 0 1 0 1.7 15.2A8.3 8.3 0 0 1 17.8 4.5Z" /><path d="M5.5 19.2c3.2-.1 6.1-.9 8.5-2.5" /></svg>
  if (name === 'home') return <svg {...common}><path d="m3.5 10.7 8.5-6.9 8.5 6.9v8.4a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7Z" /><path d="M9.2 20.8v-6.1h5.6v6.1" /></svg>
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

function Header({ view, navigate }) {
  return <header className="app-header"><button className="brand-button" type="button" onClick={() => navigate('chat')} aria-label="Go to conversation"><EosLogo /></button><div className="header-actions">{view !== 'chat' && <button className="icon-button" type="button" onClick={() => navigate('chat')} aria-label="Back to conversation"><Icon name="back" /></button>}<button className="icon-button" type="button" onClick={() => navigate('settings')} aria-label="Open settings"><Icon name="settings" /></button></div></header>
}

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>
}

function ChatView({ conversation, draft, setDraft, onSend, onNew, navigate, notice }) {
  return <section className="view chat-view"><div className="chat-heading"><div><p className="eyebrow">PRIVATE CONVERSATION</p><h1>{conversation.title}</h1><p className="page-description">A gentle place to begin again.</p></div><button className="secondary-button" type="button" onClick={onNew}><Icon name="plus" size={17} />New</button></div><div className="message-list">{conversation.messages.map(message => <article className={`message ${message.role === 'user' ? 'message--user' : ''}`} key={message.id}><div className="message-avatar">{message.role === 'user' ? 'W' : <Icon name="moon" size={16} />}</div><div className="message-copy"><p className="message-author">{message.role === 'user' ? 'Winfrey' : 'Eos'} <span>{message.time}</span></p><p className="message-bubble">{message.text}</p></div></article>)}{notice && <p className="inline-notice" role="status">{notice}</p>}</div><form className="composer" onSubmit={onSend}><label className="sr-only" htmlFor="message">Message Eos</label><textarea id="message" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(event) } }} placeholder="Whatever you need, just ask Eos." rows="2" /><button className="send-button" type="submit" disabled={!draft.trim()} aria-label="Send message"><Icon name="send" size={19} /></button></form><div className="chat-shortcuts"><button type="button" onClick={() => navigate('journal')}><Icon name="journal" /><span>Write a note</span></button><button type="button" onClick={() => navigate('calendar')}><Icon name="calendar" /><span>Look at calendar</span></button><button type="button" onClick={() => navigate('memories')}><Icon name="memory" /><span>Open memories</span></button></div></section>
}

function HistoryView({ conversations, activeId, search, setSearch, onSelect, onNew }) {
  const filtered = conversations.filter(conversation => `${conversation.title} ${conversation.preview}`.toLowerCase().includes(search.toLowerCase()))
  return <section className="view"><PageIntro eyebrow="LOOKING BACK" title="Your conversations" description="Every gentle beginning stays close." action={<button className="primary-button" type="button" onClick={onNew}><Icon name="plus" size={17} />New chat</button>} /><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">Search conversations</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your history" /></label><div className="history-list">{filtered.length ? filtered.map(conversation => <button className={`history-card ${conversation.id === activeId ? 'history-card--active' : ''}`} type="button" key={conversation.id} onClick={() => onSelect(conversation.id)}><span className="history-card__icon"><Icon name="chat" size={19} /></span><span className="history-card__copy"><strong>{conversation.title}</strong><small>{conversation.preview}</small></span><span className="history-card__date">{conversation.updated}</span></button>) : <p className="empty-state">No conversations found.</p>}</div></section>
}

function JournalView({ journals, journalDate, setJournalDate, journalTitle, setJournalTitle, journalBody, setJournalBody, mood, setMood, customMood, setCustomMood, onSave, navigate }) {
  const moods = ['Quiet', 'Bright', 'Tender', 'Heavy']
  return <section className="view"><PageIntro eyebrow="A PLACE TO NOTICE" title="Journal" description="Leave a small note for the version of you who comes later." action={<button className="secondary-button" type="button" onClick={() => navigate('calendar')}><Icon name="calendar" size={17} />Calendar</button>} /><form className="journal-form" onSubmit={onSave}><label className="field-label" htmlFor="journal-date">Date</label><input className="text-field" id="journal-date" type="date" value={journalDate} onChange={event => setJournalDate(event.target.value)} /><label className="field-label" htmlFor="journal-title">Title</label><input className="text-field" id="journal-title" value={journalTitle} onChange={event => setJournalTitle(event.target.value)} placeholder="A thought worth keeping" /><fieldset className="mood-field"><legend className="field-label">How does today feel?</legend><div className="mood-grid">{moods.map(moodName => <button className={`mood-chip ${mood === moodName.toLowerCase() ? 'mood-chip--active' : ''}`} type="button" key={moodName} onClick={() => setMood(moodName.toLowerCase())}>{moodName}</button>)}<button className={`mood-chip ${mood === 'custom' ? 'mood-chip--active' : ''}`} type="button" onClick={() => setMood('custom')}>Custom</button></div>{mood === 'custom' && <input className="text-field mood-custom" value={customMood} onChange={event => setCustomMood(event.target.value)} placeholder="Name this feeling" aria-label="Custom mood" />}</fieldset><label className="field-label" htmlFor="journal-body">Your note</label><textarea className="journal-textarea" id="journal-body" value={journalBody} onChange={event => setJournalBody(event.target.value)} placeholder="What is sitting with you today?" rows="6" /><button className="primary-button primary-button--wide" type="submit" disabled={!journalBody.trim()}><Icon name="check" size={18} />Save note</button></form><div className="saved-notes"><div className="section-heading"><h2>Saved notes</h2><span>{journals.length}</span></div>{journals.slice(0, 3).map(entry => <article className="note-card" key={entry.id}><div className="note-card__meta"><span>{entry.mood}</span><time>{formatDate(entry.date)}</time></div><h3>{entry.title}</h3><p>{entry.body}</p></article>)}</div></section>
}

function CalendarView({ journals, selectedDate, setSelectedDate, navigate }) {
  const entries = journals.filter(entry => entry.date === selectedDate)
  return <section className="view"><PageIntro eyebrow="A SOFTER RHYTHM" title="Calendar" description="Notice the days that ask to be remembered." action={<button className="secondary-button" type="button" onClick={() => navigate('journal')}><Icon name="journal" size={17} />Write note</button>} /><div className="calendar-card"><label className="field-label" htmlFor="calendar-date">Choose a day</label><input className="date-picker" id="calendar-date" type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} /><div className="calendar-date-readout"><span>{formatDate(selectedDate)}</span><small>{entries.length ? `${entries.length} note${entries.length === 1 ? '' : 's'}` : 'A quiet day'}</small></div></div><div className="calendar-results">{entries.length ? entries.map(entry => <article className="note-card" key={entry.id}><div className="note-card__meta"><span>{entry.mood}</span><time>{formatDate(entry.date)}</time></div><h3>{entry.title}</h3><p>{entry.body}</p></article>) : <div className="empty-panel"><Icon name="moon" size={28} /><p>No notes on this day yet.</p><button className="text-button" type="button" onClick={() => navigate('journal')}>Leave one here <Icon name="arrow" size={15} /></button></div>}</div></section>
}

function MemoriesView({ memories }) {
  return <section className="view"><PageIntro eyebrow="KEPT WITH CARE" title="Memories" description="The little things Eos keeps close for you." /><div className="memory-intro"><span className="memory-orb"><Icon name="moon" size={23} /></span><p>Memory is on. You can always change this in settings.</p></div><div className="memory-list">{memories.map(memory => <article className="memory-card" key={memory.id}><div className="memory-card__top"><span>{memory.label}</span><time>{memory.date}</time></div><p>{memory.text}</p></article>)}</div></section>
}

function SettingsView({ data, updateData, onClear }) {
  const models = ['Eos Calm', 'Eos Focus', 'Eos Dream']
  return <section className="view"><PageIntro eyebrow="YOUR Eos SPACE" title="Settings" description="Shape the way this quiet space feels." /><div className="settings-list"><section className="settings-section"><div className="settings-heading"><div><h2>Companion model</h2><p>Choose the tone you want to meet today.</p></div><span className="settings-value">{data.model}</span></div><div className="model-grid">{models.map(model => <button className={`model-button ${data.model === model ? 'model-button--active' : ''}`} type="button" key={model} onClick={() => updateData({ model })}>{model}</button>)}</div></section><section className="settings-section"><div className="settings-heading"><div><h2>Memory</h2><p>Let Eos remember the things you choose to keep.</p></div><button className={`toggle ${data.memoryEnabled ? 'toggle--on' : ''}`} type="button" role="switch" aria-checked={data.memoryEnabled} onClick={() => updateData({ memoryEnabled: !data.memoryEnabled })}><span /></button></div></section><section className="settings-section"><div className="settings-heading"><div><h2>Context length</h2><p>How much recent conversation Eos can hold.</p></div><span className="settings-value">{data.contextLength}k</span></div><input className="range" type="range" min="4" max="32" step="4" value={data.contextLength} onChange={event => updateData({ contextLength: Number(event.target.value) })} aria-label="Context length" /><div className="range-labels"><span>4k</span><span>32k</span></div></section><section className="settings-section settings-section--last"><div className="settings-heading"><div><h2>Local space</h2><p>Static demo data lives only in this browser.</p></div><button className="danger-button" type="button" onClick={onClear}>Clear data</button></div></section></div></section>
}

function BottomNav({ view, navigate }) {
  const items = [['chat', 'chat', 'Chat'], ['history', 'history', 'History'], ['journal', 'journal', 'Journal'], ['settings', 'settings', 'Settings']]
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(([target, icon, label]) => <button className={view === target ? 'bottom-nav__item--active' : ''} type="button" key={target} onClick={() => navigate(target)}><Icon name={icon} size={20} /><span>{label}</span></button>)}</nav>
}

export default function App() {
  const [view, setView] = useState(getInitialView)
  const [data, setData] = useState(readData)
  const [activeConversationId, setActiveConversationId] = useState('first-light')
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const [journalDate, setJournalDate] = useState(today)
  const [journalTitle, setJournalTitle] = useState('')
  const [journalBody, setJournalBody] = useState('')
  const [mood, setMood] = useState('quiet')
  const [customMood, setCustomMood] = useState('')
  const [selectedDate, setSelectedDate] = useState(today)

  const activeConversation = useMemo(() => data.conversations.find(conversation => conversation.id === activeConversationId) || data.conversations[0], [data.conversations, activeConversationId])

  const persistData = nextData => {
    setData(nextData)
    window.localStorage.setItem(DATA_KEY, JSON.stringify(nextData))
  }
  const updateData = patch => persistData({ ...data, ...patch })
  const navigate = nextView => {
    setView(nextView)
    window.sessionStorage.setItem(VIEW_KEY, nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const showNotice = message => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }
  const createConversation = () => {
    const conversation = { id: `conversation-${Date.now()}`, title: 'A new beginning', updated: 'Just now', preview: 'A fresh page for your thoughts.', messages: [] }
    persistData({ ...data, conversations: [conversation, ...data.conversations] })
    setActiveConversationId(conversation.id)
    setDraft('')
    navigate('chat')
  }
  const sendMessage = event => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMessage = { id: `message-${Date.now()}`, role: 'user', text, time: now }
    const reply = { id: `reply-${Date.now()}`, role: 'eos', text: 'I hear you. We can stay with this thought for as long as you need.', time: now }
    const conversations = data.conversations.map(conversation => conversation.id === activeConversation.id ? { ...conversation, updated: 'Just now', preview: text, messages: [...conversation.messages, userMessage, reply] } : conversation)
    persistData({ ...data, conversations })
    setDraft('')
    showNotice('Your message is here to stay.')
  }
  const saveJournal = event => {
    event.preventDefault()
    const body = journalBody.trim()
    if (!body) return
    const entry = { id: `journal-${Date.now()}`, date: journalDate, mood: mood === 'custom' ? customMood.trim() || 'Custom' : mood[0].toUpperCase() + mood.slice(1), title: journalTitle.trim() || 'A note from today', body }
    persistData({ ...data, journals: [entry, ...data.journals] })
    setJournalTitle('')
    setJournalBody('')
    setSelectedDate(journalDate)
    showNotice('Note saved to your journal.')
  }
  const clearData = () => {
    persistData(initialData)
    setActiveConversationId(initialData.conversations[0].id)
    showNotice('Local demo data has been reset.')
  }

  if (view === 'splash') return <Splash onComplete={() => navigate('chat')} />
  return <div className="eos-shell"><Header view={view} navigate={navigate} /><main className="eos-main">{view === 'chat' && <ChatView conversation={activeConversation} draft={draft} setDraft={setDraft} onSend={sendMessage} onNew={createConversation} navigate={navigate} notice={notice} />}{view === 'history' && <HistoryView conversations={data.conversations} activeId={activeConversationId} search={historySearch} setSearch={setHistorySearch} onSelect={id => { setActiveConversationId(id); navigate('chat') }} onNew={createConversation} />}{view === 'journal' && <JournalView journals={data.journals} journalDate={journalDate} setJournalDate={setJournalDate} journalTitle={journalTitle} setJournalTitle={setJournalTitle} journalBody={journalBody} setJournalBody={setJournalBody} mood={mood} setMood={setMood} customMood={customMood} setCustomMood={setCustomMood} onSave={saveJournal} navigate={navigate} />}{view === 'calendar' && <CalendarView journals={data.journals} selectedDate={selectedDate} setSelectedDate={setSelectedDate} navigate={navigate} />}{view === 'memories' && <MemoriesView memories={data.memories} />}{view === 'settings' && <SettingsView data={data} updateData={updateData} onClear={clearData} />}</main><BottomNav view={view} navigate={navigate} />{notice && view !== 'chat' && <div className="toast" role="status">{notice}</div>}</div>
}
