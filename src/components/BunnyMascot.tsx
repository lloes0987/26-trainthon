export default function BunnyMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 240"
      className={className}
      aria-hidden
      role="img"
    >
      <title>언제어디 토끼</title>
      <ellipse cx="110" cy="228" rx="58" ry="10" fill="#003876" opacity="0.18" />
      <ellipse cx="78" cy="42" rx="18" ry="46" fill="#fff" />
      <ellipse cx="78" cy="44" rx="9" ry="32" fill="#ffd6e4" />
      <ellipse cx="142" cy="42" rx="18" ry="46" fill="#fff" />
      <ellipse cx="142" cy="44" rx="9" ry="32" fill="#ffd6e4" />
      <ellipse cx="110" cy="148" rx="78" ry="70" fill="#fff" />
      <circle cx="110" cy="92" r="48" fill="#fff" />
      <circle cx="88" cy="96" r="11" fill="#ffc1d4" opacity="0.85" />
      <circle cx="132" cy="96" r="11" fill="#ffc1d4" opacity="0.85" />
      <circle cx="94" cy="86" r="5" fill="#2a2d4a" />
      <circle cx="126" cy="86" r="5" fill="#2a2d4a" />
      <circle cx="95.5" cy="84.5" r="1.6" fill="#fff" />
      <circle cx="127.5" cy="84.5" r="1.6" fill="#fff" />
      <ellipse cx="110" cy="98" rx="4" ry="3" fill="#ffb0c8" />
      <path
        d="M102 106c4 6 12 6 16 0"
        fill="none"
        stroke="#2a2d4a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="34" y="128" width="72" height="36" rx="12" fill="#fff" stroke="#003876" strokeWidth="3" />
      <path d="M106 146h10" stroke="#003876" strokeWidth="3" />
      <text
        x="70"
        y="151"
        textAnchor="middle"
        fill="#003876"
        fontSize="11"
        fontWeight="700"
        fontFamily="ui-rounded, sans-serif"
      >
        Follow me
      </text>
      <circle cx="168" cy="168" r="22" fill="#fff8e8" stroke="#f5c56b" strokeWidth="4" />
      <circle cx="168" cy="168" r="3" fill="#c98a2a" />
      <path d="M168 156v12l8 6" fill="none" stroke="#c98a2a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M168 146v-16" stroke="#d4a017" strokeWidth="3" strokeLinecap="round" />
      <circle cx="168" cy="128" r="4" fill="#d4a017" />
    </svg>
  );
}
