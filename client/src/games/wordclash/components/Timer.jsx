export default function Timer({ remaining, total }) {
  const fraction = total > 0 ? remaining / total : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);
  const isLow = remaining <= 10;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32" cy="32" r={radius}
          fill="none" stroke="#374151" strokeWidth="4"
        />
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={isLow ? '#EF4444' : '#F97316'}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className={`absolute text-lg font-bold ${isLow ? 'text-red-400 animate-pulse' : 'text-white'}`}>
        {remaining}
      </span>
    </div>
  );
}
