/**
 * ChatbotWidget - Trợ lý CSKH Gemini AI nổi góc phải toàn hệ thống
 * Kết nối BE ChatbotController:
 *   GET  /api/chat/status -> { configured, model }
 *   POST /api/chat        -> { message, previousInteractionId } -> { reply, interactionId, model }
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquareHeart,
  Sparkles,
  Send,
  X,
  RotateCcw,
  AlertCircle,
  Bot,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { chatApi } from '../services/api'

const MAX_MESSAGE_LENGTH = 2000

const GUEST_SUGGESTIONS = [
  'Hiện có những sự kiện nào đang mở bán?',
  'Quy định giữ chỗ 10 phút & thanh toán VietQR thế nào?',
  'Có vật phẩm lưu niệm nào đang bán kèm?',
]

const USER_SUGGESTIONS = [
  'Kiểm tra trạng thái các đơn hàng gần nhất của tôi',
  'Hiện có những sự kiện nào đang mở bán?',
  'Làm sao để lấy mã QR check-in sau khi thanh toán?',
]

function renderInlineMarkdown(line, keyPrefix) {
  // Hỗ trợ **bold** và `code` an toàn bằng React nodes
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`${keyPrefix}-b-${idx}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={`${keyPrefix}-c-${idx}`}>{part.slice(1, -1)}</code>
    }
    return <span key={`${keyPrefix}-t-${idx}`}>{part}</span>
  })
}

function FormattedReply({ text }) {
  const lines = (text || '').split('\n')
  return (
    <div className="chatbot-formatted">
      {lines.map((rawLine, i) => {
        const trimmed = rawLine.trim()
        if (!trimmed) {
          return <div key={`sp-${i}`} style={{ height: 6 }} />
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={`li-${i}`} className="chatbot-bullet-line">
              <span className="chatbot-bullet-dot">•</span>
              <span>{renderInlineMarkdown(trimmed.slice(2), `li-${i}`)}</span>
            </div>
          )
        }
        return (
          <p key={`p-${i}`} className="chatbot-paragraph">
            {renderInlineMarkdown(rawLine, `p-${i}`)}
          </p>
        )
      })}
    </div>
  )
}

export default function ChatbotWidget() {
  const { user, isLoggedIn } = useAuth()
  const storageKey = `megaticket_chat_${user?.email || 'guest'}`

  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState({ checked: false, configured: false, model: 'gemini', offline: false })
  const [messages, setMessages] = useState([])
  const [interactionId, setInteractionId] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [waitingFirstToken, setWaitingFirstToken] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Khôi phục lịch sử hội thoại theo user hiện tại
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        setMessages(Array.isArray(parsed.messages) ? parsed.messages : [])
        setInteractionId(parsed.interactionId || null)
      } else {
        setMessages([])
        setInteractionId(null)
      }
    } catch {
      setMessages([])
      setInteractionId(null)
    }
  }, [storageKey])

  // Lưu hội thoại vào sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ messages, interactionId }))
    } catch {
      // ignore storage quota errors
    }
  }, [storageKey, messages, interactionId])

  const checkStatus = useCallback(async () => {
    try {
      const res = await chatApi.getStatus()
      setStatus({
        checked: true,
        configured: Boolean(res?.configured),
        model: res?.model || 'gemini-3.8-flash',
        offline: false,
      })
    } catch {
      setStatus({
        checked: true,
        configured: false,
        model: 'gemini',
        offline: true,
      })
    }
  }, [])

  useEffect(() => {
    if (isOpen && !status.checked) {
      checkStatus()
    }
  }, [isOpen, status.checked, checkStatus])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, sending, isOpen])

  function handleReset() {
    setMessages([])
    setInteractionId(null)
    sessionStorage.removeItem(storageKey)
    textareaRef.current?.focus()
  }

  async function sendMessage(rawText) {
    const trimmed = (rawText ?? input).trim()
    if (!trimmed || sending) return
    if (trimmed.length > MAX_MESSAGE_LENGTH) return

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    if (rawText === undefined) setInput('')
    setSending(true)
    setWaitingFirstToken(true)

    const assistantId = `a-${Date.now()}`
    let receivedAnyChunk = false

    try {
      await chatApi.streamMessage(
        {
          message: trimmed,
          ...(interactionId ? { previousInteractionId: interactionId } : {}),
        },
        {
          onDelta: (chunk) => {
            if (!receivedAnyChunk) {
              receivedAnyChunk = true
              setWaitingFirstToken(false)
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantId,
                  role: 'assistant',
                  text: chunk,
                  createdAt: new Date().toISOString(),
                },
              ])
            } else {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + chunk } : m))
              )
            }
          },
          onDone: (meta) => {
            if (meta?.interactionId) {
              setInteractionId(meta.interactionId)
            }
            if (meta?.model) {
              setStatus((prev) => ({
                ...prev,
                checked: true,
                configured: true,
                offline: false,
                model: meta.model,
              }))
            }
          },
        }
      )

      if (!receivedAnyChunk) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            text: 'Xin lỗi, tôi chưa nhận được phản hồi từ AI.',
            createdAt: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'error',
          text: err.message || 'Không thể kết nối tới trợ lý AI. Vui lòng thử lại.',
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setWaitingFirstToken(false)
      setSending(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = isLoggedIn ? USER_SUGGESTIONS : GUEST_SUGGESTIONS

  return (
    <div className="chatbot-root">
      {/* Chat Drawer */}
      {isOpen && (
        <section className="chatbot-window" aria-label="Chatbot CSKH MegaTicket">
          {/* Header */}
          <header className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="chatbot-title">Trợ lý AI MegaTicket</div>
                <div className="chatbot-status-line">
                  <span
                    className={`chatbot-status-dot ${
                      status.offline
                        ? 'offline'
                        : status.configured
                        ? 'online'
                        : 'unconfigured'
                    }`}
                  />
                  <span>
                    {!status.checked
                      ? 'Đang kiểm tra kết nối...'
                      : status.offline
                      ? 'Chưa kết nối BE'
                      : status.configured
                      ? `${status.model} · Sẵn sàng`
                      : 'Chưa cấu hình GEMINI_API_KEY'}
                  </span>
                </div>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={handleReset}
                title="Cuộc trò chuyện mới"
                disabled={sending || messages.length === 0}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Thu gọn"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* Personalized Context Pill */}
          {isLoggedIn && (
            <div className="chatbot-context-strip">
              <UserCheck size={13} />
              <span>
                Đang hỗ trợ theo tài khoản <strong>{user?.fullName}</strong> (kèm lịch sử đơn hàng)
              </span>
            </div>
          )}

          {/* Unconfigured Hint */}
          {status.checked && !status.configured && !status.offline && (
            <div className="chatbot-warning-strip">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>
                Backend chưa có biến môi trường <code>GEMINI_API_KEY</code>. Thiết lập key tại server để kích hoạt trả lời AI.
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-icon">
                  <Bot size={26} />
                </div>
                <h4>Xin chào{isLoggedIn ? ` ${user?.fullName}` : ''}!</h4>
                <p>
                  Tôi là trợ lý CSKH Gemini AI của MegaTicket. Bạn cần tư vấn lịch sự kiện, hạng vé trống, vật phẩm hay kiểm tra đơn hàng?
                </p>

                <div className="chatbot-suggestions">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="chatbot-suggestion-chip"
                      onClick={() => sendMessage(q)}
                      disabled={sending}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`chatbot-msg-row ${m.role}`}>
                  {m.role === 'assistant' && (
                    <div className="chatbot-msg-bot-icon">
                      <Sparkles size={13} />
                    </div>
                  )}
                  <div className={`chatbot-bubble ${m.role}`}>
                    {m.role === 'assistant' ? (
                      <FormattedReply text={m.text} />
                    ) : m.role === 'error' ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{m.text}</span>
                      </div>
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
                    )}
                  </div>
                </div>
              ))
            )}

            {waitingFirstToken && (
              <div className="chatbot-msg-row assistant">
                <div className="chatbot-msg-bot-icon">
                  <Sparkles size={13} />
                </div>
                <div className="chatbot-bubble assistant typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer */}
          <form
            className="chatbot-composer"
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Hỏi về sự kiện, giá vé, thanh toán VietQR..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!input.trim() || sending}
              aria-label="Gửi tin nhắn"
            >
              <Send size={16} />
            </button>
          </form>

          {input.length > 1600 && (
            <div className="chatbot-char-count">
              {input.length}/{MAX_MESSAGE_LENGTH} ký tự
            </div>
          )}
        </section>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        className={`chatbot-launcher ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý CSKH Gemini AI'}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <>
            <MessageSquareHeart size={21} />
            <span className="chatbot-launcher-label">CSKH AI</span>
          </>
        )}
      </button>
    </div>
  )
}
