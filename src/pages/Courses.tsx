import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CoursesApi } from "@/services/courses";
import { ProblemsApi } from "@/services/problems";
import type { Course, CourseProblem } from "@/types/course";
import type { Problem } from "@/types/problem";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users, GraduationCap, BookOpen } from "lucide-react";

const defaultForm: Partial<Course> = {
  course_name: "",
  course_code: "",
  description: "",
  is_active: true,
};

export default function Courses() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Partial<Course>>({ ...defaultForm });
  const [activeTab, setActiveTab] = useState<"info" | "students" | "problems">("info");
  const [openAddProblem, setOpenAddProblem] = useState(false);
  const [searchProblem, setSearchProblem] = useState("");
  const [problemPage, setProblemPage] = useState(1);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", "many"],
    queryFn: () => CoursesApi.listMany(),
  });

  const courses = useMemo(() => Array.isArray(data) ? data : [], [data]);

  // Fetch course detail when editing
  const { data: courseDetail, isLoading: loadingDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["course-detail", editingCourse?._id, open],
    queryFn: () => CoursesApi.getById(editingCourse!._id),
    enabled: Boolean(editingCourse && open),
  });

  // Fetch problems for adding to course
  const { data: problemsData, isLoading: loadingProblems } = useQuery({
    queryKey: ["problems", "list", problemPage, searchProblem],
    queryFn: () => {
      if (searchProblem.trim()) {
        return ProblemsApi.search(searchProblem, problemPage, 10);
      }
      return ProblemsApi.list(problemPage, 10);
    },
    enabled: openAddProblem,
  });

  const problems = useMemo(() => {
    if (!problemsData) return [];
    if (Array.isArray(problemsData.data)) return problemsData.data;
    return problemsData.data?.result || [];
  }, [problemsData]);

  const hasNextProblems = problemsData?.data
    ? (problemsData.data.page || 1) * (problemsData.data.limit || 10) < (problemsData.data.total || 0)
    : false;

  const resetForm = () => {
    setForm({ ...defaultForm });
    setEditingCourse(null);
  };

  const closeDialog = () => {
    setOpen(false);
    setTimeout(() => {
      resetForm();
    }, 150);
  };

  const createMutation = useMutation({
    mutationFn: CoursesApi.create,
    onSuccess: () => {
      toast.success("Đã tạo khóa học mới");
      queryClient.invalidateQueries({ queryKey: ["courses", "many"] });
      closeDialog();
    },
    onError: () => {
      toast.error("Không thể tạo khóa học");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Course> }) => CoursesApi.updateById(id, dto),
    onSuccess: () => {
      toast.success("Đã cập nhật khóa học");
      queryClient.invalidateQueries({ queryKey: ["courses", "many"] });
      closeDialog();
    },
    onError: () => {
      toast.error("Không thể cập nhật khóa học");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: CoursesApi.deleteById,
    onSuccess: () => {
      toast.success("Đã xóa khóa học");
      queryClient.invalidateQueries({ queryKey: ["courses", "many"] });
    },
    onError: () => {
      toast.error("Không thể xóa khóa học");
    },
  });

  const addProblemMutation = useMutation({
    mutationFn: (dto: { course_id: string; problem_id: string; order_index: number; is_visible: boolean; is_required: boolean }) =>
      CoursesApi.addProblem(dto),
    onSuccess: () => {
      toast.success("Đã thêm bài tập vào khóa học");
      refetchDetail();
      queryClient.invalidateQueries({ queryKey: ["courses", "many"] });
    },
    onError: () => {
      toast.error("Không thể thêm bài tập");
    },
  });

  const removeProblemMutation = useMutation({
    mutationFn: ({ courseId, problemId }: { courseId: string; problemId: string }) =>
      CoursesApi.removeProblem(courseId, problemId),
    onSuccess: () => {
      toast.success("Đã xóa bài tập khỏi khóa học");
      refetchDetail();
      queryClient.invalidateQueries({ queryKey: ["courses", "many"] });
    },
    onError: () => {
      toast.error("Không thể xóa bài tập");
    },
  });

  const handleSubmit = () => {
    if (!form.course_name || !form.course_code) {
      toast.error("Vui lòng nhập đầy đủ tên khóa học và mã khóa học");
      return;
    }

    const payload = {
      course_name: form.course_name,
      course_code: form.course_code,
      description: form.description || "",
      is_active: form.is_active ?? true,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse._id, dto: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      course_name: course.course_name,
      course_code: course.course_code,
      description: course.description ?? "",
      is_active: course.is_active ?? true,
    });
    setActiveTab("info");
    setOpen(true);
  };

  const handleAddProblems = () => {
    if (selectedProblemIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một bài tập");
      return;
    }
    const currentProblemsCount = courseDetail?.problems?.length || 0;
    selectedProblemIds.forEach((problemId, index) => {
      addProblemMutation.mutate({
        course_id: editingCourse!._id,
        problem_id: problemId,
        order_index: currentProblemsCount + index,
        is_visible: true,
        is_required: true,
      });
    });
    setSelectedProblemIds([]);
    setOpenAddProblem(false);
  };

  const handleDelete = (course: Course) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${course.course_name}"?`)) {
      return;
    }
    deleteMutation.mutate(course._id);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Khóa học</h1>
          <p className="text-muted-foreground">Quản lý danh sách khóa học</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm khóa học
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách khóa học</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">Không thể tải danh sách khóa học</div>
          ) : (
            <div className="rounded border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên khóa học</TableHead>
                    <TableHead>Mã khóa học</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Chưa có khóa học nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow key={course._id}>
                        <TableCell className="font-medium">{course.course_name}</TableCell>
                        <TableCell className="text-muted-foreground">{course.course_code}</TableCell>
                        <TableCell className="max-w-[320px]">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={course.is_active ? "default" : "secondary"}>
                            {course.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Sửa
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(course)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(next) => {
        if (!next) {
          closeDialog();
        } else {
          setOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Chỉnh sửa khóa học" : "Thêm khóa học"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Cập nhật thông tin khóa học và quản lý học sinh, bài tập" : "Tạo khóa học mới"}
            </DialogDescription>
          </DialogHeader>
          {editingCourse ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="students">Học sinh ({courseDetail?.students?.length || 0})</TabsTrigger>
                <TabsTrigger value="problems">Bài tập ({courseDetail?.problems?.length || 0})</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="course_name">Tên khóa học</Label>
                    <Input
                      id="course_name"
                      value={form.course_name ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, course_name: e.target.value }))}
                      placeholder="Nhập tên khóa học"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course_code">Mã khóa học</Label>
                    <Input
                      id="course_code"
                      value={form.course_code ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, course_code: e.target.value }))}
                      placeholder="Nhập mã khóa học"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course_desc">Mô tả</Label>
                    <Textarea
                      id="course_desc"
                      value={form.description ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Nhập mô tả (không bắt buộc)"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded border px-3 py-2">
                    <div>
                      <Label>Kích hoạt</Label>
                      <p className="text-xs text-muted-foreground">Cho phép khóa học hiển thị với người dùng</p>
                    </div>
                    <Switch
                      checked={!!form.is_active}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={closeDialog}>
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Đang lưu..." : "Cập nhật"}
                  </Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="students" className="space-y-4">
                {loadingDetail ? (
                  <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                ) : (
                  <div className="rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Họ tên</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Bài tập hoàn thành</TableHead>
                          <TableHead>Ngày tham gia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseDetail?.students && courseDetail.students.length > 0 ? (
                          courseDetail.students.map((student) => (
                            <TableRow key={student._id}>
                              <TableCell className="font-medium">{student.fullname}</TableCell>
                              <TableCell className="text-muted-foreground">@{student.username}</TableCell>
                              <TableCell>{student.email || "—"}</TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {student.completed_problems ?? 0}/{student.total_problems ?? 0}
                                </div>
                              </TableCell>
                              <TableCell>
                                {student.join_at ? new Date(student.join_at).toLocaleDateString("vi-VN") : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                              Chưa có học sinh nào
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="problems" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Danh sách bài tập</div>
                  <Button size="sm" onClick={() => { setSelectedProblemIds([]); setOpenAddProblem(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm bài tập
                  </Button>
                </div>
                {loadingDetail ? (
                  <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                ) : (
                  <div className="rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thứ tự</TableHead>
                          <TableHead>Tên bài tập</TableHead>
                          <TableHead>Độ khó</TableHead>
                          <TableHead>Hiển thị</TableHead>
                          <TableHead>Bắt buộc</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseDetail?.problems && courseDetail.problems.length > 0 ? (
                          courseDetail.problems
                            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                            .map((cp: CourseProblem) => (
                              <TableRow key={cp._id}>
                                <TableCell>{cp.order_index ?? "—"}</TableCell>
                                <TableCell className="font-medium">
                                  {cp.problem?.name || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{cp.problem?.difficulty || "—"}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={cp.is_visible ? "default" : "secondary"}>
                                    {cp.is_visible ? "Có" : "Không"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={cp.is_required ? "default" : "secondary"}>
                                    {cp.is_required ? "Có" : "Không"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Bạn có chắc chắn muốn xóa bài tập "{cp.problem?.name}" khỏi khóa học này?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => removeProblemMutation.mutate({
                                            courseId: editingCourse!._id,
                                            problemId: cp.problem_id,
                                          })}
                                        >
                                          Xóa
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                              Chưa có bài tập nào
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="course_name">Tên khóa học</Label>
                  <Input
                    id="course_name"
                    value={form.course_name ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, course_name: e.target.value }))}
                    placeholder="Nhập tên khóa học"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course_code">Mã khóa học</Label>
                  <Input
                    id="course_code"
                    value={form.course_code ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, course_code: e.target.value }))}
                    placeholder="Nhập mã khóa học"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course_desc">Mô tả</Label>
                  <Textarea
                    id="course_desc"
                    value={form.description ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Nhập mô tả (không bắt buộc)"
                  />
                </div>
                <div className="flex items-center justify-between rounded border px-3 py-2">
                  <div>
                    <Label>Kích hoạt</Label>
                    <p className="text-xs text-muted-foreground">Cho phép khóa học hiển thị với người dùng</p>
                  </div>
                  <Switch
                    checked={!!form.is_active}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Đang lưu..." : "Tạo mới"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog thêm bài tập */}
      <Dialog open={openAddProblem} onOpenChange={setOpenAddProblem}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm bài tập vào khóa học</DialogTitle>
            <DialogDescription>
              Chọn các bài tập để thêm vào khóa học "{editingCourse?.course_name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Tìm kiếm bài tập..."
              value={searchProblem}
              onChange={(e) => {
                setProblemPage(1);
                setSearchProblem(e.target.value);
              }}
            />
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[36px]"></TableHead>
                    <TableHead>Tên bài tập</TableHead>
                    <TableHead>Độ khó</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProblems ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : problems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                        Không tìm thấy bài tập nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    problems.map((problem: Problem) => (
                      <TableRow key={problem._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProblemIds.includes(problem._id)}
                            onCheckedChange={(checked) => {
                              setSelectedProblemIds((prev) =>
                                checked
                                  ? [...prev, problem._id]
                                  : prev.filter((id) => id !== problem._id)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{problem.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{problem.difficulty || "—"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Trang {problemPage} / {problemsData?.data?.total ? Math.ceil(problemsData.data.total / (problemsData.data.limit || 10)) : 1}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={problemPage <= 1 || loadingProblems}
                  onClick={() => setProblemPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingProblems || !hasNextProblems}
                  onClick={() => setProblemPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setOpenAddProblem(false);
              setSelectedProblemIds([]);
            }}>
              Hủy
            </Button>
            <Button
              onClick={handleAddProblems}
              disabled={selectedProblemIds.length === 0 || addProblemMutation.isPending}
            >
              {addProblemMutation.isPending ? "Đang thêm..." : `Thêm ${selectedProblemIds.length} bài tập`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


