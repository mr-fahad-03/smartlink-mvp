import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  score: number;
  label?: string;
  className?: string;
}

function getRiskTone(score: number) {
  if (score >= 75) {
    return {
      label: "Critical Risk",
      colorClass: "text-danger",
    };
  }

  if (score >= 50) {
    return {
      label: "High Risk",
      colorClass: "text-danger",
    };
  }

  if (score >= 25) {
    return {
      label: "Moderate Risk",
      colorClass: "text-secondary",
    };
  }

  return {
    label: "Low Risk",
    colorClass: "text-success",
  };
}

export function RiskGauge({ score, label = "Risk Score", className }: RiskGaugeProps) {
  const safeScore = Math.min(100, Math.max(0, score));
  const size = 220;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;
  const tone = getRiskTone(safeScore);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${label}: ${safeScore} out of 100`}
        >
          <defs>
            <linearGradient id="risk-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(160 84% 39%)" />
              <stop offset="55%" stopColor="hsl(243 75% 59%)" />
              <stop offset="100%" stopColor="hsl(346 84% 46%)" />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-border/70"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#risk-gauge-gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-5xl font-semibold tracking-tight", tone.colorClass)}>
            {safeScore}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            out of 100
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold", tone.colorClass)}>{tone.label}</p>
    </div>
  );
}
