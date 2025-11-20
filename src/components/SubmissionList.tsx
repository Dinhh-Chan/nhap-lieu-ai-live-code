import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { StudentSubmission } from "@/types/student-submission";
import { AlertCircle, CheckCircle, Clock, Code, HardDrive, Loader, XCircle } from "lucide-react";

interface SubmissionListProps {
  submissions?: StudentSubmission[];
  onViewAllSubmissions?: () => void;
}

const statusText: Record<string, string> = {
  accepted: "Đã chấp nhận",
  wrong_answer: "Sai đáp án",
  time_limit_exceeded: "Quá thời gian",
  runtime_error: "Lỗi runtime",
  compilation_error: "Lỗi biên dịch",
  pending: "Đang chờ",
  running: "Đang chạy",
};

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
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-800";
    case "wrong_answer":
    case "runtime_error":
    case "compilation_error":
      return "bg-red-100 text-red-800";
    case "time_limit_exceeded":
      return "bg-orange-100 text-orange-800";
    case "pending":
    case "running":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
};

const formatTime = (ms?: number) => {
  if (ms === undefined || ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const formatMemory = (value?: string | number | null) => {
  if (value === undefined || value === null) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return `${value}`;
  if (num < 1) return `${(num * 1024).toFixed(0)} KB`;
  return `${num.toFixed(2)} MB`;
};

export const SubmissionList = ({ submissions, onViewAllSubmissions }: SubmissionListProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const rows = submissions?.slice(0, 10) ?? [];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Bài nộp gần đây</h3>
          <p className="text-sm text-muted-foreground">Hiển thị tối đa 10 bài nộp mới nhất</p>
        </div>
        {onViewAllSubmissions && (
          <Button variant="outline" size="sm" onClick={onViewAllSubmissions}>
            Xem tất cả
          </Button>
        )}
      </div>

      <div className="rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bài tập</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Bộ nhớ</TableHead>
              <TableHead>Nộp lúc</TableHead>
              <TableHead className="text-right">Mã nguồn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((submission) => (
              <TableRow key={submission._id}>
                <TableCell>
                  <div className="font-medium">{submission.problem?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{submission.problem_id}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    <Badge className={getStatusBadge(submission.status)}>
                      {statusText[submission.status] || submission.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">{submission.score ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {submission.test_cases_passed}/{submission.total_test_cases}
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(submission.execution_time_ms)}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    {formatMemory(submission.memory_used_mb)}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{formatDateTime(submission.submitted_at)}</TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Code className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedSubmission?.problem?.name || selectedSubmission?.problem_id || "Bài nộp"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-muted-foreground">Trạng thái</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(selectedSubmission?.status || "")}
                              <Badge className={getStatusBadge(selectedSubmission?.status || "")}>
                                {statusText[selectedSubmission?.status || ""] || selectedSubmission?.status || "—"}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Điểm</p>
                            <p className="font-semibold">{selectedSubmission?.score ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Thời gian</p>
                            <p>{formatTime(selectedSubmission?.execution_time_ms)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Bộ nhớ</p>
                            <p>{formatMemory(selectedSubmission?.memory_used_mb)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Mã nguồn</p>
                          <div className="bg-muted border rounded p-3">
                            <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                              {selectedSubmission?.code || "// Không có dữ liệu"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Hiện chưa có bài nộp nào cho người dùng này.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
