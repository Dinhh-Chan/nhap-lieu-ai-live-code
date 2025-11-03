import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Code, Calendar, ListOrdered, CheckCircle2, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContestsApi, ContestUsersApi, ContestProblemsApi, ContestSubmissionsApi } from "@/services/contests";
import { ProblemsApi } from "@/services/problems";
import type { ContestDetailData } from "@/types/contest";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UsersApi } from "@/services/users";
import { Checkbox } from "@/components/ui/checkbox";

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
  
  const [searchProblem, setSearchProblem] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(7);
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [genderFilter, setGenderFilter] = useState<string | undefined>(undefined);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [problemPage, setProblemPage] = useState(1);
  const [problemLimit, setProblemLimit] = useState(7);
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(undefined);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  const { data: usersPage, isLoading: usersLoading } = useQuery({
    queryKey: ["contest-add-users", userPage, userLimit, roleFilter, genderFilter, openAddUser],
    queryFn: () => {
      const params: any = {};
      
      params.select = "id,username,fullname";
      params.sort = "username";
      return UsersApi.list(userPage, userLimit, params);
    },
    enabled: openAddUser,
  });

  const userResults: any[] = usersPage?.data?.result ?? [];
  const userTotal: number = usersPage?.data?.total ?? 0;
  const hasNextUsers = userPage * userLimit < userTotal;

  const { mutate: addUsersToContest, isPending: addingUsers } = useMutation({
    mutationFn: (userIds: string[]) => ContestUsersApi.addMultiple(id!, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
      setOpenAddUser(false);
      setSelectedUserIds([]);
    },
  });

  const { data: problemsPage, isLoading: problemsLoading } = useQuery({
    queryKey: ["contest-add-problems", problemPage, problemLimit, searchProblem, difficultyFilter, openAddProblem],
    queryFn: () => {
      const params: any = {};
      const filters: any[] = [];
      if (searchProblem) {
        filters.push({ field: "name", operator: "CONTAIN", values: [searchProblem] });
      }
      if (difficultyFilter) {
        filters.push({ field: "difficulty", operator: "EQUAL", values: [Number(difficultyFilter)] });
      }
      if (filters.length > 0) params.filters = JSON.stringify(filters.length === 1 ? filters : [{ operator: "AND", filters }]);
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
              <Dialog open={openAddUser} onOpenChange={(v)=>{ setOpenAddUser(v); if(!v){ setUserPage(1); setRoleFilter(undefined); setGenderFilter(undefined);} }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Thêm người</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle>Thêm người vào contest</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div />
                      <Select value={roleFilter ?? "__all__"} onValueChange={(v)=>{ setUserPage(1); setRoleFilter(v === "__all__" ? undefined : v); }}>
                        <SelectTrigger><SelectValue placeholder="Vai trò" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Tất cả vai trò</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Teacher">Teacher</SelectItem>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="User">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={genderFilter ?? "__all__"} onValueChange={(v)=>{ setUserPage(1); setGenderFilter(v === "__all__" ? undefined : v); }}>
                        <SelectTrigger><SelectValue placeholder="Giới tính" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Tất cả giới tính</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[36px]"></TableHead>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Giới tính</TableHead>
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
                              <TableCell>{u.systemRole}</TableCell>
                              <TableCell>{u.gender || "—"}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={()=> setOpenAddUser(false)}>Thêm</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Trang {usersPage?.data?.page || userPage}</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={userPage<=1 || usersLoading} onClick={()=> setUserPage(p=> Math.max(1, p-1))}>Trước</Button>
                        <Button variant="outline" size="sm" disabled={usersLoading || !hasNextUsers} onClick={()=> setUserPage(p=> p+1)}>Sau</Button>
                        <Select value={String(userLimit)} onValueChange={(v)=> setUserLimit(Number(v))}>
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
              <Dialog open={openAddProblem} onOpenChange={setOpenAddProblem}>
                <DialogTrigger asChild>
                  <Button size="sm">Thêm bài tập</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle>Thêm bài tập vào contest</DialogTitle>
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
                    <div className="rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[36px]"></TableHead>
                            <TableHead>Tên bài</TableHead>
                            <TableHead>Độ khó</TableHead>
                            <TableHead>Tests</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {problemResults.map((p: any) => (
                            <TableRow key={p._id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedProblemIds.includes(p._id)}
                                  onCheckedChange={(v)=> {
                                    setSelectedProblemIds(prev => v ? [...prev, p._id] : prev.filter(id => id !== p._id));
                                  }}
                                />
                              </TableCell>
                              <TableCell>{p.name}</TableCell>
                              <TableCell>{p.difficulty}</TableCell>
                              <TableCell>{p.number_of_tests ?? 0}</TableCell>
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


