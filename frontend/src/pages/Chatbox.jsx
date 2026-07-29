import { useState, useRef, useEffect } from "react"
import CloseButton from "../components/CloseButton"
import axios from "axios"
import { Link } from "react-router-dom"

const churchKnowledge = [
  {
    id: "welcome",
    keywords: ["hello", "hi","mambo" ,"sasa","hey", "good morning", "good afternoon", "good evening", "mambo"],
    answer: "Hello! Welcome to Outreach Hope Church Sunshine — the House of Bread. I can help with our beliefs, services, events, sermons, prayer, baptism, giving, ministries, careers, membership, or contact details."
  },
  {
    id: "identity",
    keywords: ["about the church", "who are you", "what is ohc", "house of bread", "church history", "about ohc"],
    answer: "Outreach Hope Church Sunshine (OHC), also known as the House of Bread, is a Christ-centered community. The church has more than 15 years of ministry, has served 500+ families, and highlights more than 50 community projects.",
    path: "/about"
  },
  {
    id: "mission",
    keywords: ["mission", "purpose", "why does the church exist"],
    answer: "Our mission is to proclaim the Gospel of Jesus Christ in word and deed, nurturing believers toward maturity through biblical teaching, authentic fellowship, sacrificial service, and intentional community engagement.",
    path: "/about"
  },
  {
    id: "vision",
    keywords: ["vision", "future of the church"],
    answer: "Our vision is to be a Christ-centered community that raises mature disciples, plants thriving churches, and transforms communities through the Gospel, presenting everyone mature in Christ.",
    path: "/about"
  },
  {
    id: "goal",
    keywords: ["five year goal", "5 year goal", "growth goal", "plant churches", "500 members"],
    answer: "OHC's five-year goal is to grow from 150 to 500 members and plant 10 churches across Machakos and other parts of the world.",
    path: "/about"
  },
  {
    id: "values",
    keywords: ["core values", "values", "what do you value"],
    answer: "Our core values are the supremacy of Scripture, dependence on God through prayer, discipleship and spiritual maturity, authentic fellowship, Gospel proclamation, sacrificial service and compassion, investment in marriage and family, and Kingdom collaboration.",
    path: "/about"
  },
  {
    id: "beliefs",
    keywords: ["belief", "believe", "doctrine", "faith", "scripture"],
    answer: "OHC is centered on Scripture, prayer, the Gospel of Jesus Christ, discipleship, fellowship, compassion, family, and Kingdom collaboration. The About page explains the church's mission, vision, values, and supporting Bible passages.",
    path: "/about"
  },
  {
    id: "services",
    keywords: ["service time", "service times", "weekly service", "sunday service", "when is service", "bible study time", "morning glory"],
    answer: "Weekly services include Morning Glory from 7:00–8:00 AM, Bible Study from 8:00–10:00 AM, and the Main Service from 10:00 AM–12:30 PM. The online schedule also lists Wednesday Study from 6:30–8:00 PM.",
    path: "/services"
  },
  {
    id: "online",
    keywords: ["online service", "live stream", "watch online", "youtube", "zoom", "facebook live"],
    answer: "You can join the Online Sanctuary for the Sunday worship stream, Zoom fellowship, and Facebook Live. The weekly online schedule lists Sunday 10:00 AM–12:30 PM and Wednesday Study 6:30–8:00 PM.",
    path: "/online-service"
  },
  {
    id: "location",
    keywords: ["location", "where is the church", "address", "directions", "map", "visit"],
    answer: "Outreach Hope Church Sunshine serves the Sunshine/Joska area in Machakos. The About page includes an embedded map to help you navigate to the church.",
    path: "/about"
  },
  {
    id: "contact",
    keywords: ["contact", "phone number", "call church", "email address", "reach church", "website"],
    answer: "Call OHC on +254 722 539 649, email outreachhopechurch.sunshine@gmail.com, or visit outreachhopechurch.org.",
    path: "/about"
  },
  {
    id: "prayer",
    keywords: ["prayer request", "pray for me", "need prayer", "prayer"],
    answer: "We would be honored to pray with you. Signed-in members can submit a prayer request through the Prayer Requests page for the church prayer team.",
    path: "/prayerRequests"
  },
  {
    id: "baptism",
    keywords: ["baptism", "baptize", "baptised", "baptized", "water baptism"],
    answer: "Members aged 10 and above can request water baptism. Preferred dates must be upcoming Saturdays or Sundays, and you can track the request and download a baptism card when completed.",
    path: "/baptism"
  },
  {
    id: "giving",
    keywords: ["give", "giving", "donate", "tithe", "offering", "m-pesa", "mpesa", "stk", "building fund", "missions fund"],
    answer: "The Give page supports secure M-Pesa STK giving. Available categories include Offering, Tithe, Missions Fund, Building Fund, and Others.",
    path: "/give"
  },
  {
    id: "membership",
    keywords: ["sign up", "signup", "register", "membership", "become a member", "member account"],
    answer: "Use Sign Up to create a member account. Members can access services and sermons, submit prayer and baptism requests, give, register for events, and manage their Profile & Settings.",
    path: "/signup"
  },
  {
    id: "profile",
    keywords: ["profile", "settings", "change password", "dark mode", "light mode", "residence"],
    answer: "Profile & Settings lets members update personal details and residence, change passwords, choose Light, Dark, or System mode, adjust text size and motion, and manage update preferences.",
    path: "/profile"
  },
  {
    id: "events",
    keywords: ["event", "events", "calendar", "upcoming activity", "register for event"],
    answer: "The Events page lists upcoming and past church activities, with dates, locations, descriptions, banners, and attendance registration.",
    path: "/events"
  },
  {
    id: "sermons",
    keywords: ["sermon", "sermons", "preaching", "teaching notes", "download sermon"],
    answer: "The Sermon Library contains searchable teaching notes with scripture, preacher, category, PDF and Word downloads, bookmarks, and related sermons.",
    path: "/sermons"
  },
  {
    id: "bible",
    keywords: ["bible", "read scripture", "read the bible"],
    answer: "Use the Bible page to read Scripture as part of your study and reflection.",
    path: "/bible"
  },
  {
    id: "gallery",
    keywords: ["gallery", "photos", "pictures", "videos", "media"],
    answer: "The Gallery contains folders of photos and videos from church services, outreach, events, and community life. Images can also be opened and downloaded.",
    path: "/gallery"
  },
  {
    id: "careers",
    keywords: ["career", "careers", "opportunity", "opportunities", "job", "internship", "volunteer", "advertise", "share idea", "business idea"],
    answer: "The Careers & Ideas Hub lets members share ministry projects, professional skills, businesses, services, and community ideas. The separate Opportunities page is for roles, internships, volunteering, advertisements, and external opportunity links.",
    path: "/careers"
  },
  {
    id: "ministers",
    keywords: ["minister", "ministers", "pastor", "leadership", "church leaders"],
    answer: "The Ministers page introduces OHC's ministry team and the areas they serve, including family, discipleship, fellowship, and spiritual maturity.",
    path: "/ministers"
  }
]

function findKnowledgeAnswer(message) {
  const normalized = String(message || "").toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ")
  let bestMatch = null
  let bestScore = 0

  churchKnowledge.forEach((entry) => {
    const score = entry.keywords.reduce((total, keyword) => {
      if (!normalized.includes(keyword)) return total
      return total + keyword.split(/\s+/).length * 3 + keyword.length / 20
    }, 0)
    if (score > bestScore) {
      bestScore = score
      bestMatch = entry
    }
  })

  return bestMatch
}

function Chatbox() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! Welcome to Outreach Hope Church Sunshine. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [liveInfo, setLiveInfo] = useState({ events: [], sermons: [] })
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    let active = true
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    Promise.allSettled([
      axios.get("/events"),
      axios.get("/api/sermons", { params: { page: 1, limit: 3, sort: "latest" } })
    ]).then(([eventsResult, sermonsResult]) => {
      if (!active) return
      const events = eventsResult.status === "fulfilled"
        ? (eventsResult.value.data || [])
          .filter((event) => new Date(event.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
        : []
      const sermons = sermonsResult.status === "fulfilled"
        ? sermonsResult.value.data.sermons || []
        : []
      setLiveInfo({ events, sermons })
    })

    return () => { active = false }
  }, [])

  const getBotResponse = (userMessage) => {
    const lowerInput = userMessage.toLowerCase()

    if (/(next|upcoming|latest|recent).*(event|activity)|(event|activity).*(next|upcoming)/.test(lowerInput) && liveInfo.events.length) {
      const event = liveInfo.events[0]
      const date = new Date(event.date).toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })
      return { text: `The next listed event is "${event.title}" on ${date}${event.location ? ` at ${event.location}` : ""}.`, path: "/events" }
    }

    if (/(latest|recent|new).*(sermon|teaching)|(sermon|teaching).*(latest|recent|new)/.test(lowerInput) && liveInfo.sermons.length) {
      const sermon = liveInfo.sermons[0]
      return { text: `The latest listed sermon is "${sermon.title}" by ${sermon.preacher}, based on ${sermon.scripture}.`, path: `/sermons/${sermon._id}` }
    }

    const match = findKnowledgeAnswer(userMessage)
    if (match) return { text: match.answer, path: match.path }
    return { text: "I don't have a verified answer for that yet. Try asking about OHC's mission, service times, events, sermons, prayer, baptism, giving, ministries, careers, membership, location, or contact details.", path: "/about" }
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
      const response = getBotResponse(userText)
      const botReply = { sender: "bot", ...response }
      setMessages(prev => [...prev, botReply])
      setIsTyping(false)
    }, 450)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div className="chatbox-shell" style={{
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
              {msg.path && (
                <Link
                  to={msg.path}
                  style={{
                    display: "block",
                    width: "fit-content",
                    marginTop: "9px",
                    color: "#0284c7",
                    fontWeight: 800,
                    fontSize: "12px",
                    textDecoration: "none"
                  }}
                >
                  Open related page →
                </Link>
              )}
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
      <div className="chat-suggestions" style={{
        display: "flex",
        gap: "7px",
        overflowX: "auto",
        padding: "10px 14px 0",
        backgroundColor: "#ffffff"
      }}>
        {["Service times", "Next event", "Our mission", "Prayer request"].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setInput(suggestion)}
            style={{
              border: "1px solid #bae6fd",
              background: "#f0f9ff",
              color: "#0369a1",
              borderRadius: "999px",
              padding: "7px 11px",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer"
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
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
          type="button"
          aria-label="Send message"
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

        @media (max-width: 520px) {
          .chatbox-shell {
            width: 100% !important;
            max-width: none !important;
            height: 100dvh !important;
            margin: 0 !important;
            border-radius: 0 !important;
            border: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Chatbox
