import { useState, useRef, useEffect } from "react"
import CloseButton from "../components/CloseButton"

function Chatbox() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! Welcome to Outreach Hope Church Sunshine. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const faqDatabase = [{
    keywords: ["hello", "hey", "how are you", "whats up", "mambo", "good morning", "good afternoon", "good evening", "how are you doing", "how are you", "how is", "how's"],
    answer: "hey am fine..how can i help you"
  },
  {
    keywords: ["time", "service", "when", "hours", "sunday"],
    answer: "Our Sunday services are held at 9:00 AM and 11:00 AM. We also have a Wednesday evening Bible study at 7:00 PM."
  },
  {
    keywords: ["location", "where", "address", "directions", "map"],
    answer: "We are located at Sunshine Place,off JOSKA, Nairobi. You can find full directions on our About page!"
  },
  {
    keywords: ["pastor", "pastors", "number", "call pastor", "pastor number"],
    answer: "You can reach Rev Clinton OKANGA at 0759162559 for urgent pastoral care. For general inquiries, call the church office at (555) 123-4567."
  },
  {
    keywords: ["give", "donate", "tithe", "offering", "pay"],
    answer: "You can easily give online through our Give page using card or mobile money, or in person during any of our services."
  },
  {
    keywords: ["contact", "phone", "email", "reach", "office"],
    answer: "You can reach our church office at 0759162559 or email us at hello@outreachhope.org. Our office hours are Monday-Friday, 9 AM - 4 PM."
  },
  {
    keywords: ["prayer", "pray", "request"],
    answer: "We would love to pray for you. Please visit our Prayer Requests page to submit your request, and our intercessory team will keep you in prayer."
  },
  {
    keywords: ["event", "calendar", "upcoming", "activities"],
    answer: "We have many exciting events coming up! Check out our Events page for the full calendar and to register for upcoming activities."
  },
  {
    keywords: ["kids", "children", "youth", "childcare", "nursery"],
    answer: "Yes! We have a vibrant Kids Ministry for ages newborn through 5th grade during all Sunday services, and a Youth Group that meets on Wednesday nights."
  },
  {
    keywords: ["wear", "dress code", "clothes"],
    answer: "Come as you are! There is no dress code. You'll see everything from jeans and t-shirts to suits and dresses."
  }
  ]

  const getBotResponse = (userMessage) => {
    const lowerInput = userMessage.toLowerCase()

    // Check FAQs
    for (const faq of faqDatabase) {
      if (faq.keywords.some(keyword => lowerInput.includes(keyword))) {
        return faq.answer
      }
    }

    // Default response
    return "Thank you for reaching out! I'm here to help with any inquiries."
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userText = input.trim()
    const newMessage = { sender: "user", text: userText }

    setMessages(prev => [...prev, newMessage])
    setInput("")
    setIsTyping(true)

    // Simulate network delay for realistic feel
    setTimeout(() => {
      const botReply = { sender: "bot", text: getBotResponse(userText) }
      setMessages(prev => [...prev, botReply])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div style={{
      maxWidth: "450px",
      margin: "40px auto",
      backgroundColor: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      height: "75vh",
      position: "relative",
      overflow: "hidden",
      border: "1px solid #f0f0f0"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#0ea5e9",
        padding: "20px",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>

          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Outreach Support</h3>
            <span style={{ fontSize: "12px", opacity: 0.9 }}>We typically reply instantly</span>
          </div>
        </div>
        <CloseButton />
      </div>

      {/* Chat Body */}
      <div style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ textAlign: "center", margin: "10px 0 20px 0" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8", backgroundColor: "#e2e8f0", padding: "4px 12px", borderRadius: "12px" }}>Today</span>
        </div>

        {messages.map((msg, index) => (
          <div key={index} style={{
            display: "flex",
            justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end",
            gap: "8px"
          }}>
            {msg.sender === "bot" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                OHC
              </div>
            )}
            <div style={{
              padding: "12px 16px",
              borderRadius: "18px",
              borderBottomLeftRadius: msg.sender === "bot" ? "4px" : "18px",
              borderBottomRightRadius: msg.sender === "user" ? "4px" : "18px",
              backgroundColor: msg.sender === "user" ? "#0ea5e9" : "#ffffff",
              color: msg.sender === "user" ? "white" : "#334155",
              boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
              maxWidth: "75%",
              wordWrap: "break-word",
              fontSize: "14px",
              lineHeight: "1.5",
              border: msg.sender === "bot" ? "1px solid #f1f5f9" : "none"
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
              OHC
            </div>
            <div style={{
              padding: "14px 16px",
              borderRadius: "18px",
              borderBottomLeftRadius: "4px",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
              border: "1px solid #f1f5f9",
              display: "flex",
              gap: "4px"
            }}>
              <span className="typing-dot" style={{ width: "6px", height: "6px", backgroundColor: "#cbd5e1", borderRadius: "50%", display: "inline-block", animation: "typing 1.4s infinite ease-in-out both" }}></span>
              <span className="typing-dot" style={{ width: "6px", height: "6px", backgroundColor: "#cbd5e1", borderRadius: "50%", display: "inline-block", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.2s" }}></span>
              <span className="typing-dot" style={{ width: "6px", height: "6px", backgroundColor: "#cbd5e1", borderRadius: "50%", display: "inline-block", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: "16px",
        backgroundColor: "#ffffff",
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            outline: "none",
            backgroundColor: "#f8fafc",
            fontSize: "14px",
            color: "#334155",
            transition: "border-color 0.2s, box-shadow 0.2s"
          }}
          onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; e.target.style.backgroundColor = "#ffffff"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f8fafc"; }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            backgroundColor: input.trim() ? "#0ea5e9" : "#bae6fd",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
            flexShrink: 0
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      {/* Adding inline styles for animations */}
      <style>{`
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.6; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        /* Modern scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

export default Chatbox
