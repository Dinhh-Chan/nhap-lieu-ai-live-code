import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { UsersApi } from "@/services/users";
import type { UserStatistics } from "@/types/user-statistics";
import { ArrowLeft, User, Mail, Calendar, Shield, Hash, MapPin, FileText, BarChart3, Trophy, Target, Clock, Code2 } from "lucide-react";

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-500";
      case "Teacher": return "bg-blue-500";
      case "Student": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "Male": return "bg-blue-100 text-blue-800";
      case "Female": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold">Chi tiết Người dùng</h1>
          <p className="text-muted-foreground">Thông tin chi tiết về {user.fullname}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin cơ bản */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin Cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                  <p className="text-lg font-semibold">{user.fullname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên đăng nhập</label>
                  <p className="text-lg font-semibold">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                  <div className="mt-1">
                    <Badge className={getGenderColor(user.gender)}>
                      {user.gender === "Male" ? "Nam" : user.gender === "Female" ? "Nữ" : "Khác"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                  <p className="text-lg">{formatDate(user.dob)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vai trò</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`h-2 w-2 rounded-full ${getRoleColor(user.systemRole)}`} />
                    <span className="text-lg font-semibold">{user.systemRole}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thống kê học tập */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Thống kê Học tập
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Đang tải thống kê...</div>
                </div>
              ) : statistics ? (
                <>
                  {/* Tổng quan */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{statistics.data.total_submissions}</div>
                      <div className="text-sm text-blue-800">Tổng bài nộp</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{statistics.data.accepted_submissions}</div>
                      <div className="text-sm text-green-800">Bài đúng</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{statistics.data.solved_problems_count}</div>
                      <div className="text-sm text-purple-800">Bài đã giải</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{statistics.data.success_rate.toFixed(1)}%</div>
                      <div className="text-sm text-orange-800">Tỷ lệ thành công</div>
                    </div>
                  </div>

                  {/* Progress bar cho tỷ lệ thành công */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Tỷ lệ thành công</span>
                      <span className="text-sm text-muted-foreground">{statistics.data.success_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={statistics.data.success_rate} className="h-2" />
                  </div>

                  {/* Chi tiết trạng thái bài nộp */}
                  <div>
                    <h4 className="font-medium mb-3">Chi tiết trạng thái bài nộp</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm">Đã chấp nhận</span>
                        <Badge variant="secondary">{statistics.data.accepted_submissions}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm">Sai đáp án</span>
                        <Badge variant="secondary">{statistics.data.wrong_answer_submissions}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-sm">Quá thời gian</span>
                        <Badge variant="secondary">{statistics.data.time_limit_exceeded_submissions}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <span className="text-sm">Lỗi runtime</span>
                        <Badge variant="secondary">{statistics.data.runtime_error_submissions}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                        <span className="text-sm">Lỗi biên dịch</span>
                        <Badge variant="secondary">{statistics.data.compile_error_submissions}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Đang chờ</span>
                        <Badge variant="secondary">{statistics.data.pending_submissions}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Thống kê ngôn ngữ */}
                  <div>
                    <h4 className="font-medium mb-3">Thống kê ngôn ngữ lập trình</h4>
                    <div className="space-y-2">
                      {Object.entries(statistics.data.language_stats).map(([lang, count]) => (
                        <div key={lang} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{lang}</span>
                          <Badge variant="outline">{count} bài</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thông tin bổ sung */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bài nộp cuối cùng</label>
                      <p className="text-sm">{formatDate(statistics.data.last_submission_date)}</p>
                    </div>
                    {statistics.data.average_score && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Điểm trung bình</label>
                        <p className="text-sm">{statistics.data.average_score.toFixed(2)}</p>
                      </div>
                    )}
                    {statistics.data.ranking > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Xếp hạng</label>
                        <p className="text-sm">#{statistics.data.ranking} / {statistics.data.total_users}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Không có dữ liệu thống kê</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thông tin bổ sung */}
          {(user.studentPtitCode || user.dataPartitionCode) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Thông tin Bổ sung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.studentPtitCode && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mã sinh viên PTIT</label>
                      <p className="text-lg font-semibold">{user.studentPtitCode}</p>
                    </div>
                  )}
                  {user.dataPartitionCode && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mã phân vùng dữ liệu</label>
                      <p className="text-lg font-semibold">{user.dataPartitionCode}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Avatar và Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Ảnh đại diện</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <Badge className={getRoleColor(user.systemRole)}>
                  {user.systemRole}
                </Badge>
                <Badge className={getGenderColor(user.gender)}>
                  {user.gender === "Male" ? "Nam" : user.gender === "Female" ? "Nữ" : "Khác"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin hệ thống */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Thông tin Hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID người dùng</label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{user._id}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ngày tạo</label>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cập nhật lần cuối</label>
                <p className="text-sm">{formatDate(user.updatedAt)}</p>
              </div>
              {user.ssoId && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SSO ID</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{user.ssoId}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => navigate(`/users/${user._id}/submissions`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Xem bài nộp
              </Button>
              <Button 
                className="w-full" 
                onClick={() => navigate(`/users/${user._id}/edit`)}
              >
                Chỉnh sửa thông tin
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/users")}
              >
                Quay lại danh sách
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
