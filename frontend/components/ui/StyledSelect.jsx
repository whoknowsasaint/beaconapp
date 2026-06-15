export default function StyledSelect({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width:            "100%",
          height:           40,
          borderRadius:     8,
          background:       "#111318",
          border:           "1px solid rgba(255,255,255,0.1)",
          color:            "rgba(255,255,255,0.85)",
          fontSize:         13,
          padding:          "0 36px 0 12px",
          outline:          "none",
          appearance:       "none",
          WebkitAppearance: "none",
          cursor:           "pointer",
          boxSizing:        "border-box",
        }}
      >
        {options.map(opt => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: "#111318", color: "rgba(255,255,255,0.85)" }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {/* Custom chevron */}
      <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
        <svg viewBox="0 0 10 6" fill="none" style={{ width:10, height:6 }}>
          <path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}