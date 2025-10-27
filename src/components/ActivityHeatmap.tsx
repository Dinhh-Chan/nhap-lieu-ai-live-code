import { Card } from "@/components/ui/card";

interface ActivityHeatmapProps {
  activityData?: {
    date: string;
    submissions_count: number;
  }[];
  totalActiveDays?: number;
  maxStreak?: number;
}

export const ActivityHeatmap = ({ activityData, totalActiveDays, maxStreak }: ActivityHeatmapProps) => {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  
  // Generate sample activity data if no real data provided
  const generateSampleActivityData = () => {
    const weeks = [];
    for (let week = 0; week < 53; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const count = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
        weekData.push({
          date: `2024-${week}-${day}`,
          count,
        });
      }
      weeks.push(weekData);
    }
    return weeks;
  };

  const generateRealActivityData = (data: typeof activityData) => {
    if (!data) return generateSampleActivityData();
    
    // Convert activity data to weekly format for heatmap
    const weeks = [];
    const submissionMap = new Map(data.map(item => [item.date, item.submissions_count]));
    
    // Generate last 53 weeks
    const today = new Date();
    for (let week = 0; week < 53; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + (6 - day)));
        const dateStr = date.toISOString().split('T')[0];
        const count = submissionMap.get(dateStr) || 0;
        weekData.push({
          date: dateStr,
          count,
        });
      }
      weeks.push(weekData);
    }
    return weeks;
  };

  // Use real data if available, otherwise generate sample data
  const heatmapData = activityData && activityData.length > 0 
    ? generateRealActivityData(activityData)
    : generateSampleActivityData();

  const getActivityColor = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-accent/30";
    if (count === 2) return "bg-accent/50";
    if (count === 3) return "bg-accent/70";
    return "bg-accent";
  };

  const totalSubmissions = activityData?.reduce((sum, day) => sum + day.submissions_count, 0) || 0;
  const activeDays = totalActiveDays || 0;
  const streak = maxStreak || 0;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">
            <span className="font-bold">{totalSubmissions}</span> submissions in the past one year
          </h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total active days: {activeDays}</span>
            <span>Max streak: {streak}</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getActivityColor(day.count)} transition-colors hover:ring-2 hover:ring-accent cursor-pointer`}
                  title={`${day.date}: ${day.count} submissions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-8 text-xs text-muted-foreground">
          {months.map((month, index) => (
            <span key={index}>{month}</span>
          ))}
        </div>
      </div>
    </Card>
  );
};