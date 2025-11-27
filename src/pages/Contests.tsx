import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import type {
  Contest,
  CreateContestDto,
  ContestManyItem,
  ContestCreateDto,
  ContestUser,
  ContestProblem,
} from "@/types/contest";
import type { Problem } from "@/types/problem";
import { mockProblems } from "@/lib/mockData";
import { Plus, Calendar, Loader2, Trash2, Copy } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContestsApi, ContestUsersApi, ContestProblemsApi } from "@/services/contests";
import { UsersApi } from "@/services/users";
import { ProblemsApi } from "@/services/problems";
import { toast } from "sonner";

const createEmptyContestForm = () => ({
  name: "",
  description: "",
  start_time: "",
  end_time: "",
  is_active: true,
  duration_minutes: 0,
  max_problems: 0,
  order_index: 0,
  type: "practice",
});

export default function Contests() {
  const navigate = useNavigate();

  // Mock contests state
  const [contests, setContests] = useState<Contest[]>([
    {
      _id: "contest_1",
      name: "PTIT Weekly #1",
      description: "Tuần 1 - Warm up",
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      is_public: true,
      problems: mockProblems.slice(0, 2).map(p => ({ _id: p._id, name: p.name })),
      participants: [
        { _id: "u_1", username: "student1", fullname: "Nguyen Van A" },
        { _id: "u_2", username: "student2", fullname: "Tran Thi B" },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardForm, setWizardForm] = useState(() => createEmptyContestForm());
  const [wizardContestId, setWizardContestId] = useState<string | null>(null);
  const [wizardContestName, setWizardContestName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const wizardUserPageSize = 10;
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [problemSearch, setProblemSearch] = useState("");
  const [debouncedProblemSearch, setDebouncedProblemSearch] = useState("");
  const [problemPage, setProblemPage] = useState(1);
  const wizardProblemPageSize = 10;
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [form, setForm] = useState(() => createEmptyContestForm());
  const wizardSteps = [
    { id: 1, label: "Thông tin contest" },
    { id: 2, label: "Người tham gia" },
    { id: 3, label: "Bài tập" },
  ] as const;
  const [deletingContestId, setDeletingContestId] = useState<string | null>(null);
  const [copyingContestId, setCopyingContestId] = useState<string | null>(null);
  const [wizardVisibilityUpdatingId, setWizardVisibilityUpdatingId] = useState<string | null>(null);
  const resetWizardState = () => {
    setWizardStep(1);
    setWizardContestId(null);
    setWizardContestName("");
    setWizardForm(createEmptyContestForm());
    setUserSearch("");
    setDebouncedUserSearch("");
    setUserPage(1);
    setSelectedUserIds([]);
    setProblemSearch("");
    setDebouncedProblemSearch("");
    setProblemPage(1);
    setSelectedProblems([]);
  };
  useEffect(() => {
    const debounce = setTimeout(() => setDebouncedUserSearch(userSearch), 350);
    return () => clearTimeout(debounce);
  }, [userSearch]);
  useEffect(() => {
    const debounce = setTimeout(() => setDebouncedProblemSearch(problemSearch), 350);
    return () => clearTimeout(debounce);
  }, [problemSearch]);
  useEffect(() => {
    if (!wizardOpen) {
      resetWizardState();
    }
  }, [wizardOpen]);

  const { mutate: createContest, isPending: creating } = useMutation({
    mutationFn: (payload: ContestCreateDto) => ContestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests", "many"] });
      setOpen(false);
      setForm(createEmptyContestForm());
    },
  });
  const { mutate: deleteContest } = useMutation({
    mutationFn: (contestId: string) => ContestsApi.delete(contestId),
    onMutate: (contestId: string) => {
      setDeletingContestId(contestId);
    },
    onSuccess: (_data, contestId) => {
      toast.success("Đã xóa contest");
      queryClient.invalidateQueries({ queryKey: ["contests", "many"] });
      if (wizardContestId === contestId) {
        resetWizardState();
        setWizardOpen(false);
      }
    },
    onError: () => {
      toast.error("Không thể xóa contest, vui lòng thử lại");
    },
    onSettled: () => {
      setDeletingContestId(null);
    },
  });
  const {
    mutateAsync: createWizardContest,
    isPending: creatingWizardContest,
  } = useMutation({
    mutationFn: (payload: ContestCreateDto) => ContestsApi.create(payload),
  });
  const {
    mutateAsync: updateWizardContest,
    isPending: updatingWizardContest,
  } = useMutation({
    mutationFn: (payload: Partial<ContestCreateDto>) => ContestsApi.update(wizardContestId!, payload),
  });
  const extractContestId = (input: any): string | null => {
    if (!input) return null;
    if (typeof input === "string") return input;
    if (input._id) return input._id;
    if (input.id) return input.id;
    if (typeof input.data === "string") return input.data;
    if (input.data && typeof input.data === "object") {
      return extractContestId(input.data);
    }
    return null;
  };
  const {
    mutateAsync: copyContest,
  } = useMutation({
    mutationFn: async (contestId: string) => {
      const detailRes = await ContestsApi.getById(contestId);
      const contestData = detailRes?.data;
      if (!contestData) {
        throw new Error("Không tìm thấy dữ liệu contest để copy");
      }
      const baseName = contestData.contest_name || "Contest";
      const copyName = `${baseName} (Copy)`;
      const copyPayload: ContestCreateDto = {
        contest_name: copyName,
        description: contestData.description ?? "",
        start_time: contestData.start_time ?? new Date().toISOString(),
        end_time: contestData.end_time ?? new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        created_time: new Date().toISOString(),
        is_active: contestData.is_active ?? true,
        duration_minutes: contestData.duration_minutes ?? 0,
        max_problems: contestData.max_problems ?? 0,
        order_index: contestData.order_index ?? 0,
        type: contestData.type ?? "practice",
      };
      const createRes = await ContestsApi.create(copyPayload);
      const newContestId = extractContestId(createRes) ?? extractContestId((createRes as any)?.data);
      if (!newContestId) {
        throw new Error("Không xác định được contest mới");
      }
      const userIds = (contestData.contest_users ?? [])
        .map((u: ContestUser) => u.user_id)
        .filter(Boolean);
      if (userIds.length > 0) {
        await ContestUsersApi.addMultiple(newContestId, userIds);
      }
      const problemIds =
        contestData.contest_problems?.map((p: ContestProblem) => p.problem_id).filter(Boolean) ?? [];
      if (problemIds.length > 0) {
        await ContestProblemsApi.addMultiple(newContestId, problemIds as string[]);
      }
      return { newContestId, copyName };
    },
    onMutate: (contestId: string) => {
      setCopyingContestId(contestId);
    },
    onSuccess: (result) => {
      toast.success(`Đã nhân bản contest thành "${result?.copyName ?? "Contest mới"}"`);
      queryClient.invalidateQueries({ queryKey: ["contests", "many"] });
    },
    onError: () => {
      toast.error("Không thể copy contest, vui lòng thử lại");
    },
    onSettled: () => {
      setCopyingContestId(null);
    },
  });

  const isDateInPast = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() < Date.now();
  };
  const formToContestPayload = (values: ReturnType<typeof createEmptyContestForm>): ContestCreateDto => ({
    contest_name: values.name?.trim() || "Contest mới",
    description: values.description || "",
    start_time: values.start_time ? new Date(values.start_time).toISOString() : new Date().toISOString(),
    end_time: values.end_time ? new Date(values.end_time).toISOString() : new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    created_time: new Date().toISOString(),
    is_active: !!values.is_active,
    duration_minutes: Number(values.duration_minutes) || 0,
    max_problems: Number(values.max_problems) || 0,
    order_index: Number(values.order_index) || 0,
    type: values.type || "practice",
  });

  const handleCreate = () => {
    if (isDateInPast(form.start_time)) {
      toast.error("Thời gian bắt đầu không được ở quá khứ");
      return;
    }
    if (isDateInPast(form.end_time)) {
      toast.error("Thời gian kết thúc không được ở quá khứ");
      return;
    }
    const payload = formToContestPayload(form);
    createContest(payload);
  };
  const handleDeleteContest = (contestId: string, contestName?: string) => {
    if (deletingContestId && deletingContestId !== contestId) {
      toast.message("Đang xử lý xóa contest khác, vui lòng chờ");
      return;
    }
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa contest "${contestName ?? ""}"? Hành động này không thể hoàn tác.`,
    );
    if (!confirmed) return;
    deleteContest(contestId);
  };
  const handleCopyContest = async (contestId: string) => {
    if (copyingContestId && copyingContestId !== contestId) {
      toast.message("Đang nhân bản contest khác, vui lòng chờ");
      return;
    }
    await copyContest(contestId);
  };
  const handleWizardContestSubmit = async () => {
    const payload = formToContestPayload(wizardForm);
    try {
      if (!wizardContestId) {
        if (isDateInPast(wizardForm.start_time)) {
          toast.error("Thời gian bắt đầu không được ở quá khứ");
          return;
        }
        if (isDateInPast(wizardForm.end_time)) {
          toast.error("Thời gian kết thúc không được ở quá khứ");
          return;
        }
      }
      if (wizardContestId) {
        const { created_time, ...updatePayload } = payload;
        await updateWizardContest(updatePayload);
        toast.success("Đã cập nhật thông tin contest");
      } else {
        const res = await createWizardContest(payload);
        const newContestId =
          (res as any)?.data?._id ||
          (res as any)?.data?.data?._id ||
          (res as any)?._id;
        if (!newContestId) {
          toast.error("Không thể xác định contest vừa tạo");
          return;
        }
        setWizardContestId(String(newContestId));
        setWizardContestName(payload.contest_name);
        toast.success("Đã tạo contest, chuyển sang bước thêm người dùng");
      }
      queryClient.invalidateQueries({ queryKey: ["contests", "many"] });
      setWizardStep(2);
    } catch (error) {
      toast.error("Không thể lưu contest, vui lòng thử lại");
    }
  };
  const toggleWizardUser = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };
  const handleWizardAddUsers = () => {
    if (!wizardContestId) {
      toast.error("Vui lòng hoàn thành bước 1 trước");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.message("Chọn ít nhất một người dùng để thêm");
      return;
    }
    addWizardUsers(selectedUserIds);
  };
  const handleWizardRemoveUser = (userId: string) => {
    if (!wizardContestId) return;
    removeWizardUser(userId);
  };
  const handleWizardClearUsers = () => {
    if (!wizardContestId || wizardContestUsers.length === 0) return;
    if (window.confirm("Xóa toàn bộ người dùng hiện tại?")) {
      clearWizardUsers();
    }
  };
  const toggleWizardProblem = (problem: Problem) => {
    setSelectedProblems((prev) => {
      if (prev.includes(problem._id)) {
        return prev.filter((id) => id !== problem._id);
      }
      return [...prev, problem._id];
    });
  };
  const handleWizardAddProblems = () => {
    if (!wizardContestId) {
      toast.error("Vui lòng hoàn thành bước 1 trước");
      return;
    }
    if (selectedProblems.length === 0) {
      toast.message("Chọn ít nhất một bài tập để thêm");
      return;
    }
    addWizardProblems(selectedProblems);
  };
  const handleWizardRemoveProblem = (contestProblemId: string, problemName?: string) => {
    if (!contestProblemId) return;
    const confirmed = window.confirm(`Xóa bài "${problemName ?? ""}" khỏi contest?`);
    if (!confirmed) return;
    removeWizardProblem(contestProblemId);
  };
  const handleWizardToggleVisibility = (problemId?: string, currentVisible?: boolean) => {
    if (!problemId || typeof currentVisible !== "boolean" || !wizardContestId) return;
    toggleWizardProblemVisibility({ problemId, nextVisible: !currentVisible });
  };
  const handleWizardClearProblems = () => {
    if (!wizardContestId || wizardContestProblems.length === 0) return;
    if (window.confirm("Xóa toàn bộ bài tập của contest?")) {
      clearWizardProblems();
    }
  };
  const handleWizardFinish = () => {
    if (!wizardContestId) {
      toast.error("Chưa có contest để hoàn tất");
      return;
    }
    toast.success("Đã hoàn tất thiết lập contest");
    setWizardOpen(false);
  };
  const handleWizardNavigateDetail = () => {
    if (!wizardContestId) return;
    setWizardOpen(false);
    navigate(`/contests/${wizardContestId}`);
  };

  // Fetch contests from API
  const { data: contestsApi, isLoading } = useQuery({
    queryKey: ["contests", "many"],
    queryFn: () => ContestsApi.listMany(),
  });
  const {
    data: wizardContestDetail,
    refetch: refetchWizardContest,
    isFetching: wizardContestLoading,
  } = useQuery({
    queryKey: ["contest", wizardContestId, "wizard"],
    queryFn: () => ContestsApi.getById(wizardContestId!),
    enabled: wizardOpen && !!wizardContestId,
  });
  const wizardContestUsers: ContestUser[] = wizardContestDetail?.data?.contest_users ?? [];
  const wizardContestProblems: ContestProblem[] = wizardContestDetail?.data?.contest_problems ?? [];
  const { data: wizardUsersData, isFetching: wizardUsersLoading } = useQuery({
    queryKey: ["wizard-user-search", debouncedUserSearch, userPage, wizardOpen, wizardStep],
    queryFn: async () => {
      if (debouncedUserSearch.trim()) {
        return UsersApi.searchByUsernamePage(debouncedUserSearch.trim(), userPage, wizardUserPageSize, {
          sort: "username:asc",
        });
      }
      const res = await UsersApi.list(userPage, wizardUserPageSize, { sort: "username", order: "asc" });
      return res.data;
    },
    enabled: wizardOpen && wizardStep === 2,
    placeholderData: (prev) => prev,
  });
  const wizardUserResult = wizardUsersData?.result ?? [];
  const wizardUserTotal = wizardUsersData?.total ?? 0;
  const { data: wizardProblemsData, isFetching: wizardProblemsLoading } = useQuery({
    queryKey: ["wizard-problem-search", debouncedProblemSearch, problemPage, wizardOpen, wizardStep],
    queryFn: async () => {
      const opts: {
        filters?: Array<{ field: string; operator: string; values: any[] }>;
        sort?: Record<string, number>;
      } = {};
      if (debouncedProblemSearch.trim()) {
        opts.filters = [{ field: "name", operator: "contain", values: [debouncedProblemSearch.trim()] }];
      }
      opts.sort = { difficulty: 1 };
      const res = await ProblemsApi.listPage(problemPage, wizardProblemPageSize, opts);
      return res.data;
    },
    enabled: wizardOpen && wizardStep === 3,
    placeholderData: (prev) => prev,
  });
  const wizardProblemResult = wizardProblemsData?.result ?? [];
  const wizardProblemTotal = wizardProblemsData?.total ?? 0;
  useEffect(() => {
    if (wizardContestDetail?.data?.contest_name) {
      setWizardContestName(wizardContestDetail.data.contest_name);
    }
  }, [wizardContestDetail]);
  const {
    mutate: addWizardUsers,
    isPending: addingWizardUsers,
  } = useMutation({
    mutationFn: (userIds: string[]) => ContestUsersApi.addMultiple(wizardContestId!, userIds),
    onSuccess: () => {
      toast.success("Đã thêm người dùng vào contest");
      setSelectedUserIds([]);
      refetchWizardContest();
      queryClient.invalidateQueries({ queryKey: ["contest", wizardContestId] });
    },
  });
  const {
    mutate: removeWizardUser,
    isPending: removingWizardUser,
  } = useMutation({
    mutationFn: (userId: string) => ContestUsersApi.remove(wizardContestId!, userId),
    onSuccess: () => {
      toast.success("Đã xóa người dùng khỏi contest");
      refetchWizardContest();
    },
  });
  const {
    mutate: clearWizardUsers,
    isPending: clearingWizardUsers,
  } = useMutation({
    mutationFn: () => ContestUsersApi.clear(wizardContestId!),
    onSuccess: () => {
      toast.success("Đã xóa toàn bộ người dùng của contest");
      refetchWizardContest();
    },
  });
  const {
    mutate: addWizardProblems,
    isPending: addingWizardProblems,
  } = useMutation({
    mutationFn: (problemIds: string[]) => ContestProblemsApi.addMultiple(wizardContestId!, problemIds),
    onSuccess: () => {
      toast.success("Đã thêm bài tập");
      setSelectedProblems([]);
      refetchWizardContest();
    },
  });
  const {
    mutate: removeWizardProblem,
    isPending: removingWizardProblem,
  } = useMutation({
    mutationFn: (contestProblemId: string) => ContestProblemsApi.remove(contestProblemId),
    onSuccess: () => {
      toast.success("Đã xóa bài tập");
      refetchWizardContest();
    },
  });
  const { mutate: toggleWizardProblemVisibility } = useMutation({
    mutationFn: ({ problemId, nextVisible }: { problemId: string; nextVisible: boolean }) =>
      ContestProblemsApi.updateVisibility(wizardContestId!, problemId, nextVisible),
    onMutate: ({ problemId }) => {
      setWizardVisibilityUpdatingId(problemId);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái hiển thị");
      refetchWizardContest();
    },
    onError: () => {
      toast.error("Không thể cập nhật hiển thị");
    },
    onSettled: () => {
      setWizardVisibilityUpdatingId(null);
    },
  });
  const {
    mutate: clearWizardProblems,
    isPending: clearingWizardProblems,
  } = useMutation({
    mutationFn: () => ContestProblemsApi.clear(wizardContestId!),
    onSuccess: () => {
      toast.success("Đã xóa toàn bộ bài tập của contest");
      refetchWizardContest();
    },
  });

  const apiContests = (contestsApi?.data || []) as ContestManyItem[];
  const visibleContests = useMemo(() => apiContests, [apiContests]);
  const wizardUsersHasNext = userPage * wizardUserPageSize < wizardUserTotal;
  const wizardUsersHasPrev = userPage > 1;
  const wizardProblemsHasNext = problemPage * wizardProblemPageSize < wizardProblemTotal;
  const wizardProblemsHasPrev = problemPage > 1;
  const wizardContestTitle = wizardContestName || wizardForm.name || "Contest mới";
  const isSavingContestInfo = creatingWizardContest || updatingWizardContest;
  const difficultyLabel = (value?: number) => {
    switch (value) {
      case 1:
        return "Dễ";
      case 2:
        return "Trung bình";
      case 3:
        return "Khó";
      case 4:
        return "Rất khó";
      default:
        return "Không rõ";
    }
  };
  const renderWizardStepIndicator = () => (
    <div className="mb-6 space-y-2">
      <p className="text-sm text-muted-foreground">Bước {wizardStep} / {wizardSteps.length}</p>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {wizardSteps.map((step, index) => {
            const isDone = wizardStep > step.id;
            const isActive = wizardStep === step.id;
            const circleClass = isDone
              ? "bg-green-500 text-white border-green-500"
              : isActive
                ? "bg-primary text-white border-primary"
                : "bg-background text-muted-foreground border-border";
            const lineClass = wizardStep > step.id ? "bg-primary" : "bg-border";
            return (
              <div key={step.id} className="flex items-center w-full">
                <div className="flex flex-col items-center flex-shrink-0 min-w-[70px]">
                  <div className={`h-9 w-9 rounded-full border flex items-center justify-center text-sm font-semibold transition-colors ${circleClass}`}>
                    {step.id}
                  </div>
                  <span className={`mt-2 text-xs text-center ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
                {index < wizardSteps.length - 1 && <div className={`h-px flex-1 mx-3 rounded-full ${lineClass}`} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  const renderWizardStepContent = () => {
    if (wizardStep === 1) {
      return (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Nhập thông tin cơ bản cho contest trước khi thêm thí sinh và bài tập.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 inline-block">Tên contest</Label>
                <Input value={wizardForm.name} onChange={(e) => setWizardForm({ ...wizardForm, name: e.target.value })} placeholder="Ví dụ: Kỳ thi giữa kỳ" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 inline-block">Loại contest</Label>
                <Select value={wizardForm.type} onValueChange={(value) => setWizardForm({ ...wizardForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">Thực hành</SelectItem>
                    <SelectItem value="exam">Bài tập</SelectItem>
                    <SelectItem value="test">Kiểm tra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 inline-block">Mô tả</Label>
              <Input value={wizardForm.description} onChange={(e) => setWizardForm({ ...wizardForm, description: e.target.value })} placeholder="Giới thiệu ngắn gọn" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 inline-block">Bắt đầu</Label>
                <Input type="datetime-local" value={wizardForm.start_time} onChange={(e) => setWizardForm({ ...wizardForm, start_time: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 inline-block">Kết thúc</Label>
                <Input type="datetime-local" value={wizardForm.end_time} onChange={(e) => setWizardForm({ ...wizardForm, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 inline-block">Thời lượng (phút)</Label>
                <Input
                  type="number"
                  min={0}
                  value={wizardForm.duration_minutes}
                  onChange={(e) =>
                    setWizardForm({
                      ...wizardForm,
                      duration_minutes: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 inline-block">Số bài tối đa</Label>
                <Input
                  type="number"
                  min={0}
                  value={wizardForm.max_problems}
                  onChange={(e) =>
                    setWizardForm({
                      ...wizardForm,
                      max_problems: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 inline-block">Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  min={0}
                  value={wizardForm.order_index}
                  onChange={(e) =>
                    setWizardForm({
                      ...wizardForm,
                      order_index: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="font-medium">Kích hoạt contest</p>
                <p className="text-sm text-muted-foreground">Cho phép contest xuất hiện trong danh sách</p>
              </div>
              <Switch checked={!!wizardForm.is_active} onCheckedChange={(value) => setWizardForm({ ...wizardForm, is_active: value })} />
            </div>
          </div>
        </div>
      );
    }
    if (wizardStep === 2) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Thêm người dùng vào contest</h3>
              <p className="text-sm text-muted-foreground">Tìm kiếm thành viên theo username hoặc chọn từ danh sách gợi ý.</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Contest: <span className="font-semibold text-foreground">{wizardContestTitle}</span>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Input placeholder="Nhập username..." value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} />
              <div className="border rounded-lg h-[320px] overflow-y-auto divide-y">
                {wizardUsersLoading ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tải danh sách người dùng...
                  </div>
                ) : wizardUserResult.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Không có người dùng phù hợp
                  </div>
                ) : (
                  wizardUserResult.map((user: any) => {
                    const userId = user._id || user.user_id || user.id;
                    return (
                      <label key={userId} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer">
                        <Checkbox checked={selectedUserIds.includes(userId)} onCheckedChange={() => toggleWizardUser(userId)} />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{user.fullname || user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.username}</p>
                        </div>
                        <Badge variant="outline">{user.systemRole || "User"}</Badge>
                      </label>
                    );
                  })
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Đã chọn {selectedUserIds.length} người dùng</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={!wizardUsersHasPrev} onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}>
                    Trang trước
                  </Button>
                  <Button variant="outline" size="sm" disabled={!wizardUsersHasNext} onClick={() => setUserPage((prev) => prev + 1)}>
                    Trang sau
                  </Button>
                </div>
              </div>
              <Button onClick={handleWizardAddUsers} disabled={!selectedUserIds.length || addingWizardUsers}>
                {addingWizardUsers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm vào contest
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Người tham gia hiện tại ({wizardContestUsers.length})</h3>
                  <p className="text-sm text-muted-foreground">Các user đã gắn với contest này.</p>
                </div>
                <Button variant="destructive" size="sm" disabled={!wizardContestUsers.length || clearingWizardUsers} onClick={handleWizardClearUsers}>
                  {clearingWizardUsers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xóa toàn bộ
                </Button>
              </div>
              <div className="border rounded-lg h-[320px] overflow-y-auto divide-y">
                {wizardContestLoading ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tải người tham gia...
                  </div>
                ) : wizardContestUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-4">
                    Chưa có người dùng nào trong contest này.
                  </div>
                ) : (
                  wizardContestUsers.map((contestUser) => (
                    <div key={contestUser._id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">{contestUser.user?.fullname || contestUser.user?.username}</p>
                        <p className="text-xs text-muted-foreground">{contestUser.user?.username}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleWizardRemoveUser(contestUser.user_id)} disabled={removingWizardUser}>
                        Xóa
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Thêm bài tập vào contest</h3>
            <p className="text-sm text-muted-foreground">Tìm kiếm bài tập theo tên và thiết lập điểm số/độ ưu tiên.</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Contest: <span className="font-semibold text-foreground">{wizardContestTitle}</span>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Input placeholder="Tìm kiếm bài tập..." value={problemSearch} onChange={(e) => { setProblemSearch(e.target.value); setProblemPage(1); }} />
            <div className="border rounded-lg h-[300px] overflow-y-auto divide-y">
              {wizardProblemsLoading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải danh sách bài tập...
                </div>
              ) : wizardProblemResult.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Không tìm thấy bài tập
                </div>
              ) : (
                wizardProblemResult.map((problem) => (
                  <label key={problem._id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer">
                    <Checkbox checked={selectedProblems.includes(problem._id)} onCheckedChange={() => toggleWizardProblem(problem)} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{problem.name}</p>
                      <p className="text-xs text-muted-foreground">Độ khó: {difficultyLabel(problem.difficulty)}</p>
                    </div>
                    <Badge variant="outline">#{problem._id?.slice(-4)}</Badge>
                  </label>
                ))
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Đã chọn {selectedProblems.length} bài tập</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!wizardProblemsHasPrev} onClick={() => setProblemPage((prev) => Math.max(1, prev - 1))}>
                  Trang trước
                </Button>
                <Button variant="outline" size="sm" disabled={!wizardProblemsHasNext} onClick={() => setProblemPage((prev) => prev + 1)}>
                  Trang sau
                </Button>
              </div>
            </div>
            <Button onClick={handleWizardAddProblems} disabled={!selectedProblems.length || addingWizardProblems}>
              {addingWizardProblems && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Thêm bài tập đã chọn
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Bài tập trong contest ({wizardContestProblems.length})</h3>
                <p className="text-sm text-muted-foreground">Quản lý danh sách bài tập đã thêm.</p>
              </div>
              <Button variant="destructive" size="sm" disabled={!wizardContestProblems.length || clearingWizardProblems} onClick={handleWizardClearProblems}>
                {clearingWizardProblems && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xóa toàn bộ
              </Button>
            </div>
            <div className="border rounded-lg h-[320px] overflow-y-auto divide-y">
              {wizardContestLoading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải bài tập...
                </div>
              ) : wizardContestProblems.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-4">
                  Chưa có bài tập nào được thêm.
                </div>
              ) : (
                wizardContestProblems.map((contestProblem) => (
                  <div key={contestProblem._id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{contestProblem.problem?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Điểm {contestProblem.score} • Thứ tự {contestProblem.order_index}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Hiển thị</span>
                        <Switch
                          checked={!!contestProblem.is_visible}
                          disabled={!contestProblem.problem_id || wizardVisibilityUpdatingId === contestProblem.problem_id}
                          onCheckedChange={() =>
                            handleWizardToggleVisibility(contestProblem.problem_id, contestProblem.is_visible ?? true)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWizardRemoveProblem(contestProblem._id, contestProblem.problem?.name)}
                        disabled={removingWizardProblem}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderWizardFooter = () => {
    if (wizardStep === 1) {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => setWizardOpen(false)}>Hủy</Button>
          <Button onClick={handleWizardContestSubmit} disabled={isSavingContestInfo}>
            {isSavingContestInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu &amp; tiếp tục
          </Button>
        </div>
      );
    }
    if (wizardStep === 2) {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => setWizardStep(1)}>Quay lại bước 1</Button>
          <Button onClick={() => setWizardStep(3)} disabled={!wizardContestId}>
            Tiếp tục đến bước 3
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWizardStep(2)}>Quay lại bước 2</Button>
          <Button variant="ghost" onClick={handleWizardNavigateDetail} disabled={!wizardContestId}>
            Xem chi tiết contest
          </Button>
        </div>
        <Button onClick={handleWizardFinish} disabled={!wizardContestId}>
          Hoàn tất thiết lập
        </Button>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contests</h1>
          <p className="text-muted-foreground">Quản lý kỳ thi/contest</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm contest
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Thêm contest</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Tên</Label>
                  <Input className="col-span-3" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Mô tả</Label>
                  <Input className="col-span-3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Bắt đầu</Label>
                  <Input type="datetime-local" className="col-span-3" value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Kết thúc</Label>
                  <Input type="datetime-local" className="col-span-3" value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Thời lượng (phút)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="col-span-3"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Số bài tối đa</Label>
                  <Input
                    type="number"
                    min={0}
                    className="col-span-3"
                    value={form.max_problems}
                    onChange={(e) => setForm({ ...form, max_problems: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Thứ tự</Label>
                  <Input
                    type="number"
                    min={0}
                    className="col-span-3"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Loại</Label>
                  <div className="col-span-3">
                    <Select value={form.type} onValueChange={(v)=> setForm({ ...form, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practice">Thực hành</SelectItem>
                        <SelectItem value="exam">Bài tập</SelectItem>
                        <SelectItem value="test">Kiểm tra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Kích hoạt</Label>
                  <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
                <Button onClick={handleCreate}>Tạo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                Quy trình tạo contest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-full">
              <DialogHeader>
                <DialogTitle>Thiết lập contest nhiều bước</DialogTitle>
              </DialogHeader>
              {renderWizardStepIndicator()}
              <div className="space-y-6">
                {renderWizardStepContent()}
              </div>
              <div className="pt-4 border-t mt-4">
                {renderWizardFooter()}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Contest</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleContests.map((c) => {
                const contestName = "contest_name" in c ? c.contest_name : (c as any).name;
                const endTime = c.end_time ? new Date(c.end_time) : null;
                const hasEnded = endTime ? endTime.getTime() < Date.now() : false;
                return (
                  <TableRow key={c._id}>
                  <TableCell className="font-medium">{contestName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(c.start_time || "").toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(c.end_time || "").toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasEnded ? (
                      <Badge variant="destructive">Đã kết thúc</Badge>
                    ) : "is_active" in c ? (
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Đang mở" : "Tạm dừng"}
                      </Badge>
                    ) : (
                      <Badge variant={(c as any).is_public ? "default" : "secondary"}>
                        {(c as any).is_public ? "Công khai" : "Riêng tư"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/contests/${c._id}`)}>
                        Xem chi tiết
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopyContest(c._id)}
                        disabled={copyingContestId === c._id}
                      >
                        {copyingContestId === c._id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang copy
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteContest(c._id, contestName)}
                        disabled={deletingContestId === c._id}
                      >
                        {deletingContestId === c._id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


