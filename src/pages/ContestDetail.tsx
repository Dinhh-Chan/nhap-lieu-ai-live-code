import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Code, Calendar, ListOrdered, CheckCircle2, XCircle, Edit } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContestsApi, ContestUsersApi, ContestProblemsApi, ContestSubmissionsApi } from "@/services/contests";
import { ProblemsApi } from "@/services/problems";
import type { ContestDetailData } from "@/types/contest";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UsersApi } from "@/services/users";
import { Checkbox } from "@/components/ui/checkbox";
import KMark from "@/components/KMark";
import { ClassesApi } from "@/services/classes";
import { ClassStudentsApi } from "@/services/class-students";

type MockUser = { _id: string; username: string; fullname: string };
const mockUsers: MockUser[] = [
  { _id: "u_1", username: "student1", fullname: "Nguyen Van A" },
  { _id: "u_2", username: "student2", fullname: "Tran Thi B" },
  { _id: "u_3", username: "student3", fullname: "Le Van C" },
];

export default function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["contest", id],
    queryFn: () => ContestsApi.getById(id!),
    enabled: !!id,
  });

  const contest: ContestDetailData | undefined = data?.data;
  const [openAddUser, setOpenAddUser] = useState(false);
  const [openAddProblem, setOpenAddProblem] = useState(false);
  
  const [searchUser, setSearchUser] = useState("");
  const [searchProblem, setSearchProblem] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(7);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [openClassDetail, setOpenClassDetail] = useState(false);
  const [classStudentPage, setClassStudentPage] = useState(1);
  const [classStudentLimit] = useState(10);
  const [problemPage, setProblemPage] = useState(1);
  const [problemLimit, setProblemLimit] = useState(7);
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(undefined);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [openEditContest, setOpenEditContest] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    contest_name: "",
    description: "",
    start_time: "",
    end_time: "",
    is_active: true,
    duration_minutes: 0,
    max_problems: 0,
    order_index: 0,
    type: "practice",
  });

  const { data: usersPage, isLoading: usersLoading } = useQuery({
    queryKey: ["contest-add-users", userPage, userLimit, searchUser, openAddUser],
    queryFn: async () => {
      if (searchUser.trim()) {
        return await UsersApi.searchByUsernamePage(searchUser, userPage, userLimit, { sort: "username" });
      }
      const params: any = { select: "id,username,fullname", sort: "username" };
      const res = await UsersApi.list(userPage, userLimit, params);
      return { page: res.data?.page ?? userPage, limit: res.data?.limit ?? userLimit, total: res.data?.total ?? 0, result: res.data?.result ?? [] };
    },
    enabled: openAddUser,
  });

  const userResults: any[] = usersPage?.result ?? [];
  const userTotal: number = usersPage?.total ?? 0;
  const hasNextUsers = (usersPage?.page ?? userPage) * (usersPage?.limit ?? userLimit) < userTotal;

  const { data: classesData } = useQuery({
    queryKey: ["classes-many"],
    queryFn: () => ClassesApi.listMany(),
    enabled: openAddUser,
  });

  const classes = classesData?.data || [];

  const { data: classStudentsData, isLoading: classStudentsLoading } = useQuery({
    queryKey: ["class-students", selectedClassId],
    queryFn: () => ClassStudentsApi.getByClassId(selectedClassId!),
    enabled: !!selectedClassId && openAddUser,
  });

  const allClassStudents = classStudentsData?.data || [];
  const classStudentsTotal = allClassStudents.length;
  
  // Phân trang trên frontend
  const startIndex = (classStudentPage - 1) * classStudentLimit;
  const endIndex = startIndex + classStudentLimit;
  const classStudents = allClassStudents.slice(startIndex, endIndex);
  const hasNextClassStudents = endIndex < classStudentsTotal;

  const { mutate: addUsersToContest, isPending: addingUsers } = useMutation({
    mutationFn: (userIds: string[]) => ContestUsersApi.addMultiple(id!, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
      setOpenAddUser(false);
      setSelectedUserIds([]);
    },
  });

  const handleAddAllClassStudents = () => {
    const studentIds = classStudents
      .filter((cs: any) => cs.student_id && cs.is_active)
      .map((cs: any) => cs.student_id);
    if (studentIds.length > 0) {
      addUsersToContest(studentIds);
      setOpenClassDetail(false);
      setSelectedClassId(null);
    }
  };

  // Khi mở dialog chỉnh sửa, điền form với dữ liệu hiện tại
  const handleOpenEditDialog = () => {
    if (contest) {
      const startTime = contest.start_time ? new Date(contest.start_time).toISOString().slice(0, 16) : "";
      const endTime = contest.end_time ? new Date(contest.end_time).toISOString().slice(0, 16) : "";
      setEditForm({
        contest_name: contest.contest_name || "",
        description: contest.description || "",
        start_time: startTime,
        end_time: endTime,
        is_active: contest.is_active ?? true,
        duration_minutes: contest.duration_minutes ?? 0,
        max_problems: contest.max_problems ?? 0,
        order_index: contest.order_index ?? 0,
        type: contest.type || "practice",
      });
      setOpenEditContest(true);
    }
  };

  const { mutate: updateContest, isPending: updatingContest } = useMutation({
    mutationFn: (payload: Partial<any>) => ContestsApi.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
      queryClient.invalidateQueries({ queryKey: ["contests", "many"] });
      setOpenEditContest(false);
    },
  });

  const handleUpdateContest = () => {
    const payload: any = {
      contest_name: editForm.contest_name || contest?.contest_name,
      description: editForm.description,
      start_time: editForm.start_time ? new Date(editForm.start_time).toISOString() : contest?.start_time,
      end_time: editForm.end_time ? new Date(editForm.end_time).toISOString() : contest?.end_time,
      is_active: editForm.is_active,
      duration_minutes: Number(editForm.duration_minutes) || 0,
      max_problems: Number(editForm.max_problems) || 0,
      order_index: Number(editForm.order_index) || 0,
      type: editForm.type || "practice",
    };
    updateContest(payload);
  };

  const { data: problemsPage, isLoading: problemsLoading } = useQuery({
    queryKey: ["contest-add-problems", problemPage, problemLimit, searchProblem, difficultyFilter, openAddProblem],
    queryFn: () => {
      const params: any = {};
      if (searchProblem) {
        const filters: any[] = [];
        filters.push({ field: "name", operator: "CONTAIN", values: [searchProblem] });
        params.filters = JSON.stringify(filters);
      }
      if (difficultyFilter) {
        params.difficulty = Number(difficultyFilter);
      }
      return ProblemsApi.list(problemPage, problemLimit, params);
    },
    enabled: openAddProblem,
  });
  const problemResults: any[] = problemsPage?.data?.result ?? [];
  const problemTotal: number = problemsPage?.data?.total ?? 0;
  const hasNextProblems = problemPage * problemLimit < problemTotal;

  const { mutate: addProblemsToContest, isPending: addingProblems } = useMutation({
    mutationFn: (payload: { problem_id: string; order_index: number; score: number; is_visible: boolean }[]) =>
      ContestProblemsApi.addMultiple(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
      setOpenAddProblem(false);
      setSelectedProblemIds([]);
    },
  });

  const { data: rankingRes } = useQuery({
    queryKey: ["contest-ranking", id],
    queryFn: () => ContestsApi.getRanking(id!),
    enabled: !!id,
  });

  const ranking = rankingRes?.data?.ranking || [];
  const headerProblems = (ranking[0]?.problems && ranking[0].problems.length > 0)
    ? ranking[0].problems
    : (contest?.contest_problems || []);

  const { data: submissionsRes, isLoading: submissionsLoading } = useQuery({
    queryKey: ["contest-submissions", id, "all"],
    queryFn: () => ContestSubmissionsApi.getAllByContestId(id!),
    enabled: !!id,
  });
  const submissions: any[] = submissionsRes?.data ?? [];
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [selectedProblemDetail, setSelectedProblemDetail] = useState<string | null>(null);

  const { data: problemDetail, isLoading: problemDetailLoading } = useQuery({
    queryKey: ["problem-detail", selectedProblemDetail],
    queryFn: () => ProblemsApi.getById(selectedProblemDetail!),
    enabled: !!selectedProblemDetail,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/contests") }>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">Đang tải contest...</div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/contests") }>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Không thể tải thông tin contest</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate("/contests") }>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{contest.contest_name}</h1>
          <p className="text-muted-foreground">Chi tiết contest</p>
        </div>
      </div>

      {/* Header summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{contest.contest_name}</h2>
            <Badge variant={contest.is_active ? "default" : "secondary"}>{contest.is_active ? "Đang diễn ra" : "Không hoạt động"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleOpenEditDialog}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
              <Dialog open={openAddUser} onOpenChange={(v)=>{ setOpenAddUser(v); if(!v){ setUserPage(1); setSearchUser(""); setSelectedUserIds([]); setSelectedClassId(null); setClassStudentPage(1);} }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Thêm người</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle>Thêm người vào contest</DialogTitle>
                    <DialogDescription>
                      Chọn lớp hoặc tìm kiếm người dùng để thêm vào contest
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Label>Chọn lớp</Label>
                      <Select 
                        value={selectedClassId || undefined} 
                        onValueChange={(v) => {
                          setSelectedClassId(v || null);
                          setClassStudentPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lớp (tùy chọn)" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls: any) => (
                            <SelectItem key={cls._id} value={cls._id}>
                              {cls.class_name} ({cls.class_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedClassId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedClassId(null)}
                        >
                          Bỏ chọn lớp
                        </Button>
                      )}
                    </div>
                    {selectedClassId ? (
                      <>
                        <div className="text-sm font-medium">Danh sách học sinh trong lớp</div>
                        {classStudentsLoading ? (
                          <div className="text-center py-8 text-muted-foreground">Đang tải danh sách học sinh...</div>
                        ) : (
                          <div className="rounded border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[36px]"></TableHead>
                                  <TableHead>Họ tên</TableHead>
                                  <TableHead>Username</TableHead>
                                  <TableHead>Trạng thái</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {classStudents
                                  .filter((cs: any) => cs.is_active)
                                  .map((cs: any) => (
                                    <TableRow key={cs._id}>
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedUserIds.includes(cs.student_id)}
                                          onCheckedChange={(v)=> {
                                            setSelectedUserIds(prev => v 
                                              ? [...prev, cs.student_id] 
                                              : prev.filter(id => id !== cs.student_id)
                                            );
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {cs.student_basic?.fullname || cs.student?.fullname || "—"}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        @{cs.student_basic?.username || cs.student?.username || "—"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={cs.is_active ? "default" : "secondary"}>
                                          {cs.is_active ? "Hoạt động" : "Không hoạt động"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                {classStudents.filter((cs: any) => cs.is_active).length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                      Lớp chưa có học sinh hoạt động
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Tổng số học sinh: {classStudentsTotal} (đang hoạt động: {allClassStudents.filter((cs: any) => cs.is_active).length})
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const studentIds = allClassStudents
                                .filter((cs: any) => cs.student_id && cs.is_active)
                                .map((cs: any) => cs.student_id);
                              if (studentIds.length > 0) {
                                addUsersToContest(studentIds);
                              }
                            }}
                            disabled={classStudentsLoading || allClassStudents.filter((cs: any) => cs.student_id && cs.is_active).length === 0 || addingUsers}
                          >
                            {addingUsers ? "Đang thêm..." : `Thêm tất cả đang hoạt động (${allClassStudents.filter((cs: any) => cs.student_id && cs.is_active).length})`}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Trang {classStudentPage} / {Math.ceil(classStudentsTotal / classStudentLimit)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={classStudentPage <= 1 || classStudentsLoading} 
                              onClick={() => setClassStudentPage(p => Math.max(1, p - 1))}
                            >
                              Trước
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={classStudentsLoading || !hasNextClassStudents} 
                              onClick={() => setClassStudentPage(p => p + 1)}
                            >
                              Sau
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Input placeholder="Tìm theo username..." value={searchUser} onChange={(e)=> { setUserPage(1); setSearchUser(e.target.value); }} />
                        <div className="rounded border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[36px]"></TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead className="text-right">Chọn</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {userResults.map((u: any) => (
                                <TableRow key={u._id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedUserIds.includes(u._id)}
                                      onCheckedChange={(v)=> {
                                        setSelectedUserIds(prev => v ? [...prev, u._id] : prev.filter(id => id !== u._id));
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{u.fullname}</TableCell>
                                  <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" variant="outline" onClick={()=> setOpenAddUser(false)}>Thêm</Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">Trang {usersPage?.page || userPage}</div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={userPage<=1 || usersLoading} onClick={()=> setUserPage(p=> Math.max(1, p-1))}>Trước</Button>
                            <Button variant="outline" size="sm" disabled={usersLoading || !hasNextUsers} onClick={()=> setUserPage(p=> p+1)}>Sau</Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setOpenAddUser(false);
                        setSelectedUserIds([]);
                      }}
                    >
                      Đóng
                    </Button>
                    <Button
                      onClick={() => addUsersToContest(selectedUserIds)}
                      disabled={selectedUserIds.length === 0 || addingUsers}
                    >
                      {addingUsers ? "Đang thêm..." : `Thêm người đã chọn (${selectedUserIds.length})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={openClassDetail} onOpenChange={setOpenClassDetail}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {classes.find((c: any) => c._id === selectedClassId)?.class_name || "Chi tiết lớp"}
                    </DialogTitle>
                    <DialogDescription>
                      Danh sách học sinh trong lớp
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {classStudentsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : (
                      <>
                        <div className="rounded border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Trạng thái</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {classStudents.map((cs: any) => (
                                <TableRow key={cs._id}>
                                  <TableCell>
                                    {cs.student_basic?.fullname || cs.student?.fullname || cs.student?.firstname || cs.student?.lastname || "—"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    @{cs.student_basic?.username || cs.student?.username || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={cs.is_active ? "default" : "secondary"}>
                                      {cs.is_active ? "Hoạt động" : "Không hoạt động"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {classStudents.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    Lớp chưa có học sinh
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tổng số học sinh: {classStudents.filter((cs: any) => cs.is_active).length}
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpenClassDetail(false)}>
                      Đóng
                    </Button>
                    <Button
                      onClick={handleAddAllClassStudents}
                      disabled={classStudentsLoading || classStudents.filter((cs: any) => cs.student_id && cs.is_active).length === 0 || addingUsers}
                    >
                      {addingUsers ? "Đang thêm..." : `Thêm toàn bộ thành viên (${classStudents.filter((cs: any) => cs.student_id && cs.is_active).length})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={openEditContest} onOpenChange={setOpenEditContest}>
                <DialogContent className="sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa contest</DialogTitle>
                    <DialogDescription>
                      Cập nhật thông tin contest
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Tên</Label>
                      <Input className="col-span-3" value={editForm.contest_name} onChange={e => setEditForm({ ...editForm, contest_name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Mô tả</Label>
                      <Input className="col-span-3" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Bắt đầu</Label>
                      <Input type="datetime-local" className="col-span-3" value={editForm.start_time}
                        onChange={e => setEditForm({ ...editForm, start_time: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Kết thúc</Label>
                      <Input type="datetime-local" className="col-span-3" value={editForm.end_time}
                        onChange={e => setEditForm({ ...editForm, end_time: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Thời lượng (phút)</Label>
                      <Input type="number" min={0} className="col-span-3" value={editForm.duration_minutes}
                        onChange={e => setEditForm({ ...editForm, duration_minutes: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Số bài tối đa</Label>
                      <Input type="number" min={0} className="col-span-3" value={editForm.max_problems}
                        onChange={e => setEditForm({ ...editForm, max_problems: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Thứ tự</Label>
                      <Input type="number" min={0} className="col-span-3" value={editForm.order_index}
                        onChange={e => setEditForm({ ...editForm, order_index: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Loại</Label>
                      <div className="col-span-3">
                        <Select value={editForm.type} onValueChange={(v)=> setEditForm({ ...editForm, type: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="practice">practice</SelectItem>
                            <SelectItem value="exam">exam</SelectItem>
                            <SelectItem value="test">test</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Kích hoạt</Label>
                      <Switch checked={!!editForm.is_active} onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpenEditContest(false)}>Hủy</Button>
                    <Button onClick={handleUpdateContest} disabled={updatingContest}>
                      {updatingContest ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={openAddProblem} onOpenChange={setOpenAddProblem}>
                <DialogTrigger asChild>
                  <Button size="sm">Thêm bài tập</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Thêm bài tập vào contest</DialogTitle>
                    <DialogDescription>
                      Tìm kiếm và chọn bài tập để thêm vào contest
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input placeholder="Tìm kiếm..." value={searchProblem} onChange={(e)=> { setProblemPage(1); setSearchProblem(e.target.value); }} />
                      <Select value={difficultyFilter ?? "__all__"} onValueChange={(v)=> { setProblemPage(1); setDifficultyFilter(v === "__all__" ? undefined : v); }}>
                        <SelectTrigger><SelectValue placeholder="Độ khó" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Tất cả độ khó</SelectItem>
                          <SelectItem value="1">1 - Easy</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3 - Medium</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5 - Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <div />
                    </div>
                    <div className="rounded border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px] min-w-[40px]"></TableHead>
                            <TableHead className="min-w-[200px]">Tên bài</TableHead>
                            <TableHead className="min-w-[150px]">Topic</TableHead>
                            <TableHead className="min-w-[120px]">Sub Topic</TableHead>
                            <TableHead className="w-[80px] min-w-[80px]">Độ khó</TableHead>
                            <TableHead className="w-[80px] min-w-[80px]">Tests</TableHead>
                            <TableHead className="text-right min-w-[120px]">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {problemResults.map((p: any) => (
                            <TableRow key={p._id}>
                              <TableCell className="w-[40px] min-w-[40px]">
                                <Checkbox
                                  checked={selectedProblemIds.includes(p._id)}
                                  onCheckedChange={(v)=> {
                                    setSelectedProblemIds(prev => v ? [...prev, p._id] : prev.filter(id => id !== p._id));
                                  }}
                                />
                              </TableCell>
                              <TableCell className="min-w-[200px]">
                                <div className="max-w-[200px] truncate" title={p.name}>{p.name}</div>
                              </TableCell>
                              <TableCell className="min-w-[150px]">
                                <div className="max-w-[150px] truncate" title={p.topic?.topic_name || "—"}>
                                  {p.topic?.topic_name || "—"}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                <div className="max-w-[120px] truncate" title={p.sub_topic?.sub_topic_name || "—"}>
                                  {p.sub_topic?.sub_topic_name || "—"}
                                </div>
                              </TableCell>
                              <TableCell className="w-[80px] min-w-[80px]">{p.difficulty}</TableCell>
                              <TableCell className="w-[80px] min-w-[80px]">{p.number_of_tests ?? 0}</TableCell>
                              <TableCell className="text-right min-w-[120px]">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedProblemDetail(p._id)}
                                >
                                  Xem chi tiết
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Trang {problemsPage?.data?.page || problemPage}</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={problemPage<=1 || problemsLoading} onClick={()=> setProblemPage(p=> Math.max(1, p-1))}>Trước</Button>
                        <Button variant="outline" size="sm" disabled={problemsLoading || !hasNextProblems} onClick={()=> setProblemPage(p=> p+1)}>Sau</Button>
                        <Select value={String(problemLimit)} onValueChange={(v)=> setProblemLimit(Number(v))}>
                          <SelectTrigger className="w-[96px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 / trang</SelectItem>
                            <SelectItem value="14">14 / trang</SelectItem>
                            <SelectItem value="21">21 / trang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => { setOpenAddProblem(false); setSelectedProblemIds([]); }}>Đóng</Button>
                    <Button
                      onClick={() => {
                        const base = contest.contest_problems?.length ?? 0;
                        const payload = selectedProblemIds.map((pid, idx) => ({
                          problem_id: pid,
                          order_index: base + idx + 1,
                          score: 100,
                          is_visible: true,
                        }));
                        addProblemsToContest(payload);
                      }}
                      disabled={selectedProblemIds.length === 0 || addingProblems}
                    >
                      {addingProblems ? "Đang thêm..." : `Thêm bài đã chọn (${selectedProblemIds.length})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={!!selectedProblemDetail} onOpenChange={(open) => !open && setSelectedProblemDetail(null)}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{problemDetail?.name || "Chi tiết bài tập"}</DialogTitle>
                    <DialogDescription>
                      Thông tin chi tiết và mô tả bài tập
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {problemDetailLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : problemDetail ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Topic: </span>
                            <span className="font-medium">{problemDetail.topic?.topic_name || "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sub Topic: </span>
                            <span className="font-medium">{problemDetail.sub_topic?.sub_topic_name || "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Độ khó: </span>
                            <span className="font-medium">{problemDetail.difficulty}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Thời gian giới hạn: </span>
                            <span className="font-medium">{problemDetail.time_limit_ms ? `${problemDetail.time_limit_ms}ms` : "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bộ nhớ giới hạn: </span>
                            <span className="font-medium">{problemDetail.memory_limit_mb ? `${problemDetail.memory_limit_mb}MB` : "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Số test: </span>
                            <span className="font-medium">{problemDetail.number_of_tests ?? 0}</span>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <h3 className="text-lg font-semibold mb-3">Mô tả</h3>
                          <KMark content={problemDetail.description || ""} />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Không tìm thấy thông tin bài tập</div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setSelectedProblemDetail(null)}>Đóng</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2"><span className="text-muted-foreground">Bắt đầu:</span> {new Date(contest.start_time || "").toLocaleString("vi-VN")}</div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground">Kết thúc:</span> {new Date(contest.end_time || "").toLocaleString("vi-VN")}</div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground">Thời lượng:</span> {(contest.duration_minutes ?? 0)} phút</div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground">Số bài:</span> {(contest.contest_problems?.length || 0)} / {(contest.max_problems ?? 0)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking table like screenshot */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="ranking" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="problems">Bài tập ({contest.contest_problems?.length || 0})</TabsTrigger>
              <TabsTrigger value="users">Người tham gia ({contest.contest_users?.length || 0})</TabsTrigger>
              <TabsTrigger value="submissions">Bài nộp ({submissions.length})</TabsTrigger>
              <TabsTrigger value="ranking">Bảng xếp hạng</TabsTrigger>
            </TabsList>
            <TabsContent value="submissions">
              <div className="rounded border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Bài</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Memory</TableHead>
                      <TableHead>Nộp lúc</TableHead>
                      <TableHead className="text-right">Mã nguồn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="font-medium">{s.user?.fullname || s.student?.fullname || s.student_id}</div>
                          <div className="text-xs text-muted-foreground">@{s.user?.username || s.student?.username || "—"}</div>
                        </TableCell>
                        <TableCell>{s.problem?.name || s.problem_id}</TableCell>
                        <TableCell>{s.status}</TableCell>
                        <TableCell>{s.score}</TableCell>
                        <TableCell>{s.execution_time_ms} ms</TableCell>
                        <TableCell>{s.memory_used_mb} MB</TableCell>
                        <TableCell>{new Date(s.submitted_at).toLocaleString("vi-VN")}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={()=> setSelectedSubmission(s)}>Xem mã nguồn</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Mã nguồn - {selectedSubmission?.problem?.name || selectedSubmission?.problem_id || ""}</DialogTitle>
                                <DialogDescription>
                                  Mã nguồn bài nộp của học sinh
                                </DialogDescription>
                              </DialogHeader>
                              <div className="bg-muted p-4 rounded">
                                <pre className="text-sm overflow-x-auto">
                                  <code>{selectedSubmission?.code || "// Không có mã nguồn"}</code>
                                </pre>
                              </div>
                              <div className="mt-3 text-sm text-muted-foreground flex flex-wrap gap-4">
                                <span>Language: {selectedSubmission?.language_id ?? "—"}</span>
                                <span>Time: {selectedSubmission?.execution_time_ms ?? 0} ms</span>
                                <span>Memory: {selectedSubmission?.memory_used_mb ?? 0} MB</span>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {submissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                          {submissionsLoading ? "Đang tải..." : "Chưa có bài nộp"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="problems">
              <div className="rounded border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên bài</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Hiển thị</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contest.contest_problems?.map((cp) => (
                      <TableRow key={cp._id}>
                        <TableCell>{cp.problem?.name || "—"}</TableCell>
                        <TableCell>{cp.score}</TableCell>
                        <TableCell>{cp.is_visible ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="rounded border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contest.contest_users?.map((cu) => (
                      <TableRow key={cu._id}>
                        <TableCell>
                          <div className="font-medium">{cu.user?.fullname || "—"}</div>
                          <div className="text-xs text-muted-foreground">@{cu.user?.username || "—"}</div>
                        </TableCell>
                        <TableCell>{cu.is_manager ? "Manager" : "Participant"}</TableCell>
                        <TableCell>{cu.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="ranking">
              <div className="rounded border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Team/User</TableHead>
                      {headerProblems.map((p: any, idx: number) => (
                        <TableHead key={idx}>{String.fromCharCode(65 + idx)}</TableHead>
                      ))}
                      <TableHead>Score</TableHead>
                      <TableHead>AC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((row: any) => (
                      <TableRow key={row.user._id}>
                        <TableCell>
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">{row.rank}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{row.user.fullname}</div>
                          <div className="text-xs text-muted-foreground">@{row.user.username}</div>
                        </TableCell>
                        {headerProblems.map((p: any, idx: number) => {
                          const pid = p.problem?._id || p.problem_id;
                          const found = row.problems?.find((rp: any) => (rp.problem_id === pid));
                          const solved = found?.is_solved;
                          const score = found?.score ?? 0;
                          return (
                            <TableCell key={`${row.user._id}-${pid}-${idx}`} className={solved ? "bg-green-50" : undefined}>
                              <div className="flex items-center gap-2">
                                {solved ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">{score}</span>
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="font-semibold">{row.total_score ?? 0}</TableCell>
                        <TableCell className="font-semibold">{row.accepted_count ?? 0}</TableCell>
                      </TableRow>
                    ))}
                    {ranking.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={headerProblems.length + 4} className="text-center text-sm text-muted-foreground">
                          Chưa có dữ liệu xếp hạng
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


