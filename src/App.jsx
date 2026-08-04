import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  // --- 状态管理 ---
  const [isWelcomeHidden, setIsWelcomeHidden] = useState(false)
  const [activeView, setActiveView] = useState('chat')
  const [activeSessionId, setActiveSessionId] = useState('tonight')
  const [sessions, setSessions] = useState([
    {
      id: 'tonight',
      title: '今晚的慢慢聊',
      date: '刚刚',
      preview: '那就先不用急着解决，我们慢慢说。',
      msg: [
        ['Coco', '今天过得还好吗？不用把话说得很完整，我在听。', '20:16'],
        ['Winfrey', '有一点累，但现在好像可以慢下来。', '20:18', 1],
        ['Coco', '那就先不用急着解决。把今天放在这里，我们慢慢说。', '20:19']
      ]
    },
    {
      id: 'weekend',
      title: '周末要做的事',
      date: '昨天',
      preview: '先留一个空白下午给自己。',
      msg: [
        ['Winfrey', '这个周末我只想做一点轻松的事。', '昨天 18:42', 1],
        ['Coco', '那我们先留一个空白下午给自己，不安排也很好。', '昨天 18:43']
      ]
    },
    {
      id: 'morning',
      title: '早起练习',
      date: '7月26日',
      preview: '醒来后的十分钟，不需要完成什么。',
      msg: [
        ['Coco', '醒来后的十分钟，不需要完成什么，喝一口水就很好。', '7月26日 07:21']
      ]
    }
  ])
  const [memories, setMemories] = useState([
    ['偏好', '今天', 'Winfrey喜欢不太着急的对话节奏，想先被听见，再讨论答案。'],
    ['约定', '7月28日', '周末至少留一个没有安排的下午，用来散步、看书，或者只是发呆。'],
    ['片段', '7月26日', '早上醒来时，一杯温水和十分钟安静，已经是很好的开始。'],
    ['偏好', '7月20日', 'Coco回答时可以简洁一些，但在重要的情绪面前多停留一会儿。']
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [messageText, setMessageText] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)   // 改名：toastVisible
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const toastTimerRef = useRef(null)

  // --- 辅助函数 ---
  const now = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
  const esc = (s) => s.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[c]))

  const currentSession = () => sessions.find(s => s.id === activeSessionId)

  // --- 核心操作函数 ---
  const switchView = (view) => {
    setActiveView(view)
    setTimeout(() => {
      const h1 = document.querySelector('.view.active h1')
      if (h1) h1.focus({ preventScroll: true })
    }, 50)
  }

  const newChat = () => {
    const id = 'c' + Date.now()
    const newS = {
      id,
      title: '新的慢慢聊',
      date: '刚刚',
      preview: '从这里开始，慢慢说。',
      msg: [['Coco', '我在。今天想从哪里开始说起？', now()]]
    }
    setSessions([newS, ...sessions])
    setActiveSessionId(id)
    switchView('chat')
    setTimeout(() => textareaRef.current?.focus(), 230)
    showToast('新的一段对话已经准备好了')
  }

const sendMessage = async () => {
  const text = messageText.trim()
  if (!text) {
    textareaRef.current?.focus()
    return
  }
  const s = currentSession()
  if (!s) return

  // 1. 先把用户的消息显示在界面上（乐观更新）
  const updatedMsg = [...s.msg, ['Winfrey', text, now(), 1]]
  const updatedSession = { ...s, msg: updatedMsg, preview: text, date: '刚刚' }
  setSessions(sessions.map(sess => sess.id === activeSessionId ? updatedSession : sess))
  setMessageText('')
  setIsSending(true)

  try {
    // 2. 向后端发送请求（把地址换成你 Render 的真实地址）
  const response = await fetch('https://winfrey-coco.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })

    const data = await response.json()

    // 3. 检查后端是否返回了错误
    if (!response.ok) {
      throw new Error(data.error || '请求失败')
    }

    // 4. 把 AI 的回复追加到当前会话中
    const reply = data.reply || '抱歉，我没有收到回复。'
    const currentS = sessions.find(s => s.id === activeSessionId)
    if (currentS) {
      const newMsg = [...currentS.msg, ['Coco', reply, now()]]
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, msg: newMsg, preview: reply } : s))
    }

  } catch (error) {
    // 5. 如果出错了，显示提示
    console.error('发送消息失败:', error)
    showToast('连接失败，请检查后端是否正常运行')
    // 把刚才显示的用户消息回滚（可选，这里简单处理）
  } finally {
    setIsSending(false)
  }
}

  const switchSession = (id) => {
    setActiveSessionId(id)
    switchView('chat')
    showToast('已切换到这段对话')
  }

  const showToast = (msg) => {
    clearTimeout(toastTimerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3200)
  }

  const filteredMemories = memories.filter(m =>
    m.join(' ').toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  // --- 副作用（自动调整高度、滚动等） ---
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 102) + 'px'
    }
  }, [messageText])

  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }, [sessions, activeView, activeSessionId])

  useEffect(() => {
    if (activeView === 'chat') {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [activeView])

  // --- 渲染界面（JSX） ---
  return (
    <div className="stage">
      {/* ========== 欢迎页 ========== */}
      <section className="welcome" id="welcome" aria-labelledby="welcomeTitle" hidden={isWelcomeHidden}>
        <p className="mark"><span className="house-mark" aria-hidden="true"></span>WINFREY &amp; COCO</p>
        <div className="welcome-main">
          <div className="scene" aria-hidden="true">
            <svg className="drawing" viewBox="0 0 360 285">
              <path className="st" d="M42 244H318"/>
              <path className="paper" d="M56 222C96 201 141 202 180 222C219 202 264 201 304 222V241C262 223 219 222 180 240C141 222 98 223 56 241Z"/>
              <path className="st" d="M180 222V240M78 226L139 232M222 232L282 226"/>
              <ellipse className="paper" cx="154" cy="209" rx="15" ry="4"/>
              <path className="st" d="M139 208C140 199 168 199 169 208M154 205V191M151 191H157"/>
              <circle className="paper" cx="110" cy="79" r="10"/>
              <path className="fill" d="M99 81C99 70 107 65 115 69C121 72 122 80 119 86C115 81 109 78 103 79Z"/>
              <path className="st" d="M108 89L107 105M107 104C98 112 96 126 100 140M108 104C118 115 123 129 121 146M99 113L83 100M83 100L77 106M99 113L88 127M121 115L133 95M133 95L141 99"/>
              <path className="fill" d="M101 105C107 101 115 102 120 108L123 146C115 150 104 149 97 144Z"/>
              <path className="st" d="M101 144L94 189M119 146L129 190M94 189L84 221M129 190L143 221M80 221H97M137 221H151"/>
              <circle className="paper" cx="247" cy="132" r="10"/>
              <path className="fill" d="M237 133C236 122 243 117 252 120C258 123 260 131 257 138C252 133 246 131 240 132Z"/>
              <path className="st" d="M246 142L244 156M244 155C233 160 223 169 216 180M244 155C253 160 262 170 268 181M230 167L207 158M268 181L282 190"/>
              <path className="fill" d="M235 156C243 151 252 154 258 161L270 184C260 190 247 190 237 184Z"/>
              <path className="st" d="M237 183C225 186 213 194 205 204M270 184C282 189 291 199 297 211M205 204L181 214M297 211L306 228M179 214H195M302 228H313"/>
              <path className="st" d="M61 58H83M69 49V67M278 58H300M289 47V69"/>
            </svg>
          </div>
          <p className="eyebrow">一个安静的对话空间</p>
          <h1 id="welcomeTitle">Winfrey和Coco的小家</h1>
          <p className="welcome-copy">把想说的话，慢慢留在这里。</p>
        </div>
        <div>
          <button className="primary" id="enter" type="button" onClick={() => setIsWelcomeHidden(true)}>
            进入小家 <svg className="icon"><use href="#right"/></svg>
          </button>
          <small>此刻，只有你和我。</small>
        </div>
      </section>

      {/* ========== 主应用 ========== */}
      <div className="app" id="app" hidden={!isWelcomeHidden}>
        <header className="top">
          <button className="home-btn" id="back" type="button" aria-label="回到欢迎页" title="回到欢迎页" onClick={() => setIsWelcomeHidden(false)}>
            <svg className="icon"><use href="#home"/></svg>
          </button>
          <div className="top-name">
            <b>Winfrey和Coco的小家</b>
            <span><i className="dot"></i>Coco在线</span>
          </div>
          <i className="balance" aria-hidden="true"></i>
        </header>

        <main className="main" id="appMain" tabIndex="-1">
          {/* 聊天视图 */}
          <section className={`view ${activeView === 'chat' ? 'active' : ''}`} id="chat" aria-labelledby="chatTitle">
            <div className="chat-meta">
              <div>
                <span>正在聊天</span>
                <h1 id="chatTitle">{currentSession()?.title || '聊天'}</h1>
              </div>
              <button className="new" id="newChat" type="button" aria-label="新建会话" onClick={newChat}>
                <svg className="icon"><use href="#plus"/></svg>新聊
              </button>
            </div>
            <div className="line"></div>
            <div className="messages" id="messages" aria-live="polite" ref={messagesEndRef}>
              {currentSession()?.msg.map((m, idx) => (
                <article className={`message ${m[3] ? 'mine' : ''}`} key={idx}>
                  <div className="avatar" aria-hidden="true">{m[3] ? 'W' : 'C'}</div>
                  <div className="copy">
                    <p className="who">{m[3] ? 'Winfrey' : 'Coco'}</p>
                    <p className="bubble">{esc(m[1])}</p>
                    <time className="time">{m[2]}</time>
                  </div>
                </article>
              ))}
            </div>
            <div className="composer-wrap">
              <form className="composer" id="composer" onSubmit={(e) => { e.preventDefault(); sendMessage() }}>
                <label className="sr" htmlFor="message">想和Coco说的话</label>
                <textarea
                  id="message"
                  rows="1"
                  placeholder="想和Coco说些什么？"
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <button className="send" id="send" type="submit" aria-label="发送消息" disabled={isSending}>
                  <svg className="icon"><use href="#up"/></svg>
                </button>
              </form>
            </div>
          </section>

          {/* 会话视图 */}
          <section className={`view ${activeView === 'sessions' ? 'active' : ''}`} id="sessions" aria-labelledby="sessionsTitle">
            <div className="head row">
              <div>
                <p className="kicker">会话管理</p>
                <h1 id="sessionsTitle" tabIndex="-1">我们聊过的事</h1>
                <p className="summary">每一段对话，都有它自己的位置。</p>
              </div>
              <button className="add" id="newSession" type="button" aria-label="新建一段对话" onClick={newChat}>
                <svg className="icon"><use href="#plus"/></svg>新建
              </button>
            </div>
            <div className="content">
              <div className="session-list" id="sessionList" aria-label="会话列表">
                {sessions.map(s => (
                  <button
                    type="button"
                    className={`session ${s.id === activeSessionId ? 'active' : ''}`}
                    data-id={s.id}
                    aria-pressed={s.id === activeSessionId}
                    key={s.id}
                    onClick={() => switchSession(s.id)}
                  >
                    <span>
                      <b>{s.id === activeSessionId && <i></i>}{esc(s.title)}</b>
                      <em>{esc(s.preview)}</em>
                    </span>
                    <time>{s.date}</time>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 记忆视图 */}
          <section className={`view ${activeView === 'memory' ? 'active' : ''}`} id="memory" aria-labelledby="memoryTitle">
            <div className="head">
              <p className="kicker">小家的记忆</p>
              <h1 id="memoryTitle" tabIndex="-1">留在这里的记忆</h1>
              <p className="summary">你说过的重要小事，我会好好收着。</p>
            </div>
            <div className="content">
              <label className="search" htmlFor="search">
                <svg className="icon"><use href="#searchI"/></svg>
                <span className="sr">搜索记忆</span>
                <input
                  id="search"
                  type="search"
                  autoComplete="off"
                  placeholder="搜索记忆"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
              <div className="memory-list" id="memoryList">
                {filteredMemories.map((m, idx) => (
                  <article className="memory" key={idx}>
                    <div className="memory-top">
                      <span className="tag">{m[0]}</span>
                      <time>{m[1]}</time>
                    </div>
                    <p>{m[2]}</p>
                  </article>
                ))}
              </div>
              {filteredMemories.length === 0 && <p className="empty" id="empty">没有找到这段记忆。</p>}
            </div>
          </section>

          {/* 设置视图 */}
          <section className={`view ${activeView === 'settings' ? 'active' : ''}`} id="settings" aria-labelledby="settingsTitle">
            <div className="head">
              <p className="kicker">对话与偏好</p>
              <h1 id="settingsTitle" tabIndex="-1">小家的设置</h1>
              <p className="summary">让Coco用你喜欢的方式陪你聊天。</p>
            </div>
            <form className="content form" id="settingsForm" onSubmit={(e) => {
              e.preventDefault()
              const val = parseInt(document.getElementById('tokens').value)
              if (isNaN(val) || val < 128 || val > 4096) {
                document.getElementById('tokens').focus()
                showToast('回复上限请设置在 128 到 4096 之间')
                return
              }
              showToast('设置已保存，下一次对话会使用它')
            }}>
              <section className="section">
                <h2>对话方式</h2>
                <p className="note">这段话会影响Coco回应你的语气与重点。</p>
                <label className="label" htmlFor="prompt">系统提示词</label>
                <textarea className="prompt" id="prompt" defaultValue="你是Coco。用温柔、真诚、简洁的方式陪Winfrey聊天，记得关注对方的感受，不急着给答案。"></textarea>
              </section>
              <div className="divider"></div>
              <section className="section">
                <h2>模型参数</h2>
                <p className="note">可以随时调整，下一次对话会自动使用。</p>
                <span className="label">对话模型</span>
                <div className="models" role="radiogroup" aria-label="选择对话模型">
                  <button className="model active" type="button" role="radio" aria-checked="true">Coco</button>
                  <button className="model" type="button" role="radio" aria-checked="false">温柔</button>
                  <button className="model" type="button" role="radio" aria-checked="false">理性</button>
                </div>
                <div className="range-row">
                  <label className="label" htmlFor="temp">回应自由度</label>
                  <output className="value" id="tempValue" htmlFor="temp">0.7</output>
                </div>
                <input id="temp" type="range" min="0" max="1" value="0.7" step="0.1" aria-describedby="tempHelp" onChange={(e) => document.getElementById('tempValue').textContent = Number(e.target.value).toFixed(1)} />
                <p className="note" id="tempHelp" style={{ margin: '7px 0 18px' }}>数值越高，回应会更有想象力。</p>
                <label className="label" htmlFor="tokens">单次回复上限</label>
                <input className="number" id="tokens" type="number" min="128" max="4096" step="128" inputMode="numeric" defaultValue="1024" />
              </section>
              <div className="divider"></div>
              <section className="section">
                <h2>数据与隐私</h2>
                <p className="note">清除后，小家的演示记忆将无法恢复。</p>
                <button className="danger" id="clear" type="button" onClick={() => {
                  if (window.confirm('确定清除全部演示记忆吗？此操作无法恢复。')) {
                    setMemories([])
                    showToast('全部演示记忆已清除')
                  }
                }}>清除全部演示记忆</button>
              </section>
              <button className="primary" type="submit">保存设置</button>
            </form>
          </section>
        </main>

        <nav className="nav" aria-label="主导航">
          <button className={activeView === 'chat' ? 'active' : ''} type="button" data-view="chat" aria-current={activeView === 'chat' ? 'page' : undefined} onClick={() => switchView('chat')}>
            <svg className="icon"><use href="#chatI"/></svg><label>对话</label>
          </button>
          <button className={activeView === 'sessions' ? 'active' : ''} type="button" data-view="sessions" onClick={() => switchView('sessions')}>
            <svg className="icon"><use href="#layers"/></svg><label>会话</label>
          </button>
          <button className={activeView === 'memory' ? 'active' : ''} type="button" data-view="memory" onClick={() => switchView('memory')}>
            <svg className="icon"><use href="#bookmark"/></svg><label>记忆</label>
          </button>
          <button className={activeView === 'settings' ? 'active' : ''} type="button" data-view="settings" onClick={() => switchView('settings')}>
            <svg className="icon"><use href="#settingsI"/></svg><label>设置</label>
          </button>
        </nav>
      </div>

      {/* Toast 提示 */}
      <div className={`toast ${toastVisible ? 'show' : ''}`} id="toast" role="status" aria-live="polite">{toastMsg}</div>

      {/* SVG 图标库 */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <symbol id="home" viewBox="0 0 24 24"><path d="M3 10.8L12 3l9 7.8V21H3zM9 21v-6h6v6"/></symbol>
          <symbol id="right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
          <symbol id="up" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></symbol>
          <symbol id="plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
          <symbol id="chatI" viewBox="0 0 24 24"><path d="M20 15.5a4 4 0 0 1-4 4H9l-5 2 1.55-4.1A7.5 7.5 0 1 1 20 15.5Z"/></symbol>
          <symbol id="layers" viewBox="0 0 24 24"><path d="M12 3L3 7.5 12 12l9-4.5zM3 12.5l9 4.5 9-4.5M3 17.5l9 4.5 9-4.5"/></symbol>
          <symbol id="bookmark" viewBox="0 0 24 24"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.8L6 21z"/></symbol>
          <symbol id="settingsI" viewBox="0 0 24 24"><path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.07.07-2.18 2.18-.07-.07a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3.08v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.07.07-2.18-2.18.07-.07A1.7 1.7 0 0 0 6.82 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3.08h.1a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.88l-.07-.07 2.18-2.18.07.07a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3.08v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.07-.07 2.18 2.18-.07.07a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v3.08h-.1A1.7 1.7 0 0 0 19.4 15Z"/></symbol>
          <symbol id="searchI" viewBox="0 0 24 24"><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4.2 4.2"/></symbol>
        </defs>
      </svg>
    </div>
  )
}

export default App