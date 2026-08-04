import { useState, useEffect, useRef } from 'react'
import './App.css'

// --- 后端 API 地址（替换成你的 Render 地址） ---
const API_BASE = 'https://winfrey-coco.onrender.com'

function App() {
  // ---------- UI 状态 ----------
  const [isWelcomeHidden, setIsWelcomeHidden] = useState(false)
  const [activeView, setActiveView] = useState('chat')
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // ---------- Refs ----------
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const toastTimerRef = useRef(null)

  // ---------- 工具函数 ----------
  const showToast = (msg) => {
    clearTimeout(toastTimerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3200)
  }

  // ---------- 数据加载函数 ----------
  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions`)
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
        // 如果有会话，默认选中第一个
        if (data.sessions.length > 0 && !activeSessionId) {
          setActiveSessionId(data.sessions[0].id)
        }
      }
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }

  const loadMessages = async (sessionId) => {
    if (!sessionId) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/messages/${sessionId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('加载消息失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ---------- 初始化 ----------
  useEffect(() => {
    loadSessions()
  }, [])

  // 当激活的会话改变时，加载对应的消息
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId)
    }
  }, [activeSessionId])

  // 滚动到底部
  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }, [messages, activeView])

  // ---------- 核心操作函数 ----------
  const switchView = (view) => {
    setActiveView(view)
  }

  const switchSession = (id) => {
    setActiveSessionId(id)
    setActiveView('chat')
  }

  const newChat = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '新对话' })
      })
      const data = await res.json()
      if (data.success) {
        setSessions(prev => [data.session, ...prev])
        setActiveSessionId(data.session.id)
        setMessages([])
        setActiveView('chat')
        showToast('新会话已创建')
      }
    } catch (error) {
      showToast('创建会话失败')
    }
  }

  const sendMessage = async () => {
    const text = messageText.trim()
    if (!text || isSending) {
      textareaRef.current?.focus()
      return
    }

    // 1. 临时添加用户消息到界面（乐观更新）
    const tempUserMsg = {
      id: Date.now(),
      session_id: activeSessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
      visible: true
    }
    setMessages(prev => [...prev, tempUserMsg])
    setMessageText('')
    setIsSending(true)

    try {
      // 2. 发送给后端
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: activeSessionId
        })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || '请求失败')
      }

      // 3. 如果返回了新的 session_id（首次对话），更新当前会话
      if (data.session_id && data.session_id !== activeSessionId) {
        setActiveSessionId(data.session_id)
        // 重新加载会话列表
        loadSessions()
      }

      // 4. 替换临时用户消息为真实消息（或者重新加载消息列表）
      // 为了简单，直接重新加载当前会话的消息
      if (data.session_id) {
        await loadMessages(data.session_id)
      } else if (activeSessionId) {
        await loadMessages(activeSessionId)
      }

    } catch (error) {
      console.error('发送消息失败:', error)
      showToast('发送失败，请重试')
      // 移除刚才临时添加的消息
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  // 获取当前会话名称
  const currentSession = sessions.find(s => s.id === activeSessionId)

  // ---------- 渲染 ----------
  return (
    <div className="stage">
      {/* 欢迎页 */}
      <section className="welcome" hidden={isWelcomeHidden}>
        {/* ... 欢迎页内容保持不变（省略复制，你自己保留）... */}
        <p className="mark"><span className="house-mark" aria-hidden="true"></span>WINFREY &amp; COCO</p>
        <div className="welcome-main">
          <div className="scene" aria-hidden="true">{/* SVG 绘图保持不变 */}</div>
          <p className="eyebrow">一个安静的对话空间</p>
          <h1 id="welcomeTitle">Winfrey和Coco的小家</h1>
          <p className="welcome-copy">把想说的话，慢慢留在这里。</p>
        </div>
        <div>
          <button className="primary" onClick={() => setIsWelcomeHidden(true)}>
            进入小家 <svg className="icon"><use href="#right"/></svg>
          </button>
          <small>此刻，只有你和我。</small>
        </div>
      </section>

      {/* 主应用 */}
      <div className="app" hidden={!isWelcomeHidden}>
        <header className="top">
          <button className="home-btn" onClick={() => setIsWelcomeHidden(false)}>
            <svg className="icon"><use href="#home"/></svg>
          </button>
          <div className="top-name">
            <b>Winfrey和Coco的小家</b>
            <span><i className="dot"></i>Coco在线</span>
          </div>
        </header>

        <main className="main">
          {/* 聊天视图 */}
          <section className={`view ${activeView === 'chat' ? 'active' : ''}`}>
            <div className="chat-meta">
              <div>
                <span>正在聊天</span>
                <h1>{currentSession?.name || '加载中...'}</h1>
              </div>
              <button className="new" onClick={newChat}>
                <svg className="icon"><use href="#plus"/></svg>新聊
              </button>
            </div>
            <div className="line"></div>
            <div className="messages" ref={messagesEndRef}>
              {isLoading && <p style={{textAlign:'center', color:'#999'}}>加载中...</p>}
              {!isLoading && messages.map((m) => (
                <article className={`message ${m.role === 'user' ? 'mine' : ''}`} key={m.id}>
                  <div className="avatar">{m.role === 'user' ? 'W' : 'C'}</div>
                  <div className="copy">
                    <p className="who">{m.role === 'user' ? 'Winfrey' : 'Coco'}</p>
                    <p className="bubble">{m.content}</p>
                    <time className="time">{new Date(m.created_at).toLocaleTimeString()}</time>
                  </div>
                </article>
              ))}
              {messages.length === 0 && !isLoading && (
                <p style={{textAlign:'center', color:'#999', marginTop: 40}}>还没有消息，开始聊天吧</p>
              )}
            </div>
            <div className="composer-wrap">
              <form className="composer" onSubmit={(e) => { e.preventDefault(); sendMessage() }}>
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
                  disabled={isSending}
                />
                <button className="send" type="submit" disabled={isSending || !messageText.trim()}>
                  <svg className="icon"><use href="#up"/></svg>
                </button>
              </form>
            </div>
          </section>

          {/* 会话列表视图 */}
          <section className={`view ${activeView === 'sessions' ? 'active' : ''}`}>
            <div className="head row">
              <div>
                <p className="kicker">会话管理</p>
                <h1>我们聊过的事</h1>
                <p className="summary">每一段对话，都有它自己的位置。</p>
              </div>
              <button className="add" onClick={newChat}>
                <svg className="icon"><use href="#plus"/></svg>新建
              </button>
            </div>
            <div className="content">
              <div className="session-list">
                {sessions.map(s => (
                  <button
                    type="button"
                    className={`session ${s.id === activeSessionId ? 'active' : ''}`}
                    key={s.id}
                    onClick={() => switchSession(s.id)}
                  >
                    <span>
                      <b>{s.id === activeSessionId && <i></i>}{s.name}</b>
                      <em>{s.id === 1 ? '全局默认' : '点击查看对话'}</em>
                    </span>
                    <time>{new Date(s.updated_at).toLocaleDateString()}</time>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 设置视图（保持简洁） */}
          <section className={`view ${activeView === 'settings' ? 'active' : ''}`}>
            <div className="head">
              <p className="kicker">对话与偏好</p>
              <h1>设置</h1>
              <p className="summary">让Coco用你喜欢的方式陪你聊天。</p>
            </div>
            <div className="content">
              <p style={{color: '#666'}}>设置功能开发中，后端接口已就绪。</p>
            </div>
          </section>
        </main>

        <nav className="nav">
          <button className={activeView === 'chat' ? 'active' : ''} onClick={() => switchView('chat')}>
            <svg className="icon"><use href="#chatI"/></svg><label>对话</label>
          </button>
          <button className={activeView === 'sessions' ? 'active' : ''} onClick={() => switchView('sessions')}>
            <svg className="icon"><use href="#layers"/></svg><label>会话</label>
          </button>
          <button className={activeView === 'settings' ? 'active' : ''} onClick={() => switchView('settings')}>
            <svg className="icon"><use href="#settingsI"/></svg><label>设置</label>
          </button>
        </nav>
      </div>

      {/* Toast */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toastMsg}</div>

      {/* SVG 图标（保留原样） */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <symbol id="home" viewBox="0 0 24 24"><path d="M3 10.8L12 3l9 7.8V21H3zM9 21v-6h6v6"/></symbol>
          <symbol id="right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
          <symbol id="up" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></symbol>
          <symbol id="plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
          <symbol id="chatI" viewBox="0 0 24 24"><path d="M20 15.5a4 4 0 0 1-4 4H9l-5 2 1.55-4.1A7.5 7.5 0 1 1 20 15.5Z"/></symbol>
          <symbol id="layers" viewBox="0 0 24 24"><path d="M12 3L3 7.5 12 12l9-4.5zM3 12.5l9 4.5 9-4.5M3 17.5l9 4.5 9-4.5"/></symbol>
          <symbol id="settingsI" viewBox="0 0 24 24"><path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.07.07-2.18 2.18-.07-.07a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3.08v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.07.07-2.18-2.18.07-.07A1.7 1.7 0 0 0 6.82 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3.08h.1a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.88l-.07-.07 2.18-2.18.07.07a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3.08v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.07-.07 2.18 2.18-.07.07a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v3.08h-.1A1.7 1.7 0 0 0 19.4 15Z"/></symbol>
        </defs>
      </svg>
    </div>
  )
}

export default App