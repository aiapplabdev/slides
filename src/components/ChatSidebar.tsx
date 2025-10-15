import { useEffect, useRef, useState } from 'react'
import { Info, MessageSquare, Moon, Send, Sparkles, Sun } from 'lucide-react'
import type { Slide } from '../types/slide.types'
import { type AssistantHistoryMessage, getAssistantAnswer } from '../services/ragAssistant'

type Message = {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  fullContent: string
  timestamp: Date
  isComplete: boolean
}

type ChatTab = 'slide-info' | 'insights' | 'assistant'

type ChatSidebarProps = {
  currentSlide: Slide
  triggerInfo: number
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  isOpen: boolean
}

export function ChatSidebar({ currentSlide, triggerInfo, theme, onToggleTheme, isOpen }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [assistantHistory, setAssistantHistory] = useState<AssistantHistoryMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingIntervalRef = useRef<number | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setMessages([])
    setAssistantHistory([])
    setInputValue('')
  }, [currentSlide.id])

  // Trigger typing animation when info button is clicked
  useEffect(() => {
    if (triggerInfo > 0) {
      const content = generateSlideInfoContent(currentSlide)
      typeMessage(content, 'assistant')
    }
  }, [triggerInfo])

  // Clean up typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
    }
  }, [])

  const generateSlideInfoContent = (slide: Slide): string => {
    let content = `## ${slide.info.title}\n\n${slide.info.body}\n\n`
    
    if (slide.info.utility) {
      content += `### Why it matters\n${slide.info.utility}\n\n`
    }
    
    if (slide.benchmark) {
      content += `### Benchmark focus\n${slide.benchmark}`
    }
    
    return content
  }

  const typeMessage = (fullText: string, type: 'user' | 'assistant' | 'system') => {
    const messageId = `${type}-${Date.now()}`
    const newMessage: Message = {
      id: messageId,
      type,
      content: '',
      fullContent: fullText,
      timestamp: new Date(),
      isComplete: false,
    }

    setMessages((prev) => [...prev, newMessage])

    let currentIndex = 0
    const typingSpeed = 20 // milliseconds per character

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }

    typingIntervalRef.current = window.setInterval(() => {
      if (currentIndex < fullText.length) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: fullText.substring(0, currentIndex + 1) }
              : msg
          )
        )
        currentIndex++
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current)
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isComplete: true } : msg
          )
        )
      }
    }, typingSpeed)
  }

  const appendUserMessage = (userText: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userText,
      fullContent: userText,
      timestamp: new Date(),
      isComplete: true,
    }
    setMessages((prev) => [...prev, userMessage])
  }

  const handleUserQuery = async (userText: string) => {
    appendUserMessage(userText)

    const historyWindow = assistantHistory.slice(-8)
    setIsLoading(true)

    try {
      const { answer, citations } = await getAssistantAnswer(userText, currentSlide, historyWindow)
      const citationSection = citations.length > 0
        ? `\n\n### Sources\n${citations.map((chunk) => `• ${chunk.title}`).join('\n')}`
        : ''
      const formattedAnswer = `${answer.trim()}${citationSection}`.trim()

      const updatedHistory: AssistantHistoryMessage[] = [
        ...historyWindow,
        { role: 'user', content: userText } as const,
        { role: 'assistant', content: formattedAnswer } as const,
      ]

      setAssistantHistory(updatedHistory.slice(-12))
      typeMessage(formattedAnswer, 'assistant')
    } catch (error) {
      console.error('Assistant response error', error)
      typeMessage(
        'I encountered an issue retrieving insights from Azure OpenAI. Please verify the configuration and try again.',
        'assistant',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userText = inputValue.trim()
    setInputValue('')

    await handleUserQuery(userText)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const promptBubbles: { id: ChatTab; label: string; icon: typeof MessageSquare }[] = [
    { id: 'slide-info', label: 'Slide Info', icon: Info },
    { id: 'insights', label: 'Insights', icon: Sparkles },
  ]

  const handlePromptClick = (promptType: ChatTab) => {
    if (isLoading) return
    let promptText = ''
    
    if (promptType === 'slide-info') {
      promptText = 'Tell me about this slide'
    } else if (promptType === 'insights') {
      promptText = 'Show me detailed insights'
    } else if (promptType === 'assistant') {
      promptText = 'How can you help me?'
    }
    
    // Set the input value and send it
    setInputValue(promptText)
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: promptText,
      fullContent: promptText,
      timestamp: new Date(),
      isComplete: true,
    }
    setMessages((prev) => [...prev, userMessage])
    
    // Generate response based on prompt type
    setTimeout(() => {
      let responseText = ''
      
      if (promptType === 'slide-info') {
        responseText = generateSlideInfoContent(currentSlide)
      } else if (promptType === 'insights' && currentSlide.info.insights) {
        responseText = `## Detailed Insights\n\n${currentSlide.info.insights}`
      } else if (promptType === 'assistant') {
        responseText = `I can help you understand this slide better. Try asking about:\n- Benchmarks and metrics\n- Why this information matters\n- Specific details about the content`
      }
      
      typeMessage(responseText, 'assistant')
      setAssistantHistory((prev) => {
        const base = prev.slice(-10)
        const updated = [
          ...base,
          { role: 'user', content: promptText } as const,
          { role: 'assistant', content: responseText } as const,
        ]
        return updated.slice(-12)
      })
    }, 500)
    
    // Clear input after sending
    setInputValue('')
  }

  return (
    <aside className={`chat-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-header">
        <div className="chat-header-content">
          <MessageSquare size={18} />
          <span className="chat-title">Assistant</span>
        </div>
        <button
          type="button"
          className="theme-toggle-sidebar"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.type}`}>
            <div className="message-content">
              {message.content.split('\n').map((line, idx) => {
                if (line.startsWith('## ')) {
                  return <h3 key={idx}>{line.replace('## ', '')}</h3>
                }
                if (line.startsWith('### ')) {
                  return <h4 key={idx}>{line.replace('### ', '')}</h4>
                }
                if (line.trim() === '---') {
                  return <hr key={idx} className="insight-separator" />
                }
                if (line.startsWith('• ')) {
                  return <li key={idx} className="insight-bullet">{line.replace('• ', '')}</li>
                }
                if (line.trim() === '') {
                  return <br key={idx} />
                }
                // Handle bold text **text**
                const boldRegex = /\*\*(.*?)\*\*/g
                if (boldRegex.test(line)) {
                  const parts = line.split(boldRegex)
                  return (
                    <p key={idx}>
                      {parts.map((part, i) => 
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </p>
                  )
                }
                return <p key={idx}>{line}</p>
              })}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message system">
            <div className="message-content">
              <p>Analyzing slide context…</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="prompt-bubbles">
        {promptBubbles
          .filter((bubble) => {
            // Only show Insights bubble if slide has insights
            if (bubble.id === 'insights') {
              return currentSlide.info.insights && currentSlide.info.insights.trim() !== ''
            }
            return true
          })
          .map((bubble) => {
            const Icon = bubble.icon
            return (
              <button
                key={bubble.id}
                className="prompt-bubble"
                onClick={() => handlePromptClick(bubble.id)}
              >
                <Icon size={14} />
                <span>{bubble.label}</span>
              </button>
            )
          })}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about this slide..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className="chat-send"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </aside>
  )
}
