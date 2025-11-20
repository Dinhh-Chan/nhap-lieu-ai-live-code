import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentSubmissionsApi } from "@/services/student-submissions";
import type {
  StudentSubmission,
  StudentSubmissionsPageResponse,
  StudentSubmissionsParams,
} from "@/types/student-submission";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  HardDrive,
  Loader,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const statusOptions = [
  { value: "accepted", label: "Đã chấp nhận" },
  { value: "wrong_answer", label: "Sai đáp án" },
  { value: "time_limit_exceeded", label: "Quá thời gian" },
  { value: "runtime_error", label: "Lỗi runtime" },
  { value: "compilation_error", label: "Lỗi biên dịch" },
  { value: "pending", label: "Đang chờ" },
  { value: "running", label: "Đang chạy" },
];

export default function SubmissionHistory() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  const { data, isLoading, isFetching, error } = useQuery<StudentSubmissionsPageResponse>({
    queryKey: ["submission-history", page, limit, statusFilter, sortKey, sortDir],
    queryFn: () => {
      const params: StudentSubmissionsParams = {
        page,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (sortKey) {
        params.sort = sortKey;
        params.order = sortDir;
      }
      return StudentSubmissionsApi.getPage(params);
    },
  });

  const submissions = data?.data?.result ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const keyword = searchTerm.trim().toLowerCase();
    return submissions.filter((submission) => {
      const problemName = submission.problem?.name?.toLowerCase() ?? "";
      const username = submission.student?.username?.toLowerCase() ?? "";
      const fullname = submission.student?.fullname?.toLowerCase() ?? "";
      return (
        problemName.includes(keyword) ||
        username.includes(keyword) ||
        fullname.includes(keyword) ||
        submission.submission_id?.toLowerCase().includes(keyword)
      );
    });
  }, [searchTerm, submissions]);

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
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatTime = (ms?: number) => {
    if (ms === undefined || ms === null) return "--";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMemory = (mb?: string | number | null) => {
    if (mb === undefined || mb === null) return "--";
    const num = typeof mb === "string" ? parseFloat(mb) : mb;
    if (Number.isNaN(num)) return `${mb}`;
    if (num < 1) return `${(num * 1024).toFixed(0)}KB`;
    return `${num.toFixed(2)}MB`;
  };

  const formatScore = (score?: string | number | null) => {
    if (score === undefined || score === null) return "--";
    const value = typeof score === "string" ? parseFloat(score) : score;
    if (Number.isNaN(value)) return `${score}`;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}%`;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Lịch sử nộp bài</h1>
          <p className="text-muted-foreground">Theo dõi toàn bộ bài nộp của hệ thống</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={statusFilter ?? "__all__"}
          onValueChange={(value) => {
            setStatusFilter(value === "__all__" ? undefined : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortKey ?? "__default__"}
          onValueChange={(value) => {
            setSortKey(value === "__default__" ? undefined : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">Mặc định</SelectItem>
            <SelectItem value="submitted_at">Thời gian nộp</SelectItem>
            <SelectItem value="score">Điểm số</SelectItem>
            <SelectItem value="execution_time_ms">Thời gian chạy</SelectItem>
            <SelectItem value="test_cases_passed">Test cases đúng</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
            setPage(1);
          }}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>

        <Select
          value={String(limit)}
          onValueChange={(value) => {
            setLimit(Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 bản ghi / trang</SelectItem>
            <SelectItem value="20">20 bản ghi / trang</SelectItem>
            <SelectItem value="50">50 bản ghi / trang</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm theo bài tập, mã bài nộp, học sinh..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setStatusFilter(undefined);
            setSortKey(undefined);
            setSortDir("desc");
            setLimit(10);
            setSearchTerm("");
            setPage(1);
          }}
        >
          Đặt lại
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học sinh</TableHead>
              <TableHead>Bài tập</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Số test</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Bộ nhớ</TableHead>
              <TableHead>Ngày nộp</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.map((submission) => (
              <TableRow key={submission._id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{submission.student?.fullname || "Không rõ"}</div>
                    <p className="text-sm text-muted-foreground">@{submission.student?.username || "—"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{submission.problem?.name || "N/A"}</div>
                    <p className="text-xs text-muted-foreground">{submission.problem_id}</p>
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
                  <div className="font-semibold">{formatScore(submission.score)}</div>
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
                          {selectedSubmission?.problem?.name || "Chi tiết bài nộp"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Học sinh</p>
                            <p className="font-medium">
                              {selectedSubmission?.student?.fullname || "Không rõ"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{selectedSubmission?.student?.username || "--"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(selectedSubmission?.status || "")}
                              <Badge className={getStatusColor(selectedSubmission?.status || "")}>
                                {getStatusText(selectedSubmission?.status || "")}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Điểm</p>
                            <p className="text-lg font-semibold">{formatScore(selectedSubmission?.score)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Thời gian & bộ nhớ</p>
                            <p className="text-sm">
                              {formatTime(selectedSubmission?.execution_time_ms)} •{" "}
                              {formatMemory(selectedSubmission?.memory_used_mb)}
                            </p>
                          </div>
                        </div>

                        {selectedSubmission?.error_message && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Thông báo lỗi</p>
                            <div className="bg-red-50 border border-red-200 rounded p-3 mt-1">
                              <pre className="text-sm text-red-800 whitespace-pre-wrap">
                                {selectedSubmission.error_message}
                              </pre>
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Code</p>
                          <div className="bg-muted border rounded p-4 mt-1">
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

        {filteredSubmissions.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">Không tìm thấy bài nộp nào</div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Trang {page}/{totalPages} • {total.toLocaleString("vi-VN")} bài nộp
          {isFetching && !isLoading && <span className="ml-2 text-xs">(Đang cập nhật...)</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Sau
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

