import { useState, useEffect } from "react";
import axios from "axios";

const bibleBooks = [
  { name: "Genesis", chapters: 50, testament: "OT" }, { name: "Exodus", chapters: 40, testament: "OT" }, { name: "Leviticus", chapters: 27, testament: "OT" },
  { name: "Numbers", chapters: 36, testament: "OT" }, { name: "Deuteronomy", chapters: 34, testament: "OT" }, { name: "Joshua", chapters: 24, testament: "OT" },
  { name: "Judges", chapters: 21, testament: "OT" }, { name: "Ruth", chapters: 4, testament: "OT" }, { name: "1 Samuel", chapters: 31, testament: "OT" },
  { name: "2 Samuel", chapters: 24, testament: "OT" }, { name: "1 Kings", chapters: 22, testament: "OT" }, { name: "2 Kings", chapters: 25, testament: "OT" },
  { name: "1 Chronicles", chapters: 29, testament: "OT" }, { name: "2 Chronicles", chapters: 36, testament: "OT" }, { name: "Ezra", chapters: 10, testament: "OT" },
  { name: "Nehemiah", chapters: 13, testament: "OT" }, { name: "Esther", chapters: 10, testament: "OT" }, { name: "Job", chapters: 42, testament: "OT" },
  { name: "Psalms", chapters: 150, testament: "OT" }, { name: "Proverbs", chapters: 31, testament: "OT" }, { name: "Ecclesiastes", chapters: 12, testament: "OT" },
  { name: "Song of Solomon", chapters: 8, testament: "OT" }, { name: "Isaiah", chapters: 66, testament: "OT" }, { name: "Jeremiah", chapters: 52, testament: "OT" },
  { name: "Lamentations", chapters: 5, testament: "OT" }, { name: "Ezekiel", chapters: 48, testament: "OT" }, { name: "Daniel", chapters: 12, testament: "OT" },
  { name: "Hosea", chapters: 14, testament: "OT" }, { name: "Joel", chapters: 3, testament: "OT" }, { name: "Amos", chapters: 9, testament: "OT" },
  { name: "Obadiah", chapters: 1, testament: "OT" }, { name: "Jonah", chapters: 4, testament: "OT" }, { name: "Micah", chapters: 7, testament: "OT" },
  { name: "Nahum", chapters: 3, testament: "OT" }, { name: "Habakkuk", chapters: 3, testament: "OT" }, { name: "Zephaniah", chapters: 3, testament: "OT" },
  { name: "Haggai", chapters: 2, testament: "OT" }, { name: "Zechariah", chapters: 14, testament: "OT" }, { name: "Malachi", chapters: 4, testament: "OT" },
  { name: "Matthew", chapters: 28, testament: "NT" }, { name: "Mark", chapters: 16, testament: "NT" }, { name: "Luke", chapters: 24, testament: "NT" },
  { name: "John", chapters: 21, testament: "NT" }, { name: "Acts", chapters: 28, testament: "NT" }, { name: "Romans", chapters: 16, testament: "NT" },
  { name: "1 Corinthians", chapters: 16, testament: "NT" }, { name: "2 Corinthians", chapters: 13, testament: "NT" }, { name: "Galatians", chapters: 6, testament: "NT" },
  { name: "Ephesians", chapters: 6, testament: "NT" }, { name: "Philippians", chapters: 4, testament: "NT" }, { name: "Colossians", chapters: 4, testament: "NT" },
  { name: "1 Thessalonians", chapters: 5, testament: "NT" }, { name: "2 Thessalonians", chapters: 3, testament: "NT" }, { name: "1 Timothy", chapters: 6, testament: "NT" },
  { name: "2 Timothy", chapters: 4, testament: "NT" }, { name: "Titus", chapters: 3, testament: "NT" }, { name: "Philemon", chapters: 1, testament: "NT" },
  { name: "Hebrews", chapters: 13, testament: "NT" }, { name: "James", chapters: 5, testament: "NT" }, { name: "1 Peter", chapters: 5, testament: "NT" },
  { name: "2 Peter", chapters: 3, testament: "NT" }, { name: "1 John", chapters: 5, testament: "NT" }, { name: "2 John", chapters: 1, testament: "NT" },
  { name: "3 John", chapters: 1, testament: "NT" }, { name: "Jude", chapters: 1, testament: "NT" }, { name: "Revelation", chapters: 22, testament: "NT" }
];

export default function Bible() {
  const [selectedBook, setSelectedBook] = useState(bibleBooks[39]); // Default to Matthew
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [verseSearch, setVerseSearch] = useState("");

  useEffect(() => {
    fetchChapter(selectedBook.name, selectedChapter);
  }, [selectedBook, selectedChapter]);

  const fetchChapter = async (book, chapter) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`https://bible-api.com/${book}+${chapter}`);
      setVerses(response.data.verses);
    } catch (err) {
      setError("Failed to load chapter. Please try again.");
    }
    setLoading(false);
  };

  const handleBookChange = (book) => {
    setSelectedBook(book);
    setSelectedChapter(1); // Reset to chapter 1 when book changes
    setShowBookSelector(false);
    setVerseSearch("");
  };

  return (
    <div className="app-root">
      <main className="app-main" style={{ padding: "2rem 5vw", flexDirection: "column", gap: "2rem" }}>
        
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h1 style={{ 
            fontSize: "clamp(2rem, 5vw, 3.5rem)", 
            fontWeight: 800, 
            background: "linear-gradient(to right, #fff, var(--primary-hover))", 
            WebkitBackgroundClip: "text", 
            backgroundClip: "text", 
            color: "transparent" 
          }}>
            Holy Bible
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Read and meditate on the Word of God</p>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "minmax(250px, 300px) 1fr", 
          gap: "2rem",
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto"
        }} className="bible-layout">
          
          {/* Mobile Book Selector Toggle */}
          <button 
            className="mobile-book-toggle"
            onClick={() => setShowBookSelector(!showBookSelector)}
            style={{
              padding: "1rem",
              background: "rgba(14, 165, 233, 0.1)",
              border: "1px solid var(--border-color)",
              borderRadius: "0.8rem",
              color: "var(--primary-hover)",
              fontWeight: 600,
              cursor: "pointer",
              display: "none", // Hidden on desktop, shown via CSS on mobile
              width: "100%"
            }}
          >
            {showBookSelector ? "Close Library" : `Change Book (${selectedBook.name})`}
          </button>

          {/* Sidebar - Book Selector */}
          <div 
            className={`bible-sidebar ${showBookSelector ? "show" : ""}`}
            style={{
              background: "rgba(2, 6, 23, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border-color)",
              borderRadius: "1.5rem",
              padding: "1.5rem",
              height: "fit-content",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <input 
                type="text" 
                placeholder="Search books..." 
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(14, 165, 233, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#fff",
                  outline: "none"
                }}
              />
            </div>

            {bibleBooks.filter(b => b.testament === "OT" && b.name.toLowerCase().includes(bookSearch.toLowerCase())).length > 0 && (
              <>
                <h3 style={{ color: "var(--primary-hover)", marginBottom: "1rem", fontSize: "1.2rem" }}>Old Testament</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "2rem" }}>
                  {bibleBooks.filter(b => b.testament === "OT" && b.name.toLowerCase().includes(bookSearch.toLowerCase())).map(book => (
                    <button
                      key={book.name}
                      onClick={() => handleBookChange(book)}
                      style={{
                        textAlign: "left",
                        padding: "0.6rem 1rem",
                        background: selectedBook.name === book.name ? "var(--primary-color)" : "transparent",
                        color: selectedBook.name === book.name ? "#fff" : "var(--text-light)",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontWeight: selectedBook.name === book.name ? 700 : 400,
                      }}
                      onMouseOver={(e) => {
                        if (selectedBook.name !== book.name) e.currentTarget.style.background = "rgba(14, 165, 233, 0.1)";
                      }}
                      onMouseOut={(e) => {
                        if (selectedBook.name !== book.name) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {book.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {bibleBooks.filter(b => b.testament === "NT" && b.name.toLowerCase().includes(bookSearch.toLowerCase())).length > 0 && (
              <>
                <h3 style={{ color: "var(--primary-hover)", marginBottom: "1rem", fontSize: "1.2rem" }}>New Testament</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {bibleBooks.filter(b => b.testament === "NT" && b.name.toLowerCase().includes(bookSearch.toLowerCase())).map(book => (
                    <button
                      key={book.name}
                      onClick={() => handleBookChange(book)}
                      style={{
                        textAlign: "left",
                        padding: "0.6rem 1rem",
                        background: selectedBook.name === book.name ? "var(--primary-color)" : "transparent",
                        color: selectedBook.name === book.name ? "#fff" : "var(--text-light)",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontWeight: selectedBook.name === book.name ? 700 : 400,
                      }}
                      onMouseOver={(e) => {
                        if (selectedBook.name !== book.name) e.currentTarget.style.background = "rgba(14, 165, 233, 0.1)";
                      }}
                      onMouseOut={(e) => {
                        if (selectedBook.name !== book.name) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {book.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Main Reading Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Chapter Selector */}
            <div style={{
              background: "rgba(2, 6, 23, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border-color)",
              borderRadius: "1.5rem",
              padding: "1.5rem",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
            }}>
              <h2 style={{ fontSize: "1.5rem", color: "#fff", marginBottom: "1rem" }}>
                {selectedBook.name} <span style={{ color: "var(--primary-hover)" }}>Chapters</span>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chapterNum => (
                  <button
                    key={chapterNum}
                    onClick={() => {
                      setSelectedChapter(chapterNum);
                      setVerseSearch("");
                    }}
                    style={{
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: selectedChapter === chapterNum ? "var(--primary-color)" : "rgba(255, 255, 255, 0.05)",
                      color: selectedChapter === chapterNum ? "#fff" : "var(--text-light)",
                      border: selectedChapter === chapterNum ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      if (selectedChapter !== chapterNum) e.currentTarget.style.background = "rgba(14, 165, 233, 0.2)";
                    }}
                    onMouseOut={(e) => {
                      if (selectedChapter !== chapterNum) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }}
                  >
                    {chapterNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Reading Pane */}
            <div style={{
              background: "rgba(2, 6, 23, 0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border-color)",
              borderRadius: "1.5rem",
              padding: "2.5rem 2rem",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
              minHeight: "400px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "1rem" }}>
                <h2 style={{ fontSize: "2rem", color: "var(--primary-hover)", margin: 0 }}>
                  {selectedBook.name} {selectedChapter}
                </h2>
                <input 
                  type="text" 
                  placeholder="Filter verses..." 
                  value={verseSearch}
                  onChange={(e) => setVerseSearch(e.target.value)}
                  style={{
                    padding: "0.6rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(14, 165, 233, 0.3)",
                    borderRadius: "0.5rem",
                    color: "#fff",
                    outline: "none",
                    minWidth: "200px"
                  }}
                />
              </div>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                  <div className="loader" style={{ width: "40px", height: "40px", border: "4px solid rgba(14,165,233,0.2)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                </div>
              ) : error ? (
                <div style={{ color: "#ef4444", textAlign: "center", padding: "2rem" }}>{error}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {verses.filter(v => v.text.toLowerCase().includes(verseSearch.toLowerCase()) || v.verse.toString() === verseSearch).map(verse => (
                    <div key={verse.verse} style={{ display: "flex", gap: "1rem", fontSize: "1.1rem", lineHeight: 1.8 }}>
                      <span style={{ 
                        color: "var(--primary-hover)", 
                        fontWeight: 700, 
                        fontSize: "0.85rem", 
                        minWidth: "25px",
                        paddingTop: "0.4rem"
                      }}>
                        {verse.verse}
                      </span>
                      <span style={{ color: "var(--text-light)", background: verseSearch && verse.text.toLowerCase().includes(verseSearch.toLowerCase()) ? "rgba(14, 165, 233, 0.2)" : "transparent", padding: verseSearch ? "0 4px" : "0", borderRadius: "4px" }}>
                        {verse.text}
                      </span>
                    </div>
                  ))}
                  
                  {verses.filter(v => v.text.toLowerCase().includes(verseSearch.toLowerCase()) || v.verse.toString() === verseSearch).length === 0 && !loading && (
                    <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem", fontStyle: "italic" }}>
                      No verses match your search.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* Custom Scrollbar for Sidebar */
          .bible-sidebar::-webkit-scrollbar {
            width: 6px;
          }
          .bible-sidebar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.02);
          }
          .bible-sidebar::-webkit-scrollbar-thumb {
            background: rgba(14, 165, 233, 0.3);
            border-radius: 10px;
          }
          
          @media (max-width: 900px) {
            .bible-layout {
              grid-template-columns: 1fr !important;
            }
            .mobile-book-toggle {
              display: block !important;
            }
            .bible-sidebar {
              display: none;
            }
            .bible-sidebar.show {
              display: block;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
