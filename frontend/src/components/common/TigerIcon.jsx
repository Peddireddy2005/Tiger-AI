export default function TigerIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#tg1)" />
      {/* Ears */}
      <path d="M7 15L9.5 5.5L16 14Z" fill="#1F2937" />
      <path d="M33 15L30.5 5.5L24 14Z" fill="#1F2937" />
      <path d="M9 13.5L10.7 7.5L14.3 12.7Z" fill="#FDBA74" />
      <path d="M31 13.5L29.3 7.5L25.7 12.7Z" fill="#FDBA74" />
      {/* Face */}
      <path
        d="M20 13.5C26.5 13.5 30.5 18.3 30.5 24C30.5 30 25.8 34 20 34C14.2 34 9.5 30 9.5 24C9.5 18.3 13.5 13.5 20 13.5Z"
        fill="white"
        fillOpacity="0.96"
      />
      {/* Stripes */}
      <path d="M20 13.5L20 9.5" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.5 15.5L11.8 11.7" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M25.5 15.5L28.2 11.7" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="15.7" cy="22.5" rx="2.2" ry="2.7" fill="#1F2937" />
      <ellipse cx="24.3" cy="22.5" rx="2.2" ry="2.7" fill="#1F2937" />
      <circle cx="16.3" cy="21.7" r="0.6" fill="white" />
      <circle cx="24.9" cy="21.7" r="0.6" fill="white" />
      {/* Nose */}
      <path d="M20 26.8L17.5 29.4H22.5L20 26.8Z" fill="#1F2937" />
      {/* Whiskers */}
      <path d="M11.5 26.5L7.5 27.5" stroke="#1F2937" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 29.5L8 31" stroke="#1F2937" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M28.5 26.5L32.5 27.5" stroke="#1F2937" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M28.5 29.5L32 31" stroke="#1F2937" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
