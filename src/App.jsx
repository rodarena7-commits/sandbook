import { useState } from "react";

// ─── DATOS DE EJEMPLO ────────────────────────────────────────────
const FEED_ITEMS = [
  {
    id: 1,
    user: { name: "Sarah García", avatar: "https://i.pravatar.cc/72?img=5" },
    action: "calificó un libro",
    rating: 4,
    time: "Hace 3 minutos",
    book: {
      title: "Bossypants",
      author: "Tina Fey",
      cover: "https://covers.openlibrary.org/b/id/12738373-M.jpg",
    },
    likes: 26,
    comments: 2,
    quote: null,
  },
  {
    id: 2,
    user: { name: "Davy Romero", avatar: "https://i.pravatar.cc/72?img=8" },
    action: "marcó como Quiero leerlo",
    rating: null,
    time: "Hace 4 horas",
    book: {
      title: "Todo la luz que no podemos ver",
      author: "Anthony Doerr",
      cover: "https://covers.openlibrary.org/b/id/8474036-M.jpg",
    },
    likes: 5,
    comments: 1,
    quote: null,
  },
  {
    id: 3,
    user: { name: "Nichole Treadway", avatar: "https://i.pravatar.cc/72?img=15" },
    action: "publicó una frase de",
    rating: 3,
    time: "Hace 6 horas",
    book: {
      title: "La invasión del Reino de las Lágrimas",
      author: "Erika Johansen",
      cover: "https://covers.openlibrary.org/b/id/7857507-M.jpg",
    },
    likes: 18,
    comments: 4,
    quote:
      "Con cada día que pasaba, Kelsea Glynn crecía en sus nuevas responsabilidades como Reina del Tear. Al detener los envíos de esclavos al Mortmesne…",
  },
];

const CURRENTLY_READING = [
  {
    title: "Big Magic: Vida Creativa Más Allá del Miedo",
    author: "Elizabeth Gilbert",
    cover: "https://covers.openlibrary.org/b/id/12347507-M.jpg",
    progress: 75,
    label: "75%",
  },
  {
    title: "Cover",
    author: "Peter Mendelsund",
    cover: "https://covers.openlibrary.org/b/id/8091016-M.jpg",
    progress: 28,
    label: "20 / 304 págs.",
  },
];

const WTR_COVERS = [
  "https://covers.openlibrary.org/b/id/10519503-M.jpg",
  "https://covers.openlibrary.org/b/id/8739161-M.jpg",
  "https://covers.openlibrary.org/b/id/12547489-M.jpg",
  "https://covers.openlibrary.org/b/id/8474036-M.jpg",
];

const FRIENDS = [
  { name: "Carlos M.", books: 34, avatar: "https://i.pravatar.cc/64?img=20" },
  { name: "Lucía P.", books: 58, avatar: "https://i.pravatar.cc/64?img=32" },
  { name: "Martín R.", books: 12, avatar: "https://i.pravatar.cc/64?img=44" },
];

const TABS_MAIN = ["Inicio", "Mis libros", "Explorar", "Comunidad"];
const TABS_SUB = ["Inicio", "Mis libros", "Muro social", "Escritores", "Recomendaciones"];
const TABS_MOBILE = [
  { label: "Inicio", icon: HomeIcon },
  { label: "Libros", icon: BookIcon },
  { label: "Buscar", icon: SearchIcon },
  { label: "Muro", icon: ChatIcon },
  { label: "Yo", icon: UserIcon },
];

// ─── ICONOS SVG INLINE ────────────────────────────────────────────
function HomeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function BookIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function SearchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function ChatIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function UserIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function BellIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function MsgIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function FriendsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ThumbIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    </svg>
  );
}
function ShareIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function SaveIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────

function Stars({ rating, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => interactive && onRate && onRate(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            fontSize: interactive ? 18 : 14,
            color: s <= (hover || rating || 0) ? "#c9922f" : "#d1c9b8",
            cursor: interactive ? "pointer" : "default",
            transition: "color .1s",
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ pct, color = "#409640" }) {
  return (
    <div
      style={{
        background: "#ece6d8",
        borderRadius: 4,
        height: 6,
        overflow: "hidden",
        margin: "4px 0",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
          transition: "width .5s ease",
        }}
      />
    </div>
  );
}

function IconBtn({ children, badge }) {
  return (
    <button
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "rgba(255,255,255,.12)",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,.85)",
        cursor: "pointer",
        position: "relative",
        transition: "background .15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.22)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.12)")}
    >
      {children}
      {badge && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            background: "#c0392b",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function BtnPrimary({ children, fullWidth = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: hov ? "#2d7a2d" : "#409640",
        color: "#fff",
        border: "1px solid #2d7a2d",
        borderRadius: 4,
        padding: "7px 14px",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background .15s",
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({ icon, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: hov ? "#ece6d8" : "none",
        border: "none",
        borderRadius: 4,
        padding: "5px 10px",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 500,
        color: hov ? "#5a3e2b" : "#4a4a4a",
        cursor: "pointer",
        transition: "background .15s, color .15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── FEED ITEM ────────────────────────────────────────────────────
function FeedItem({ item }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes);
  const [myRating, setMyRating] = useState(0);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid #d9d2c5",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(90,62,43,.10)",
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 10px" }}>
        <img
          src={item.user.avatar}
          alt={item.user.name}
          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid #d9d2c5", flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5 }}>
            <a href="#" style={{ fontWeight: 600, color: "#2d7a2d" }}>{item.user.name}</a>
            <span style={{ color: "#4a4a4a" }}> {item.action}</span>
          </div>
          <div style={{ fontSize: 11, color: "#767676", marginTop: 1 }}>{item.time}</div>
        </div>
        {item.rating && <Stars rating={item.rating} />}
      </div>

      {/* Book row */}
      <div style={{ display: "flex", gap: 14, padding: "0 16px 14px" }}>
        <div style={{ width: 72, flexShrink: 0 }}>
          <img
            src={item.book.cover}
            alt={item.book.title}
            style={{ width: 72, height: 108, objectFit: "cover", borderRadius: 4, boxShadow: "0 4px 12px rgba(90,62,43,.12)", border: "1px solid #d9d2c5" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <a href="#" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 15, color: "#5a3e2b", lineHeight: 1.3, display: "block" }}>
              {item.book.title}
            </a>
            <span style={{ fontSize: 12.5, color: "#767676" }}>
              de{" "}
              <a href="#" style={{ color: "#4a4a4a", fontWeight: 500 }}>{item.book.author}</a>
            </span>
          </div>
          <BtnPrimary>
            <BookIcon size={14} />
            Quiero leerlo
          </BtnPrimary>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11.5, color: "#767676", marginBottom: 2 }}>Tu calificación:</div>
            <Stars rating={myRating} interactive onRate={setMyRating} />
          </div>
        </div>
      </div>

      {/* Quote */}
      {item.quote && (
        <div
          style={{
            margin: "0 16px 14px",
            padding: "14px 16px",
            background: "#fff3dc",
            borderLeft: "3px solid #c9922f",
            borderRadius: "0 4px 4px 0",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 14,
            fontStyle: "italic",
            color: "#5a3e2b",
            lineHeight: 1.7,
          }}
        >
          "{item.quote}"
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderTop: "1px solid #ede8df",
          background: "#faf7f2",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="#" style={{ fontSize: 12, fontWeight: 500, color: liked ? "#2d7a2d" : "#767676", display: "flex", alignItems: "center", gap: 5 }}>
            <ThumbIcon />
            <span style={{ color: "#2d7a2d", fontWeight: 600 }}>{likes}</span> Me gusta
          </a>
          <div style={{ width: 1, height: 16, background: "#d9d2c5" }} />
          <a href="#" style={{ fontSize: 12, fontWeight: 500, color: "#767676", display: "flex", alignItems: "center", gap: 5 }}>
            <ChatIcon size={13} />
            <span style={{ color: "#2d7a2d", fontWeight: 600 }}>{item.comments}</span>{" "}
            {item.comments === 1 ? "Comentario" : "Comentarios"}
          </a>
          {item.quote && (
            <>
              <div style={{ width: 1, height: 16, background: "#d9d2c5" }} />
              <a href="#" style={{ fontSize: 12, fontWeight: 500, color: "#767676", display: "flex", alignItems: "center", gap: 5 }}>
                <SaveIcon />
                Guardado
              </a>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <ActionBtn icon={<ThumbIcon />} label="Me gusta" />
          <ActionBtn icon={<ChatIcon size={13} />} label="Comentar" />
          <ActionBtn icon={<ShareIcon />} label="Compartir" />
        </div>
      </div>
    </article>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────
function Card({ title, extra, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d9d2c5",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(90,62,43,.10)",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #ede8df",
          background: "#faf7f2",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 15,
          fontWeight: 700,
          color: "#5a3e2b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        {extra && (
          <a href="#" style={{ fontFamily: "inherit", fontWeight: 400, fontSize: 12, color: "#2d7a2d" }}>
            {extra}
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

function Sidebar() {
  return (
    <aside style={{ minWidth: 0 }}>
      {/* Leyendo ahora */}
      <Card title="📚 Leyendo ahora" extra="Ver todos · Agregar">
        <div style={{ display: "flex", borderBottom: "1px solid #ede8df" }}>
          {[
            { num: 12, label: "Leídos" },
            { num: 3, label: "Leyendo" },
            { num: 47, label: "Quiero leer" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRight: "1px solid #ede8df" }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#5a3e2b" }}>{s.num}</div>
              <div style={{ fontSize: 10.5, color: "#767676", textTransform: "uppercase", letterSpacing: ".4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {CURRENTLY_READING.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", borderBottom: i < CURRENTLY_READING.length - 1 ? "1px solid #ede8df" : "none" }}>
            <img src={b.cover} alt={b.title} style={{ width: 48, height: 72, objectFit: "cover", borderRadius: 3, boxShadow: "0 1px 3px rgba(90,62,43,.10)", border: "1px solid #d9d2c5", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#5a3e2b", lineHeight: 1.3, marginBottom: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{b.title}</div>
              <div style={{ fontSize: 11.5, color: "#767676", marginBottom: 6 }}>{b.author}</div>
              <ProgressBar pct={b.progress} />
              <div style={{ fontSize: 10.5, color: "#767676" }}>{b.label} · <a href="#" style={{ color: "#2d7a2d", fontWeight: 500 }}>Actualizar</a></div>
            </div>
          </div>
        ))}
      </Card>

      {/* Desafío lector */}
      <Card title="🎯 Desafío lector 2026">
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 64, height: 64,
                background: "#409640",
                borderRadius: 8,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(90,62,43,.12)",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.8)", letterSpacing: 1 }}>2026</span>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>3</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "#5a3e2b", marginBottom: 4 }}>¡Llevas 3 libros este año!</div>
              <div style={{ fontSize: 12, color: "#767676", marginBottom: 4 }}>Meta: 12 libros</div>
              <ProgressBar pct={25} />
              <div style={{ fontSize: 11.5, color: "#c0392b", fontWeight: 500, marginTop: 2 }}>5 libros por detrás del ritmo</div>
              <a href="#" style={{ fontSize: 12, color: "#2d7a2d", fontWeight: 500, display: "block", marginTop: 6 }}>Ver desafío →</a>
            </div>
          </div>
        </div>
      </Card>

      {/* Quiero leer */}
      <Card title="🔖 Quiero leer" extra="Ver todos">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: "12px 16px" }}>
          {WTR_COVERS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 3, boxShadow: "0 1px 3px rgba(90,62,43,.10)", border: "1px solid #d9d2c5", cursor: "pointer", transition: "transform .15s" }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            />
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid #ede8df", background: "#faf7f2", display: "flex", gap: 12 }}>
          <a href="#" style={{ fontSize: 12, fontWeight: 500, color: "#2d7a2d" }}>Ver lista completa</a>
          <a href="#" style={{ fontSize: 12, fontWeight: 500, color: "#2d7a2d" }}>+ Agregar libro</a>
        </div>
      </Card>

      {/* Recomendaciones */}
      <Card title="✨ Recomendaciones" extra="Ver más">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px" }}>
          <img
            src="https://covers.openlibrary.org/b/id/10368071-M.jpg"
            alt=""
            style={{ width: 52, height: 78, objectFit: "cover", borderRadius: 3, border: "1px solid #d9d2c5", flexShrink: 0, cursor: "pointer" }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#767676", fontStyle: "italic", marginBottom: 3 }}>Porque disfrutaste "Matar un ruiseñor"</div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "#5a3e2b", marginBottom: 2 }}>La propiedad</div>
            <div style={{ fontSize: 11.5, color: "#767676", marginBottom: 6 }}>Rutu Modan</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "#c9922f", fontSize: 11 }}>★★★★</span>
              <span style={{ fontSize: 11, color: "#767676" }}>3.59 promedio</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#4a4a4a", lineHeight: 1.5, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
              Tras la muerte de su hijo, Regina viaja a Varsovia con su nieta esperando reclamar una propiedad familiar perdida durante la Segunda Guerra Mundial…
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <BtnPrimary>Quiero leerlo</BtnPrimary>
              <a href="#" style={{ fontSize: 11.5, color: "#767676" }}>Ver más →</a>
            </div>
          </div>
        </div>
      </Card>

      {/* Amigos */}
      <Card title="👥 Amigos lectores" extra="Buscar amigos">
        {FRIENDS.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < FRIENDS.length - 1 ? "1px solid #ede8df" : "none" }}>
            <img src={f.avatar} alt={f.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            <div style={{ fontWeight: 600, fontSize: 13, color: "#2d7a2d", flex: 1 }}>{f.name}</div>
            <div style={{ fontSize: 11, color: "#767676" }}>{f.books} libros</div>
          </div>
        ))}
      </Card>
    </aside>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────
export default function SandbookApp() {
  const [lang, setLang] = useState("ES");
  const [activeMainTab, setActiveMainTab] = useState("Inicio");
  const [activeSubTab, setActiveSubTab] = useState("Inicio");
  const [activeMobileTab, setActiveMobileTab] = useState("Inicio");
  const [searchVal, setSearchVal] = useState("");

  const isES = lang === "ES";

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif", background: "#f5f0e8", minHeight: "100vh", color: "#1a1a1a" }}>

      {/* ── HEADER ── */}
      <header style={{ background: "#5a3e2b", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 12px rgba(90,62,43,.12)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, padding: "0 16px", height: 52 }}>

          {/* Logo */}
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", flexShrink: 0 }}>
            sand<span style={{ color: "#c9922f" }}>book</span>
          </div>

          {/* Nav principal */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {TABS_MAIN.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMainTab(tab)}
                style={{
                  color: activeMainTab === tab ? "#fff" : "rgba(255,255,255,.75)",
                  fontSize: 13,
                  fontWeight: activeMainTab === tab ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: 4,
                  background: activeMainTab === tab ? "rgba(255,255,255,.15)" : "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  transition: "background .15s, color .15s",
                }}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Barra de búsqueda */}
          <div style={{ flex: 1, display: "flex", position: "relative", maxWidth: 420 }}>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={isES ? "Busca libros, autores o ISBN…" : "Search books, authors or ISBN…"}
              style={{
                width: "100%",
                height: 34,
                padding: "0 40px 0 12px",
                border: "none",
                borderRadius: 4,
                fontFamily: "inherit",
                fontSize: 13,
                background: "#fff",
                color: "#1a1a1a",
                outline: "none",
              }}
            />
            <button
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: 36,
                background: "#409640",
                border: "none",
                borderRadius: "0 4px 4px 0",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", cursor: "pointer",
              }}
            >
              <SearchIcon size={15} />
            </button>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
            <IconBtn badge={3}><BellIcon /></IconBtn>
            <IconBtn badge={1}><MsgIcon /></IconBtn>
            <IconBtn><FriendsIcon /></IconBtn>

            {/* Toggle idioma */}
            <button
              onClick={() => setLang(lang === "ES" ? "EN" : "ES")}
              style={{
                background: "rgba(255,255,255,.15)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                letterSpacing: ".5px",
                fontFamily: "inherit",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,.25)")}
              onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,.15)")}
            >
              {lang}
            </button>

            {/* Avatar */}
            <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,.35)", flexShrink: 0, cursor: "pointer" }}>
              <img src="https://i.pravatar.cc/80?img=12" alt="Mi perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </header>

      {/* ── SUB-HEADER ── */}
      <div style={{ background: "#7a5c45", borderBottom: "1px solid rgba(0,0,0,.15)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", padding: "0 16px", gap: 2, height: 38, overflowX: "auto" }}>
          {TABS_SUB.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                color: activeSubTab === tab ? "#fff" : "rgba(255,255,255,.7)",
                fontSize: 12.5,
                fontWeight: activeSubTab === tab ? 600 : 500,
                padding: "0 14px",
                height: "100%",
                background: "none",
                border: "none",
                borderBottom: activeSubTab === tab ? "3px solid #c9922f" : "3px solid transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "color .15s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "20px 16px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Columna principal */}
        <main style={{ minWidth: 0 }}>
          {FEED_ITEMS.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
        </main>

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* ── NAVEGACIÓN MÓVIL ── */}
      <nav
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderTop: "1px solid #d9d2c5",
          display: "flex",
          boxShadow: "0 -2px 12px rgba(0,0,0,.08)",
          zIndex: 100,
        }}
      >
        {TABS_MOBILE.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveMobileTab(label)}
            style={{
              flex: 1,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "8px 0 10px",
              gap: 3,
              color: activeMobileTab === label ? "#2d7a2d" : "#767676",
              fontSize: 10,
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "color .15s",
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
