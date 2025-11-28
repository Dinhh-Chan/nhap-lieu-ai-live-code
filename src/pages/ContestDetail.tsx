import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Code, Calendar, ListOrdered, CheckCircle2, XCircle, Edit, AlertCircle, Loader, CheckCircle, XOctagon, Filter, Trash2, Clock3, Ban } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContestsApi, ContestUsersApi, ContestProblemsApi, ContestSubmissionsApi } from "@/services/contests";
import { ProblemsApi } from "@/services/problems";
import type { ContestDetailData } from "@/types/contest";
import type { Problem, ProblemListResponse } from "@/types/problem";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UsersApi } from "@/services/users";
import { Checkbox } from "@/components/ui/checkbox";
import KMark from "@/components/KMark";
import { ClassesApi } from "@/services/classes";
import { ClassStudentsApi } from "@/services/class-students";
import { TopicsApi } from "@/services/topics";
import type { Topic } from "@/services/topics";
import { SubTopicsApi } from "@/services/sub-topics";
import type { SubTopic } from "@/services/sub-topics";
import { toast } from "sonner";

const submissionStatusText: Record<string, string> = {
  accepted: "Đã chấp nhận",
  wrong_answer: "Sai đáp án",
  time_limit_exceeded: "Quá thời gian",
  runtime_error: "Lỗi runtime",
  compilation_error: "Lỗi biên dịch",
  pending: "Đang chờ",
  running: "Đang chạy",
};

const getSubmissionStatusBadge = (status: string) => {
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

const getSubmissionStatusIcon = (status: string) => {
  switch (status) {
    case "accepted":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "wrong_answer":
    case "runtime_error":
    case "compilation_error":
      return <XOctagon className="h-4 w-4 text-red-500" />;
    case "time_limit_exceeded":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "pending":
    case "running":
      return <Loader className="h-4 w-4 text-yellow-500 animate-spin" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getContestUserStatusMeta = (status?: string) => {
  const normalized = (status ?? "").toLowerCase();
  switch (normalized) {
    case "enrolled":
      return {
        label: "Đã tham gia",
        badge: "bg-green-100 text-green-700",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };
    case "pending":
      return {
        label: "Đang chờ duyệt",
        badge: "bg-yellow-100 text-yellow-800",
        icon: <Clock3 className="h-3.5 w-3.5" />,
      };
    case "rejected":
      return {
        label: "Đã từ chối",
        badge: "bg-red-100 text-red-700",
        icon: <XCircle className="h-3.5 w-3.5" />,
      };
    default:
      return {
        label: status ?? "Không xác định",
        badge: "bg-slate-100 text-slate-700",
        icon: <Ban className="h-3.5 w-3.5" />,
      };
  }
};

type ProblemFilterState = {
  topicId?: string;
  subTopicId?: string;
  difficulty?: string;
};

type SubTopicProblemResult = {
  list: Problem[];
  total: number;
  page: number;
  limit: number;
};

type ProblemsQueryResult =
  | { mode: "paged"; data: ProblemListResponse }
  | { mode: "subTopic"; data: SubTopicProblemResult };

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
  const [problemFilters, setProblemFilters] = useState<ProblemFilterState>({});
  const [problemFilterDialogOpen, setProblemFilterDialogOpen] = useState(false);
  const [removingProblemId, setRemovingProblemId] = useState<string | null>(null);
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState<string | null>(null);
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "enrolled" | "pending" | "rejected">("all");
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [removingContestUserId, setRemovingContestUserId] = useState<string | null>(null);
  const userStatusOptions: { value: "all" | "enrolled" | "pending" | "rejected"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "enrolled", label: "Đã tham gia" },
    { value: "pending", label: "Đang chờ duyệt" },
    { value: "rejected", label: "Đã từ chối" },
  ];
  const [tempProblemFilters, setTempProblemFilters] = useState<ProblemFilterState>({});
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

  const { data: topicsData } = useQuery<Topic[]>({
    queryKey: ["topics-many"],
    queryFn: () => TopicsApi.list(),
    enabled: openAddProblem || problemFilterDialogOpen,
  });
  const topics: Topic[] = topicsData || [];

  const { data: subTopicsData } = useQuery<SubTopic[]>({
    queryKey: ["sub-topics-many"],
    queryFn: () => SubTopicsApi.list(),
    enabled: openAddProblem || problemFilterDialogOpen,
  });
  const subTopics: SubTopic[] = subTopicsData || [];

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
  const handleRemoveContestProblem = (contestProblemId?: string, problemName?: string) => {
    if (!contestProblemId) return;
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa bài "${problemName ?? ""}" khỏi contest?`,
    );
    if (!confirmed) return;
    removeContestProblem(contestProblemId);
  };
  const handleToggleProblemVisibility = (problemId?: string, currentVisible?: boolean) => {
    if (!problemId || typeof currentVisible !== "boolean") return;
    toggleContestProblemVisibility({ problemId, nextVisible: !currentVisible });
  };
  const filteredContestUsers = useMemo(() => {
    if (!contest?.contest_users) return [];
    if (userStatusFilter === "all") return contest.contest_users;
    return contest.contest_users.filter(
      (cu) => (cu.status ?? "").toLowerCase() === userStatusFilter,
    );
  }, [contest?.contest_users, userStatusFilter]);
  const { mutate: approveContestUser } = useMutation({
    mutationFn: (payload: { contestId: string; userId: string }) =>
      ContestUsersApi.approve(payload.contestId, payload.userId),
    onMutate: ({ userId }) => {
      setApprovingUserId(userId);
    },
    onSuccess: () => {
      toast.success("Đã duyệt người dùng");
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
    },
    onError: () => {
      toast.error("Không thể duyệt người dùng, vui lòng thử lại");
    },
    onSettled: () => {
      setApprovingUserId(null);
    },
  });
  const { mutate: rejectContestUser } = useMutation({
    mutationFn: (payload: { contestId: string; userId: string }) =>
      ContestUsersApi.reject(payload.contestId, payload.userId),
    onMutate: ({ userId }) => {
      setRejectingUserId(userId);
    },
    onSuccess: () => {
      toast.success("Đã từ chối yêu cầu tham gia");
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
    },
    onError: () => {
      toast.error("Không thể từ chối yêu cầu, vui lòng thử lại");
    },
    onSettled: () => {
      setRejectingUserId(null);
    },
  });
  const { mutate: removeContestUserById } = useMutation({
    mutationFn: (contestUserId: string) => ContestUsersApi.deleteById(contestUserId),
    onMutate: (contestUserId: string) => {
      setRemovingContestUserId(contestUserId);
    },
    onSuccess: () => {
      toast.success("Đã xóa người dùng khỏi contest");
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
    },
    onError: () => {
      toast.error("Không thể xóa người dùng, vui lòng thử lại");
    },
    onSettled: () => {
      setRemovingContestUserId(null);
    },
  });
  const handleApproveUser = (contestUserId?: string, userId?: string) => {
    if (!contestUserId || !userId || !id) return;
    approveContestUser({ contestId: id, userId });
  };
  const handleRejectUser = (contestUserId?: string, userId?: string) => {
    if (!contestUserId || !userId || !id) return;
    const confirmed = window.confirm("Bạn có chắc muốn từ chối yêu cầu tham gia này?");
    if (!confirmed) return;
    rejectContestUser({ contestId: id, userId });
  };
  const handleRemoveContestUser = (contestUserId?: string, fullname?: string) => {
    if (!contestUserId) return;
    const confirmed = window.confirm(`Xóa người dùng "${fullname ?? ""}" khỏi contest?`);
    if (!confirmed) return;
    removeContestUserById(contestUserId);
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

  const usingSubTopicFilter = !!problemFilters.subTopicId;
  const hasProblemFilters = Boolean(problemFilters.topicId || problemFilters.subTopicId || problemFilters.difficulty);
  const problemsQueryKey = usingSubTopicFilter
    ? ["contest-add-problems", "sub-topic", problemFilters.subTopicId, problemPage, problemLimit, searchProblem]
    : ["contest-add-problems", "list", problemPage, problemLimit, searchProblem, problemFilters.difficulty, problemFilters.topicId];

  const { data: problemsSource, isLoading: problemsLoading } = useQuery<ProblemsQueryResult>({
    queryKey: problemsQueryKey,
    queryFn: async () => {
      if (problemFilters.subTopicId) {
        const subTopicParams: Record<string, any> = {};
        if (searchProblem) {
          subTopicParams.search = searchProblem;
        }
        if (problemFilters.difficulty) {
          subTopicParams.difficulty = Number(problemFilters.difficulty);
        }
        const res = await ProblemsApi.listBySubTopic(problemFilters.subTopicId, problemPage, problemLimit, subTopicParams);
        const payload = res.data;
        let list: Problem[] = [];
        let total = 0;
        let page = problemPage;
        let limit = problemLimit;
        if (Array.isArray(payload)) {
          list = payload;
          total = payload.length;
          page = 1;
          limit = payload.length || problemLimit;
        } else if (payload) {
          list = payload.result ?? [];
          total = payload.total ?? list.length;
          page = payload.page ?? problemPage;
          limit = payload.limit ?? problemLimit;
        }
        return { mode: "subTopic", data: { list, total, page, limit } };
      }

      const trimmedSearch = searchProblem.trim();
      if (trimmedSearch) {
        const filters = [{ field: "name", operator: "contain", values: [trimmedSearch] }];
        const sort: Record<string, number> = { difficulty: 1 };
        const options: any = { filters, sort };
        if (problemFilters.topicId) options.topic_id = problemFilters.topicId;
        if (problemFilters.difficulty) options.difficulty = Number(problemFilters.difficulty);
        return { mode: "paged", data: await ProblemsApi.listPage(problemPage, problemLimit, options) };
      }

      const params: any = {
        page: problemPage,
        limit: problemLimit,
      };
      if (problemFilters.difficulty) {
        params.difficulty = Number(problemFilters.difficulty);
      }
      if (problemFilters.topicId) {
        params.topic_id = problemFilters.topicId;
      }
      return { mode: "paged", data: await ProblemsApi.list(problemPage, problemLimit, params) };
    },
    enabled: openAddProblem,
  });

  const derivedProblems = useMemo(() => {
    if (!problemsSource) {
      return { list: [] as Problem[], total: 0, currentPage: problemPage, perPage: problemLimit, serverPagination: false };
    }
    if (problemsSource.mode === "paged") {
      const payload = problemsSource.data?.data;
      return {
        list: payload?.result ?? [],
        total: payload?.total ?? 0,
        currentPage: payload?.page ?? problemPage,
        perPage: payload?.limit ?? problemLimit,
        serverPagination: true,
      };
    }
    return {
      list: problemsSource.data.list,
      total: problemsSource.data.total,
      currentPage: problemsSource.data.page,
      perPage: problemsSource.data.limit,
      serverPagination: true,
    };
  }, [problemsSource, problemFilters, searchProblem, problemPage, problemLimit]);

  const problemResults = derivedProblems.list;
  const problemTotal = derivedProblems.total;
  const currentProblemPage = derivedProblems.currentPage;
  const problemsPerPage = derivedProblems.perPage;
  const hasNextProblems = currentProblemPage * problemsPerPage < problemTotal;
  const totalProblemPages = Math.max(1, Math.ceil(problemTotal / Math.max(1, problemsPerPage)));

  const { mutate: addProblemsToContest, isPending: addingProblems } = useMutation({
    mutationFn: (problemIds: string[]) => ContestProblemsApi.addMultiple(id!, problemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
      setOpenAddProblem(false);
      setSelectedProblemIds([]);
    },
  });
  const { mutate: removeContestProblem } = useMutation({
    mutationFn: (contestProblemId: string) => ContestProblemsApi.remove(contestProblemId),
    onMutate: (contestProblemId: string) => {
      setRemovingProblemId(contestProblemId);
    },
    onSuccess: () => {
      toast.success("Đã xóa bài tập khỏi contest");
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
    },
    onError: () => {
      toast.error("Không thể xóa bài tập, vui lòng thử lại");
    },
    onSettled: () => {
      setRemovingProblemId(null);
    },
  });
  const { mutate: toggleContestProblemVisibility } = useMutation({
    mutationFn: ({ problemId, nextVisible }: { problemId: string; nextVisible: boolean }) =>
      ContestProblemsApi.updateVisibility(id!, problemId, nextVisible),
    onMutate: ({ problemId }) => {
      setVisibilityUpdatingId(problemId);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái hiển thị");
      queryClient.invalidateQueries({ queryKey: ["contest", id] });
    },
    onError: () => {
      toast.error("Không thể cập nhật hiển thị, vui lòng thử lại");
    },
    onSettled: () => {
      setVisibilityUpdatingId(null);
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
                                  <TableHead>Tên đăng nhập</TableHead>
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
                                <TableHead>Tên đăng nhập</TableHead>
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
                                <TableHead>Tên đăng nhập</TableHead>
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
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <Input
                        placeholder="Tìm kiếm bài tập..."
                        value={searchProblem}
                        onChange={(e)=> { setProblemPage(1); setSearchProblem(e.target.value); }}
                        className="md:flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTempProblemFilters(problemFilters);
                          setProblemFilterDialogOpen(true);
                        }}
                        className="md:w-auto"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Bộ lọc
                      </Button>
                    </div>
                    {hasProblemFilters && (
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {problemFilters.difficulty && (
                          <Badge variant="outline">Độ khó: {problemFilters.difficulty}</Badge>
                        )}
                        {problemFilters.topicId && (
                          <Badge variant="outline">
                            Chủ đề: {topics.find((t) => t._id === problemFilters.topicId)?.topic_name || problemFilters.topicId}
                          </Badge>
                        )}
                        {problemFilters.subTopicId && (
                          <Badge variant="outline">
                            Chủ đề con: {subTopics.find((s) => s._id === problemFilters.subTopicId)?.sub_topic_name || problemFilters.subTopicId}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => {
                            setProblemFilters({});
                            setTempProblemFilters({});
                            setProblemPage(1);
                          }}
                        >
                          Đặt lại
                        </Button>
                      </div>
                    )}
                    <div className="rounded border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px] min-w-[40px]"></TableHead>
                            <TableHead className="min-w-[200px]">Tên bài</TableHead>
                            <TableHead className="min-w-[150px]">Chủ đề</TableHead>
                            <TableHead className="min-w-[120px]">Chủ đề con</TableHead>
                            <TableHead className="w-[80px] min-w-[80px]">Độ khó</TableHead>
                            <TableHead className="w-[80px] min-w-[80px]">Số test</TableHead>
                            <TableHead className="text-right min-w-[120px]">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {problemResults.map((p) => (
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
                      <div className="text-sm text-muted-foreground">
                        Trang {problemTotal > 0 ? currentProblemPage : 1} / {totalProblemPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={problemPage<=1 || problemsLoading} onClick={()=> setProblemPage(p=> Math.max(1, p-1))}>Trước</Button>
                        <Button variant="outline" size="sm" disabled={problemsLoading || !hasNextProblems} onClick={()=> setProblemPage(p=> p+1)}>Sau</Button>
                        <Select value={String(problemLimit)} onValueChange={(v)=> { setProblemLimit(Number(v)); setProblemPage(1); }}>
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
                    <Button onClick={() => addProblemsToContest(selectedProblemIds)} disabled={selectedProblemIds.length === 0 || addingProblems}>
                      {addingProblems ? "Đang thêm..." : `Thêm bài đã chọn (${selectedProblemIds.length})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            <Dialog open={problemFilterDialogOpen} onOpenChange={(open) => {
              setProblemFilterDialogOpen(open);
              if (!open) {
                setTempProblemFilters(problemFilters);
              }
            }}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Lọc bài tập</DialogTitle>
                  <DialogDescription>Chọn tiêu chí để thu hẹp danh sách bài tập</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chủ đề</Label>
                    <Select
                      value={tempProblemFilters.topicId ?? "__all__"}
                      onValueChange={(value) => {
                        const nextTopicId = value === "__all__" ? undefined : value;
                        setTempProblemFilters((prev) => {
                          const selectedSubTopic = subTopics.find((st) => st._id === prev.subTopicId);
                          const shouldClearSubTopic =
                            !nextTopicId ||
                            (selectedSubTopic && selectedSubTopic.topic_id !== nextTopicId);
                          return {
                            ...prev,
                            topicId: nextTopicId,
                            subTopicId: shouldClearSubTopic ? undefined : prev.subTopicId,
                          };
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chủ đề" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Tất cả chủ đề</SelectItem>
                        {topics.map((topic) => (
                          <SelectItem key={topic._id} value={topic._id}>
                            {topic.topic_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chủ đề con</Label>
                    <Select
                      value={tempProblemFilters.subTopicId ?? "__all__"}
                      onValueChange={(value) =>
                        setTempProblemFilters((prev) => ({
                          ...prev,
                          subTopicId: value === "__all__" ? undefined : value,
                        }))
                      }
                      disabled={subTopics.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chủ đề con" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Tất cả chủ đề con</SelectItem>
                        {subTopics
                          .filter((st) => !tempProblemFilters.topicId || st.topic_id === tempProblemFilters.topicId)
                          .map((st) => (
                            <SelectItem key={st._id} value={st._id}>
                              {st.sub_topic_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Độ khó</Label>
                    <Select
                      value={tempProblemFilters.difficulty ?? "__all__"}
                      onValueChange={(value) =>
                        setTempProblemFilters((prev) => ({
                          ...prev,
                          difficulty: value === "__all__" ? undefined : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Tất cả độ khó</SelectItem>
                        <SelectItem value="1">1 - Dễ</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3 - Trung bình</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5 - Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTempProblemFilters({});
                      setProblemFilters({});
                      setProblemPage(1);
                      setProblemFilterDialogOpen(false);
                    }}
                  >
                    Đặt lại
                  </Button>
                  <div className="flex w-full justify-end gap-2 sm:w-auto">
                    <Button variant="secondary" onClick={() => setProblemFilterDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button
                      onClick={() => {
                        setProblemFilters(tempProblemFilters);
                        setProblemPage(1);
                        setProblemFilterDialogOpen(false);
                      }}
                    >
                      Áp dụng
                    </Button>
                  </div>
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
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Bộ nhớ</TableHead>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSubmissionStatusIcon(s.status)}
                            <Badge className={getSubmissionStatusBadge(s.status)}>
                              {submissionStatusText[s.status] || s.status}
                            </Badge>
                          </div>
                        </TableCell>
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
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contest.contest_problems?.map((cp) => (
                      <TableRow key={cp._id}>
                        <TableCell>{cp.problem?.name || "—"}</TableCell>
                        <TableCell>{cp.score}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!cp.is_visible}
                            disabled={!cp.problem_id || visibilityUpdatingId === cp.problem_id}
                            onCheckedChange={() =>
                              handleToggleProblemVisibility(cp.problem_id, cp.is_visible ?? true)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveContestProblem(cp._id, cp.problem?.name)}
                            disabled={!cp._id || removingProblemId === cp._id}
                          >
                            {removingProblemId === cp._id ? (
                              <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Đang xóa
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="mb-4 flex flex-wrap gap-2">
                {userStatusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={userStatusFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserStatusFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="rounded border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContestUsers.length > 0 ? (
                      filteredContestUsers.map((cu) => {
                        const statusMeta = getContestUserStatusMeta(cu.status);
                        const normalizedStatus = (cu.status ?? "").toLowerCase();
                        return (
                          <TableRow key={cu._id}>
                            <TableCell>
                              <div className="font-medium">{cu.user?.fullname || "—"}</div>
                              <div className="text-xs text-muted-foreground">@{cu.user?.username || "—"}</div>
                            </TableCell>
                            <TableCell>{cu.is_manager ? "Quản trị" : "Thí sinh"}</TableCell>
                            <TableCell>
                              <Badge className={`inline-flex items-center gap-1 ${statusMeta.badge}`}>
                                {statusMeta.icon}
                                <span>{statusMeta.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {normalizedStatus === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleApproveUser(cu._id, cu.user_id)}
                                      disabled={approvingUserId === cu.user_id}
                                    >
                                      {approvingUserId === cu.user_id ? (
                                        <>
                                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                                          Đang duyệt
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Duyệt
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRejectUser(cu._id, cu.user_id)}
                                      disabled={rejectingUserId === cu.user_id}
                                    >
                                      {rejectingUserId === cu.user_id ? (
                                        <>
                                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                                          Đang từ chối
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="mr-2 h-4 w-4" />
                                          Từ chối
                                        </>
                                      )}
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRemoveContestUser(cu._id, cu.user?.fullname)}
                                  disabled={removingContestUserId === cu._id}
                                >
                                  {removingContestUserId === cu._id ? (
                                    <>
                                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                                      Đang xóa
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Xóa
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          Không có người dùng phù hợp
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="ranking">
              <div className="rounded border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hạng</TableHead>
                      <TableHead>Đội/Học sinh</TableHead>
                      {headerProblems.map((p: any, idx: number) => (
                        <TableHead key={idx}>{String.fromCharCode(65 + idx)}</TableHead>
                      ))}
                      <TableHead>Điểm tổng</TableHead>
                      <TableHead>Số AC</TableHead>
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
                          const score = found?.score ?? 0;
                          const isDone = found?.is_done;
                          return (
                            <TableCell key={`${row.user._id}-${pid}-${idx}`}>
                              <div className="flex items-center gap-2">
                                {isDone === true ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : isDone === false ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : null}
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


