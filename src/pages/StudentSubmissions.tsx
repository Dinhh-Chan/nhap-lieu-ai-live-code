import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { StudentSubmissionsApi } from "@/services/student-submissions";
import type { StudentSubmission, StudentSubmissionsParams } from "@/types/student-submission";
import { ArrowLeft, Code, Clock, HardDrive, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function StudentSubmissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [problemFilter, setProblemFilter] = useState<string | undefined>(undefined);
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  const { data: submissionsData, isLoading, error } = useQuery({
    queryKey: ["student-submissions", id, statusFilter, problemFilter, sortKey, sortDir],
    queryFn: () => {
      const params: StudentSubmissionsParams = {};
      if (statusFilter) params.status = statusFilter;
      if (problemFilter) params.problem_id = problemFilter;
      if (sortKey) {
        params.sort = sortKey;
        params.order = sortDir;
      }
      return StudentSubmissionsApi.getByStudentId(id!, params);
    },
    enabled: !!id,
  });

  const submissions = useMemo(() => (submissionsData?.data ? submissionsData.data : []), [submissionsData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "wrong_answer":
      case "time_limit_exceeded":
      case "runtime_error":
      case "compilation_error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      case "running":
        return <Loader className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "wrong_answer":
        return "bg-red-100 text-red-800";
      case "time_limit_exceeded":
        return "bg-orange-100 text-orange-800";
      case "runtime_error":
        return "bg-red-100 text-red-800";
      case "compilation_error":
        return "bg-purple-100 text-purple-800";
      case "pending":
      case "running":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Đã chấp nhận";
      case "wrong_answer":
        return "Sai đáp án";
      case "time_limit_exceeded":
        return "Quá thời gian";
      case "runtime_error":
        return "Lỗi runtime";
      case "compilation_error":
        return "Lỗi biên dịch";
      case "pending":
        return "Đang chờ";
      case "running":
        return "Đang chạy";
      default:
        return status;
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-green-500";
    if (difficulty <= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMemory = (mb: string) => {
    const num = parseFloat(mb);
    if (num < 1) return `${(num * 1024).toFixed(0)}KB`;
    return `${num.toFixed(2)}MB`;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate(`/users/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Đang tải bài nộp...</div>
        </div>
      </div>
    );
  }

  if (error || !submissionsData) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate(`/users/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Không thể tải bài nộp</div>
            <Button onClick={() => navigate(`/users/${id}`)}>Quay lại profile</Button>
        </div>
      </div>
    );
  }

  const student = submissions[0]?.student;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate(`/users/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Bài nộp của học sinh</h1>
          <p className="text-muted-foreground">
            {student ? `${student.fullname} (${student.username})` : "Đang tải..."}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accepted">Đã chấp nhận</SelectItem>
            <SelectItem value="wrong_answer">Sai đáp án</SelectItem>
            <SelectItem value="time_limit_exceeded">Quá thời gian</SelectItem>
            <SelectItem value="runtime_error">Lỗi runtime</SelectItem>
            <SelectItem value="compilation_error">Lỗi biên dịch</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
            <SelectItem value="running">Đang chạy</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={setSortKey}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="submitted_at">Thời gian nộp</SelectItem>
            <SelectItem value="score">Điểm số</SelectItem>
            <SelectItem value="execution_time_ms">Thời gian chạy</SelectItem>
            <SelectItem value="test_cases_passed">Test cases đúng</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setStatusFilter(undefined);
            setProblemFilter(undefined);
            setSortKey(undefined);
            setSortDir("desc");
          }}
        >
          Reset
        </Button>
      </div>

      {/* Submissions Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bài tập</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Test Cases</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Bộ nhớ</TableHead>
              <TableHead>Ngày nộp</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission._id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{submission.problem?.name || "N/A"}</div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getDifficultyColor(submission.problem?.difficulty || 0)}`} />
                      <span className="text-sm text-muted-foreground">
                        Độ khó: {submission.problem?.difficulty || 0}/5
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusText(submission.status)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{submission.score}%</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {submission.test_cases_passed}/{submission.total_test_cases}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatTime(submission.execution_time_ms)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <HardDrive className="h-3 w-3" />
                    {formatMemory(submission.memory_used_mb)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(submission.submitted_at)}</div>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Xem code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Code của bài: {selectedSubmission?.problem?.name || "N/A"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(selectedSubmission?.status || "")}
                              <Badge className={getStatusColor(selectedSubmission?.status || "")}>
                                {getStatusText(selectedSubmission?.status || "")}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Điểm</label>
                            <p className="text-lg font-semibold">{selectedSubmission?.score}%</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Thời gian</label>
                            <p className="text-sm">{formatTime(selectedSubmission?.execution_time_ms || 0)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Bộ nhớ</label>
                            <p className="text-sm">{formatMemory(selectedSubmission?.memory_used_mb || "0")}</p>
                          </div>
                        </div>
                        
                        {selectedSubmission?.error_message && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Lỗi</label>
                            <div className="bg-red-50 border border-red-200 rounded p-3 mt-1">
                              <pre className="text-sm text-red-800 whitespace-pre-wrap">
                                {selectedSubmission.error_message}
                              </pre>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Code</label>
                          <div className="bg-gray-50 border rounded p-4 mt-1">
                            <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                              {selectedSubmission?.code}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Không có bài nộp nào</div>
        </div>
      )}
    </div>
  );
}
