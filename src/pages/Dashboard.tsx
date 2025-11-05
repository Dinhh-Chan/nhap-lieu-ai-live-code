import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Code, Activity, Target, TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UsersApi } from "@/services/users";

export default function Dashboard() {
  const { data: systemStats, isLoading, error } = useQuery({
    queryKey: ["system-statistics"],
    queryFn: () => UsersApi.getSystemStatistics(),
  });

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

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Chào mừng đến với Learning Content Management System</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-pulse">
            <Activity className="h-12 w-12 text-primary mx-auto mb-3" />
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
            Dashboard
          </h1>
          <p className="text-muted-foreground">Chào mừng đến với Learning Content Management System</p>
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

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Tổng quan hệ thống và hoạt động gần đây</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card border-0 shadow-md bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--stat-users))]/10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Tổng Users</CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--stat-users))]/10">
              <Users className="h-5 w-5 stat-icon-users" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{formatNumber(stats.total_users)}</div>
            <p className="text-xs text-muted-foreground mt-1">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-0 shadow-md bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--stat-problems))]/10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Tổng Problems</CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--stat-problems))]/10">
              <Code className="h-5 w-5 stat-icon-problems" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{formatNumber(stats.total_problems)}</div>
            <p className="text-xs text-muted-foreground mt-1">Bài tập có sẵn</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-0 shadow-md bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--stat-submissions))]/10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Tổng Submissions</CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--stat-submissions))]/10">
              <Activity className="h-5 w-5 stat-icon-submissions" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{formatNumber(stats.total_submissions)}</div>
            <p className="text-xs text-muted-foreground mt-1">Bài nộp tổng cộng</p>
          </CardContent>
        </Card>

        <Card className="stat-card border-0 shadow-md bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--stat-warning))]/10 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Tỷ lệ AC</CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--stat-warning))]/10">
              <Target className="h-5 w-5 stat-icon-warning" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stats.overall_ac_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Tỷ lệ chấp nhận</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Stats Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Submissions Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-primary">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span>Hoạt động Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Hôm nay</span>
                </div>
                <span className="text-lg font-bold">{stats.today_submissions}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tuần này</span>
                </div>
                <span className="text-lg font-bold">{formatNumber(stats.this_week_submissions)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tháng này</span>
                </div>
                <span className="text-lg font-bold">{formatNumber(stats.this_month_submissions)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Stats */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-success">
                <Code className="h-4 w-4 text-white" />
              </div>
              <span>Ngôn ngữ phổ biến</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.language_stats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([lang, count], index) => {
                  const total = Object.values(stats.language_stats).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(0);
                  return (
                    <div key={lang} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{lang}</span>
                        <span className="text-sm text-muted-foreground">{formatNumber(count)} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-success rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Status Stats */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-purple">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span>Trạng thái Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--stat-success))]" />
                  <span className="text-sm">Accepted</span>
                </div>
                <span className="text-sm font-semibold">{formatNumber(stats.status_stats.accepted)}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--stat-error))]" />
                  <span className="text-sm">Wrong Answer</span>
                </div>
                <span className="text-sm font-semibold">{formatNumber(stats.status_stats.wrong_answer)}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--stat-warning))]" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="text-sm font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--stat-error))]" />
                  <span className="text-sm">Internal Error</span>
                </div>
                <span className="text-sm font-semibold">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span>Top Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.top_users.slice(0, 6).map((user, index) => {
              const acRate = user.total_submissions > 0 
                ? ((user.accepted_submissions / user.total_submissions) * 100).toFixed(1)
                : '0.0';
              
              return (
                <div 
                  key={user.user_id} 
                  className="group flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[hsl(var(--stat-warning))] border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{user.username}</div>
                    <div className="text-xs text-muted-foreground">AC Rate: {acRate}%</div>
                  </div>
                   <div className="text-right font-mono tabular-nums">
                     <div className="text-lg font-bold stat-icon-success">
                       {user.accepted_submissions}/{user.total_submissions}
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Submissions Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-purple">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span>Submissions trong 7 ngày gần đây</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <div className="flex flex-col h-full">
              <div className="flex justify-between px-2 mb-2">
                {stats.daily_submissions.slice(-7).map((day) => (
                  <div key={`count-${day.date}`} className="flex-1 text-center">
                    <div className="text-xs font-semibold">{day.count}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 flex items-end">
                {stats.daily_submissions.slice(-7).map((day, index) => {
                  const last7Days = stats.daily_submissions.slice(-7);
                  const maxCount = Math.max(...last7Days.map(d => d.count)) || 1;
                  const height = (day.count / maxCount) * 100;
                  const isToday = index === last7Days.length - 1;
                  
                  return (
                    <div key={day.date} className="flex-1 px-2">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-500 hover:opacity-80 ${
                          isToday ? 'bg-[hsl(var(--stat-success))]/90' : 'bg-[hsl(var(--stat-success))]'
                        }`}
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${formatDate(day.date)}: ${day.count} submissions`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between pt-2 mt-2 border-t">
                {stats.daily_submissions.slice(-7).map((day, index) => {
                  const last7Days = stats.daily_submissions.slice(-7);
                  const isToday = index === last7Days.length - 1;
                  return (
                    <div key={`date-${day.date}`} className="flex-1 text-center">
                      <div className={`text-xs ${isToday ? 'font-bold' : 'text-muted-foreground'}`}>
                        {formatDate(day.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
