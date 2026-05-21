import { useNavigate } from "react-router-dom"

function CloseButton() {
  const navigate = useNavigate()

  return (
    <div 
      onClick={() => navigate("/")} 
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "#555",
        cursor: "pointer"
      }}
    >
      ✖
    </div>
  )
}

export default CloseButton
