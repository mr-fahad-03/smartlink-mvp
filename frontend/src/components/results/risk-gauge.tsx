import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  score: number;
  label?: string;
  toneLabelOverride?: string;
  className?: string;
}

function getRiskTone(score: number) {
  if (score >= 75) {
    return {
      label: "Critical Risk",
      colorClass: "text-[#E11D48]",
    };
  }

  if (score >= 50) {
    return {
      label: "High Risk",
      colorClass: "text-[#F97316]",
    };
  }

  if (score >= 25) {
    return {
      label: "Moderate Risk",
      colorClass: "text-[#356AF6]",
    };
  }

  return {
    label: "Low Risk",
    colorClass: "text-[#16A34A]",
  };
}

export function RiskGauge({
  score,
  label = "Risk Score",
  toneLabelOverride,
  className,
}: RiskGaugeProps) {
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
              <stop offset="0%" stopColor="#16A34A" />
              <stop offset="50%" stopColor="#356AF6" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-[#D9E3F3]"
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
      <p className={cn("text-sm font-semibold", tone.colorClass)}>{toneLabelOverride ?? tone.label}</p>
    </div>
  );
}
