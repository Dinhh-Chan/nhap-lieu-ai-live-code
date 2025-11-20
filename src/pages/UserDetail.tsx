import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UsersApi } from "@/services/users";
import { StudentSubmissionsApi } from "@/services/student-submissions";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { SubmissionList } from "@/components/SubmissionList";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import KMark from "@/components/KMark";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => UsersApi.getById(id!),
    enabled: !!id,
  });

  const { data: statistics } = useQuery({
    queryKey: ["user-statistics", id],
    queryFn: () => UsersApi.getStatistics(id!),
    enabled: !!id,
  });

  const { data: submissions } = useQuery({
    queryKey: ["student-submissions", id],
    queryFn: () => StudentSubmissionsApi.getByStudentId(id!),
    enabled: !!id,
  });

  const { data: overviewData, isLoading: isLoadingOverview, isError: isErrorOverview } = useQuery({
    queryKey: ["user-overview", id],
    queryFn: () => UsersApi.getOverviewUser(id!),
    enabled: aiDialogOpen && !!id, // Chỉ gọi khi dialog mở và có id
    retry: 1, // Retry 1 lần nếu thất bại
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

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

  const handleOpenAiDialog = () => {
    setAiDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Profile - {user.fullname}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
        <Button onClick={handleOpenAiDialog} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat với AI
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Submission List */}
          <SubmissionList
            submissions={submissions?.data}
            onViewAllSubmissions={() => navigate(`/users/${id}/submissions`)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProfileSidebar user={user} statistics={statistics?.data} />
        </div>
      </div>

      {/* AI Analysis Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Phân tích từ AI
            </DialogTitle>
            <DialogDescription className="text-base">
              Phân tích chi tiết về hiệu suất và khả năng của người dùng
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            {isLoadingOverview ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2 text-blue-500" />
                <span className="text-muted-foreground mt-4">Đang phân tích thông tin...</span>
                <p className="text-xs text-muted-foreground mt-2">Quá trình này có thể mất khoảng 10 giây</p>
              </div>
            ) : isErrorOverview ? (
              <div className="text-center py-12">
                <div className="text-red-500 font-semibold mb-2">Không thể tạo phân tích</div>
                <p className="text-sm text-muted-foreground">Máy chủ đang bận. Vui lòng thử lại sau vài phút.</p>
                <Button 
                  onClick={() => setAiDialogOpen(false)} 
                  variant="outline" 
                  className="mt-4"
                >
                  Đóng
                </Button>
              </div>
            ) : overviewData?.data?.layer3?.aiKmark ? (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                <KMark 
                  content={overviewData.data.layer3.aiKmark.replace(/^```kmark\n/, "").replace(/\n```$/, "")} 
                  className="w-full"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Không có dữ liệu phân tích</div>
                <p className="text-sm text-muted-foreground mt-2">Vui lòng thử lại sau</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}