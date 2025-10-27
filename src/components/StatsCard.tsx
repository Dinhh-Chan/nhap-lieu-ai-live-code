import { Card } from "@/components/ui/card";

interface StatsCardProps {
  label: string;
  solved: number;
  total: number;
  variant: "easy" | "medium" | "hard";
}

export const StatsCard = ({ label, solved, total, variant }: StatsCardProps) => {
  const colors = {
    easy: "text-easy",
    medium: "text-warning",
    hard: "text-error",
  };

  return (
    <div className="text-center">
      <div className={`text-sm font-medium mb-1 ${colors[variant]}`}>{label}</div>
      <div className="text-2xl font-bold text-foreground">{solved}</div>
      <div className="text-sm text-muted-foreground">/{total}</div>
    </div>
  );
};
