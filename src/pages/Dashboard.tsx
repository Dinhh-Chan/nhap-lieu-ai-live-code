import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, List, Code, TestTube, Users, TrendingUp, Activity, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UsersApi } from "@/services/users";
import type { SystemStatistics } from "@/types/system-statistics";

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
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Learning Content Management System</p>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Đang tải thống kê hệ thống...</div>
        </div>
      </div>
    );
  }

  if (error || !systemStats) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Learning Content Management System</p>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Không thể tải thống kê hệ thống</div>
        </div>
      </div>
    );
  }

  const stats = systemStats.data;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Learning Content Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_users)}</div>
            <p className="text-xs text-muted-foreground">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng Problems</CardTitle>
            <Code className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_problems)}</div>
            <p className="text-xs text-muted-foreground">Bài tập có sẵn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng Submissions</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_submissions)}</div>
            <p className="text-xs text-muted-foreground">Bài nộp tổng cộng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ AC</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall_ac_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Tỷ lệ chấp nhận</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Submissions Today/Week/Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Submissions Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hôm nay</span>
                <span className="text-lg font-semibold">{stats.today_submissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tuần này</span>
                <span className="text-lg font-semibold">{formatNumber(stats.this_week_submissions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tháng này</span>
                <span className="text-lg font-semibold">{formatNumber(stats.this_month_submissions)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Ngôn ngữ phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.language_stats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([lang, count]) => (
                  <div key={lang} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{lang}</span>
                    <span className="text-sm font-medium">{formatNumber(count)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Accepted</span>
                <span className="text-sm font-medium">{formatNumber(stats.status_stats.accepted)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600">Wrong Answer</span>
                <span className="text-sm font-medium">{formatNumber(stats.status_stats.wrong_answer)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-600">Time Limit</span>
                <span className="text-sm font-medium">{formatNumber(stats.status_stats.time_limit_exceeded)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Runtime Error</span>
                <span className="text-sm font-medium">{formatNumber(stats.status_stats.runtime_error)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_users.slice(0, 5).map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{user.accepted_submissions}</div>
                    <div className="text-xs text-muted-foreground">/{user.total_submissions}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Problems */}
        <Card>
          <CardHeader>
            <CardTitle>Top Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_problems.slice(0, 5).map((problem, index) => (
                <div key={problem.problem_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium truncate">{problem.problem_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{problem.accepted_submissions}</div>
                    <div className="text-xs text-muted-foreground">/{problem.total_submissions}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Submissions Chart */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Submissions trong 7 ngày gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {stats.daily_submissions.slice(-7).map((day, index) => {
                const maxCount = Math.max(...stats.daily_submissions.map(d => d.count));
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="bg-primary rounded-t w-full transition-all duration-500 hover:bg-primary/80"
                      style={{ height: `${height}%` }}
                      title={`${formatDate(day.date)}: ${day.count} submissions`}
                    />
                    <span className="text-xs text-muted-foreground">{formatDate(day.date)}</span>
                    <span className="text-xs font-medium">{day.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
