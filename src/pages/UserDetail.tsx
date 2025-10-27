import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { UsersApi } from "@/services/users";
import { StudentSubmissionsApi } from "@/services/student-submissions";
import type { UserStatistics } from "@/types/user-statistics";
import { ArrowLeft, User, Mail, Calendar, Shield, Hash, MapPin, FileText, BarChart3, Trophy, Target, Clock, Code2 } from "lucide-react";
import { ProgressCircle } from "@/components/ProgressCircle";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { SubmissionList } from "@/components/SubmissionList";
import { ProfileSidebar } from "@/components/ProfileSidebar";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => UsersApi.getById(id!),
    enabled: !!id,
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["user-statistics", id],
    queryFn: () => UsersApi.getStatistics(id!),
    enabled: !!id,
  });

  const { data: submissions } = useQuery({
    queryKey: ["student-submissions", id],
    queryFn: () => StudentSubmissionsApi.getByStudentId(id!),
    enabled: !!id,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "Male":
        return "bg-blue-100 text-blue-800";
      case "Female":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Teacher":
        return "bg-purple-100 text-purple-800";
      case "Student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Đang tải thông tin người dùng...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Không thể tải thông tin người dùng</div>
          <Button onClick={() => navigate("/users")}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Profile - {user.fullname}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Progress Circle */}
          {statistics && (
            <Card className="p-6">
              <div className="flex items-center justify-center">
                <ProgressCircle 
                  solved={statistics.data.accepted_submissions}
                  total={statistics.data.progress_stats.total}
                  attempting={statistics.data.progress_stats.attempting}
                />
              </div>
            </Card>
          )}

          {/* Activity Heatmap */}
          <ActivityHeatmap 
            activityData={statistics?.data.activity_data}
            totalActiveDays={statistics?.data.total_active_days}
            maxStreak={statistics?.data.max_streak}
          />

          {/* Submission List */}
          <SubmissionList 
            submissions={statistics?.data.recent_submissions}
            recentAC={submissions?.data?.filter(sub => sub.status === 'accepted').slice(0, 10).map(sub => ({
              problem_name: sub.problem?.name || "Unknown Problem",
              submitted_at: sub.submitted_at,
              status: sub.status,
              language: sub.language_id === 1 ? 'python' : sub.language_id === 2 ? 'cpp' : 'unknown',
              code: sub.code,
              execution_time_ms: sub.execution_time_ms,
              memory_used_mb: sub.memory_used_mb
            }))}
            onViewAllSubmissions={() => navigate(`/users/${id}/submissions`)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProfileSidebar user={user} statistics={statistics?.data} />
        </div>
      </div>
    </div>
  );
}