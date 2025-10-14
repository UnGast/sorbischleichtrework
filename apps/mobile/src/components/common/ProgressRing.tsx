import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
}

export function ProgressRing({ size = 56, strokeWidth = 6, progress }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#6E9CFD"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}
