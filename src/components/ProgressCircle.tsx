interface ProgressCircleProps {
    solved: number;
    total: number;
    attempting: number;
  }
  
  export const ProgressCircle = ({ solved, total, attempting }: ProgressCircleProps) => {
    const percentage = (solved / total) * 100;
    const circumference = 2 * Math.PI * 80;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
    return (
      <div className="relative w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="hsl(var(--border))"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="hsl(var(--accent))"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          {/* Attempting indicator */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="hsl(var(--warning))"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${(attempting / total) * 100 * (circumference / 100)} ${circumference}`}
            strokeDashoffset={strokeDashoffset - (percentage / 100) * circumference}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-foreground">{solved}</div>
          <div className="text-sm text-muted-foreground">/{total}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-accent rounded-full"></span>
            Solved
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-warning rounded-full"></span>
            {attempting} Attempting
          </div>
        </div>
      </div>
    );
  };
  