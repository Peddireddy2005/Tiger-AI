export default function AuraIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#ag1)" />
      <path d="M20 8L30 32H25.5L23.5 27H16.5L14.5 32H10L20 8Z" fill="white" fillOpacity="0.95" />
      <path d="M17.8 23H22.2L20 16.8L17.8 23Z" fill="#06B6D4" />
      <circle cx="30.5" cy="10.5" r="2.5" fill="white" fillOpacity="0.6" />
    </svg>
  );
}