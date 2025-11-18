import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileQuestion, Trophy, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UsersApi } from "@/services/users";
import { ContestsApi } from "@/services/contests";

export default function Dashboard() {
  const { data: systemStats, isLoading, error } = useQuery({
    queryKey: ["system-statistics"],
    queryFn: () => UsersApi.getSystemStatistics(),
  });

  const { data: contestsData } = useQuery({
    queryKey: ["contests-many"],
    queryFn: () => ContestsApi.listMany(),
  });

  const totalContests = contestsData?.data?.length || 0;

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
    });
  };

  // Lấy dữ liệu submissions trong tuần (7 ngày gần nhất)
  const getWeeklySubmissions = () => {
    if (!systemStats?.data?.daily_submissions) return [];
    
    const dailySubmissions = systemStats.data.daily_submissions;
    const last7Days = dailySubmissions.slice(-7);
    
    // Đảm bảo có đủ 7 ngày
    const today = new Date();
    const weekDays = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = last7Days.find(d => d.date === dateStr);
      weekDays.push({
        date: dateStr,
        count: dayData?.count || 0,
        dayName: date.toLocaleDateString("vi-VN", { weekday: "short" })
      });
    }
    
    return weekDays;
  };

  const weeklySubmissions = getWeeklySubmissions();
  
  // Lấy tên ngày trong tuần (T2, T3, T4, T5, T6, T7, CN)
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[day];
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bảng điều khiển
          </h1>
          <p className="text-muted-foreground">Chào mừng đến với Hệ thống quản lý nội dung học tập</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-pulse">
            <Users className="h-12 w-12 text-primary mx-auto mb-3" />
            <div className="text-muted-foreground">Đang tải thống kê hệ thống...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !systemStats) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bảng điều khiển
          </h1>
          <p className="text-muted-foreground">Chào mừng đến với Hệ thống quản lý nội dung học tập</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              Không thể tải thống kê hệ thống. Vui lòng thử lại sau.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = systemStats.data;

  // Top 5 sinh viên xuất sắc (dựa trên số bài đã giải - accepted_submissions)
  const top5Students = stats.top_users
    .sort((a, b) => b.accepted_submissions - a.accepted_submissions)
    .slice(0, 5);

  // Tính max count cho biểu đồ và tạo Y-axis labels động
  const maxCount = Math.max(...weeklySubmissions.map(d => d.count), 1);
  const yAxisMax = Math.ceil(maxCount / 100) * 100; // Làm tròn lên bội số của 100
  const yAxisStep = yAxisMax / 5; // 5 bước
  const yAxisLabels = [];
  for (let i = 5; i >= 0; i--) {
    yAxisLabels.push(Math.round(i * yAxisStep));
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.total_users)}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng số câu hỏi</CardTitle>
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.total_problems)}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lần nộp bài</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.total_submissions)}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng số cuộc thi</CardTitle>
            <Trophy className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(totalContests)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Chart + Top Students */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Submissions Chart - 2 columns */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle>Submissions trong tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <div className="flex flex-col h-full">
                {/* Chart area with Y-axis and bars */}
                <div className="flex-1 relative" style={{ height: '280px' }}>
                  {/* Y-axis */}
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground pr-2">
                    {yAxisLabels.map((value) => (
                      <div key={value} className="text-right">{value}</div>
                    ))}
                  </div>
                  
                  {/* Bars container */}
                  <div className="absolute left-12 right-0 bottom-0 top-0 flex items-end gap-2">
                    {weeklySubmissions.map((day) => {
                      const heightPercent = yAxisMax > 0 ? (day.count / yAxisMax) * 100 : 0;
                      const barHeight = (280 * heightPercent) / 100; // Tính chiều cao thực tế theo pixel
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                          <div className="w-full flex flex-col items-center">
                            <div
                              className="w-full bg-primary rounded-t transition-all duration-300 hover:opacity-80"
                              style={{ 
                                height: `${barHeight}px`,
                                minHeight: day.count > 0 ? '2px' : '0'
                              }}
                              title={`${getDayLabel(day.date)}: ${day.count} bài nộp`}
                            />
                            <div className="text-xs font-semibold mt-1">{day.count}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="flex gap-2 ml-12 mt-2">
                  {weeklySubmissions.map((day) => (
                    <div key={`label-${day.date}`} className="flex-1 text-center">
                      <div className="text-xs text-muted-foreground">{getDayLabel(day.date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Students - 1 column */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Top 5 sinh viên xuất sắc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5Students.map((student, index) => (
                <div
                  key={student.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{student.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.accepted_submissions} bài đã giải
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
