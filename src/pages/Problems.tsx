import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowUpDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProblemsApi } from "@/services/problems";
import type { Problem, ProblemListParams, ProblemListResponse, ProblemPageData } from "@/types/problem";
import { TopicsApi, type Topic } from "@/services/topics";
import { SubTopicsApi, type SubTopic } from "@/services/sub-topics";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestCasesApi, type TestCase } from "@/services/test-cases";

type ProblemFilterState = {
  topicId?: string;
  subTopicId?: string;
  difficulty?: string;
};

export default function Problems() {
  const [open, setOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [search, setSearch] = useState("");
  const [problemFilters, setProblemFilters] = useState<ProblemFilterState>({});
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [tempProblemFilters, setTempProblemFilters] = useState<ProblemFilterState>({});
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string | undefined>(undefined);
  const [rowEditId, setRowEditId] = useState<string | undefined>(undefined);
  const [rowTopicId, setRowTopicId] = useState<string | undefined>(undefined);
  const [rowSubTopicId, setRowSubTopicId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"details" | "testcases">("details");
  const [tcPage, setTcPage] = useState(1);
  const tcPageSize = 5;

  // Prefill topic/subtopic when opening edit dialog to ensure Select shows saved values
  React.useEffect(() => {
    if (open && editingProblem) {
      setSelectedTopicId(editingProblem.topic_id);
      setSelectedSubTopicId(editingProblem.sub_topic_id);
      setActiveTab("details");
      setTcPage(1);
    }
    if (!open && !editingProblem) {
      setSelectedTopicId(undefined);
      setSelectedSubTopicId(undefined);
      setActiveTab("details");
      setTcPage(1);
    }
  }, [open, editingProblem]);

  // Fetch latest problem detail when editing
  const { data: editingProblemDetail } = useQuery({
    queryKey: ["problem-detail", editingProblem?._id, open],
    queryFn: () => ProblemsApi.getById(editingProblem!._id),
    enabled: Boolean(editingProblem && open),
  });

  // Fetch test cases by problem when editing
  const { data: testCases = [], refetch: refetchTestCases, isLoading: loadingTestCases } = useQuery<TestCase[]>({
    queryKey: ["test-cases", editingProblem?._id, open],
    queryFn: () => TestCasesApi.byProblem(editingProblem!._id),
    enabled: Boolean(editingProblem && open),
  });

  const totalTc = testCases.length;
  const totalTcPages = Math.max(1, Math.ceil(totalTc / tcPageSize));
  const tcStart = (tcPage - 1) * tcPageSize;
  const tcEnd = tcStart + tcPageSize;
  const visibleTestCases = totalTc > tcPageSize ? testCases.slice(tcStart, tcEnd) : testCases;

  const addTestCaseMutation = useMutation({
    mutationFn: (dto: Partial<TestCase>) => TestCasesApi.create(dto as any),
    onSuccess: () => { refetchTestCases(); toast.success("Đã thêm test case"); },
  });
  const updateTestCaseMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<TestCase> }) => TestCasesApi.updateById(id, dto as any),
    onSuccess: () => { refetchTestCases(); toast.success("Đã cập nhật test case"); },
  });
  const deleteTestCaseMutation = useMutation({
    mutationFn: (id: string) => TestCasesApi.deleteById(id),
    onSuccess: () => {
      refetchTestCases();
      toast.success("Đã xóa test case");
    },
  });

  // auto-save on outside click removed to avoid premature saves
  const [sortKey, setSortKey] = useState<
    | "name"
    | "topic"
    | "subTopic"
    | "difficulty"
    | "tests"
    | undefined
  >(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const queryClient = useQueryClient();
type ProblemsQueryResult =
  | { mode: "paged"; data: ProblemListResponse }
  | { mode: "subTopicPaged"; data: ProblemPageData }
  | { mode: "subTopicList"; data: Problem[] };

  const usingSubTopicFilter = !!problemFilters.subTopicId;

  const problemsQueryKey = usingSubTopicFilter
    ? [
        "problems",
        "sub-topic",
        problemFilters.subTopicId,
        page,
        pageSize,
        search,
        problemFilters.topicId,
        problemFilters.difficulty,
        sortKey,
        sortDir,
      ]
    : [
        "problems",
        "list",
        page,
        pageSize,
        search,
        problemFilters.topicId,
        problemFilters.difficulty,
        sortKey,
        sortDir,
      ];

  const { data: problemsSource, isLoading, error } = useQuery<ProblemsQueryResult>({
    queryKey: problemsQueryKey,
    queryFn: async () => {
      if (problemFilters.subTopicId) {
        const params: Record<string, any> = {};
        if (problemFilters.topicId) params.topic_id = problemFilters.topicId;
        if (problemFilters.difficulty) params.difficulty = Number(problemFilters.difficulty);
        if (search.trim()) {
          params.filters = JSON.stringify([{ field: "name", operator: "CONTAIN", values: [search.trim()] }]);
        }
        if (sortKey) {
          let apiSortField: string = sortKey;
          if (sortKey === "topic") apiSortField = "topic.topic_name";
          if (sortKey === "subTopic") apiSortField = "sub_topic.sub_topic_name";
          if (sortKey === "tests") apiSortField = "number_of_tests";
          params.sort = apiSortField;
          params.order = sortDir;
        }
        const res = await ProblemsApi.listBySubTopic(problemFilters.subTopicId, page, pageSize, params);
        const payload = res.data;
        if (Array.isArray(payload)) {
          return { mode: "subTopicList", data: payload };
        }
        return { mode: "subTopicPaged", data: payload as ProblemPageData };
      }
      const params: any = {
        page,
        limit: pageSize,
      };
      if (problemFilters.topicId) params.topic_id = problemFilters.topicId;
      if (problemFilters.difficulty) params.difficulty = Number(problemFilters.difficulty);
      if (search.trim()) {
        params.filters = JSON.stringify([{ field: "name", operator: "CONTAIN", values: [search.trim()] }]);
      }
      if (sortKey) {
        let apiSortField: string = sortKey;
        if (sortKey === "topic") apiSortField = "topic.topic_name";
        if (sortKey === "subTopic") apiSortField = "sub_topic.sub_topic_name";
        if (sortKey === "tests") apiSortField = "number_of_tests";
        params.sort = apiSortField;
        params.order = sortDir;
      }
      return { mode: "paged", data: await ProblemsApi.list(page, pageSize, params) };
    },
  });
  const { data: topicsData } = useQuery({ queryKey: ["topics"], queryFn: () => TopicsApi.list() });
  const { data: subTopicsData } = useQuery({ queryKey: ["sub-topics"], queryFn: () => SubTopicsApi.list() });
  const derivedProblems = useMemo(() => {
    if (!problemsSource) {
      return { list: [] as Problem[], total: 0, perPage: pageSize, currentPage: page };
    }
    if (problemsSource.mode === "paged") {
      const payload = problemsSource.data?.data;
      return {
        list: payload?.result ?? [],
        total: payload?.total ?? 0,
        perPage: payload?.limit ?? pageSize,
        currentPage: payload?.page ?? page,
      };
    }
    if (problemsSource.mode === "subTopicPaged") {
      const payload = problemsSource.data;
      return {
        list: payload?.result ?? [],
        total: payload?.total ?? 0,
        perPage: payload?.limit ?? pageSize,
        currentPage: payload?.page ?? page,
      };
    }
    const rawList = problemsSource.data ?? [];
    const filtered = rawList.filter((problem) => {
      if (problemFilters.topicId && problem.topic_id !== problemFilters.topicId) return false;
      if (problemFilters.difficulty && String(problem.difficulty) !== problemFilters.difficulty) return false;
      if (search.trim() && !problem.name?.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
    const start = (page - 1) * pageSize;
    return {
      list: filtered.slice(start, start + pageSize),
      total: filtered.length,
      perPage: pageSize,
      currentPage: page,
    };
  }, [problemsSource, problemFilters, search, page, pageSize]);

  const problems = derivedProblems.list;
  const topics = useMemo(() => (Array.isArray(topicsData) ? topicsData : []), [topicsData]);
  const subTopics = useMemo(() => (Array.isArray(subTopicsData) ? subTopicsData : []), [subTopicsData]);
  const getTopicName = (topicId?: string, problem?: Problem) => {
    if (problem?.topic?.topic_name) return problem.topic.topic_name;
    return topics.find((t: Topic) => t._id === topicId)?.topic_name || "—";
  };
  const getSubTopicName = (subTopicId?: string, problem?: Problem) => {
    if (problem?.sub_topic?.sub_topic_name) return problem.sub_topic.sub_topic_name;
    return subTopics.find((st: SubTopic) => st._id === subTopicId)?.sub_topic_name || "—";
  };
  const [visibleCols, setVisibleCols] = useState({
    no: true,
    name: true,
    topic: true,
    subTopic: true,
    difficulty: true,
    tests: true,
    status: true,
    actions: true,
  });
  const [colWidth, setColWidth] = useState<Record<string, number>>({
    no: 56,
    name: 256,
    topic: 192,
    subTopic: 208,
    difficulty: 128,
    tests: 96,
    status: 128,
    actions: 112,
  });
  const initResize = (key: keyof typeof colWidth, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidth[key] || 120;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setColWidth((prev) => ({ ...prev, [key]: Math.max(80, startW + delta) }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  // Dữ liệu đã được lọc và sắp xếp từ server
  const paged = useMemo(() => Array.isArray(problems) ? problems : [], [problems]);
  const total = derivedProblems.total;
  const perPage = derivedProblems.perPage || pageSize;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startPage = useMemo(() => Math.floor((page - 1) / 10) * 10 + 1, [page]);
  const endPage = useMemo(() => Math.min(totalPages, startPage + 9), [totalPages, startPage]);

  const createMutation = useMutation({
    mutationFn: ProblemsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Problem> }) => ProblemsApi.updateById(id, dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProblemsApi.deleteById(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["problems"] }); },
  });

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-green-500";
    if (difficulty <= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dto = {
      topic_id: String(selectedTopicId || formData.get("topic_id") || ""),
      sub_topic_id: String(selectedSubTopicId || formData.get("sub_topic_id") || ""),
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      difficulty: Number(formData.get("difficulty") || 1),
      code_template: String(formData.get("code_template") || ""),
      time_limit_ms: Number(formData.get("time_limit_ms") || 0),
      memory_limit_mb: Number(formData.get("memory_limit_mb") || 0),
      is_public: Boolean(formData.get("is_public")),
      is_active: Boolean(formData.get("is_active")),
    } as Partial<Problem>;
    if (editingProblem) updateMutation.mutate({ id: editingProblem._id, dto }); else createMutation.mutate(dto as any);
    setOpen(false);
    setEditingProblem(null);
  };

  const handleDelete = (id: string) => { deleteMutation.mutate(id); };

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bài tập</h1>
          <p className="text-muted-foreground">Quản lý bài tập lập trình</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) return;
          if (editingProblem) {
            setSelectedTopicId(editingProblem.topic_id);
            setSelectedSubTopicId(editingProblem.sub_topic_id);
            setActiveTab("details");
            setTcPage(1);
          } else {
            setSelectedTopicId(undefined);
            setSelectedSubTopicId(undefined);
            setActiveTab("details");
            setTcPage(1);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProblem(null); setSelectedTopicId(undefined); setSelectedSubTopicId(undefined); }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm bài tập
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProblem ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}</DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Chi tiết</TabsTrigger>
                {editingProblem && <TabsTrigger value="testcases">Test Cases</TabsTrigger>}
              </TabsList>
              <TabsContent value="details">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="topic_id">Chủ đề</Label>
                      <Select name="topic_id" value={selectedTopicId} onValueChange={(v) => { setSelectedTopicId(v); setSelectedSubTopicId(undefined); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chủ đề" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map(topic => (
                            <SelectItem key={topic._id} value={topic._id}>
                              {topic.topic_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sub_topic_id">Chủ đề con</Label>
                      <Select name="sub_topic_id" value={selectedSubTopicId} onValueChange={(v) => setSelectedSubTopicId(v)} disabled={!selectedTopicId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chủ đề con" />
                        </SelectTrigger>
                        <SelectContent>
                          {subTopics
                            .filter((st) => st.topic_id === selectedTopicId)
                            .map((subTopic) => (
                            <SelectItem key={subTopic._id} value={subTopic._id}>
                              {subTopic.sub_topic_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name">Tên bài tập</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingProblemDetail?.name ?? editingProblem?.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingProblemDetail?.description ?? editingProblem?.description}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Độ khó (1-5)</Label>
                    <Input
                      id="difficulty"
                      name="difficulty"
                      type="number"
                      min="1"
                      max="5"
                      defaultValue={editingProblemDetail?.difficulty ?? editingProblem?.difficulty}
                    />
                  </div>
                  <div>
                    <Label htmlFor="code_template">Mẫu code</Label>
                    <Textarea
                      id="code_template"
                      name="code_template"
                      defaultValue={editingProblemDetail?.code_template ?? editingProblem?.code_template}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time_limit_ms">Giới hạn thời gian (ms)</Label>
                      <Input
                        id="time_limit_ms"
                        name="time_limit_ms"
                        type="number"
                        defaultValue={editingProblemDetail?.time_limit_ms ?? editingProblem?.time_limit_ms}
                      />
                    </div>
                    <div>
                      <Label htmlFor="memory_limit_mb">Giới hạn bộ nhớ (MB)</Label>
                      <Input
                        id="memory_limit_mb"
                        name="memory_limit_mb"
                        type="number"
                        defaultValue={editingProblemDetail?.memory_limit_mb ?? editingProblem?.memory_limit_mb}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch id="is_public" name="is_public" defaultChecked={editingProblemDetail?.is_public ?? editingProblem?.is_public} />
                      <Label htmlFor="is_public">Công khai</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="is_active" name="is_active" defaultChecked={editingProblemDetail?.is_active ?? editingProblem?.is_active} />
                      <Label htmlFor="is_active">Kích hoạt</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit">
                      {editingProblem ? "Cập nhật" : "Tạo mới"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              {editingProblem && (
                <TabsContent value="testcases">
                  <div className="space-y-4">
                    <div className="rounded border overflow-x-auto">
                      <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[64px]">#</TableHead>
                        <TableHead className="min-w-[280px]">Đầu vào</TableHead>
                        <TableHead className="min-w-[280px]">Đầu ra mong đợi</TableHead>
                        <TableHead className="w-[120px]">Công khai</TableHead>
                        <TableHead className="w-[120px]">Thứ tự</TableHead>
                        <TableHead className="text-right w-[180px]">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(visibleTestCases || []).map((tc, idx) => (
                        <TableRow key={tc._id}>
                          <TableCell>{tcStart + idx + 1}</TableCell>
                              <TableCell>
                                <Textarea defaultValue={tc.input_data} onChange={(e) => (tc as any)._input = e.target.value} className="font-mono text-xs" />
                              </TableCell>
                              <TableCell>
                                <Textarea defaultValue={tc.expected_output} onChange={(e) => (tc as any)._output = e.target.value} className="font-mono text-xs" />
                              </TableCell>
                              <TableCell>
                                <Switch defaultChecked={tc.is_public} onCheckedChange={(v) => (tc as any)._public = v} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" defaultValue={tc.order_index ?? idx + 1} onChange={(e) => (tc as any)._order = Number(e.target.value)} />
                              </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateTestCaseMutation.mutate({
                                    id: tc._id,
                                    dto: {
                                      input_data: (tc as any)._input ?? tc.input_data,
                                      expected_output: (tc as any)._output ?? tc.expected_output,
                                      is_public: (tc as any)._public ?? tc.is_public,
                                      order_index: (tc as any)._order ?? tc.order_index,
                                    },
                                  })
                                }
                              >
                                Lưu
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (window.confirm("Bạn có chắc chắn muốn xóa test case này?")) {
                                    deleteTestCaseMutation.mutate(tc._id);
                                  }
                                }}
                                disabled={deleteTestCaseMutation.isPending}
                              >
                                Xóa
                              </Button>
                            </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {loadingTestCases && (
                            <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">Đang tải test cases...</TableCell>
                            </TableRow>
                          )}
                          {!loadingTestCases && testCases.length === 0 && (
                            <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có test case</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {totalTc > tcPageSize && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>Trang {tcPage} / {totalTcPages}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={tcPage <= 1} onClick={() => setTcPage((p) => Math.max(1, p - 1))}>Trước</Button>
                          <Button variant="outline" size="sm" disabled={tcPage >= totalTcPages} onClick={() => setTcPage((p) => Math.min(totalTcPages, p + 1))}>Sau</Button>
                        </div>
                      </div>
                    )}
                    <div className="rounded border p-3 space-y-2">
                      <div className="font-medium">Thêm test case</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Đầu vào</Label>
                          <Textarea id="new_tc_input" className="font-mono text-xs" />
                        </div>
                        <div>
                          <Label>Đầu ra mong đợi</Label>
                          <Textarea id="new_tc_output" className="font-mono text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-2">
                          <Switch id="new_tc_public" />
                          <Label htmlFor="new_tc_public">Công khai</Label>
                        </div>
                        <div>
                          <Label>Thứ tự</Label>
                          <Input id="new_tc_order" type="number" defaultValue={testCases.length + 1} />
                        </div>
                        <div className="text-right">
                          <Button size="sm" onClick={() => {
                            const input = (document.getElementById("new_tc_input") as HTMLTextAreaElement)?.value || "";
                            const output = (document.getElementById("new_tc_output") as HTMLTextAreaElement)?.value || "";
                            const pub = (document.getElementById("new_tc_public") as HTMLInputElement)?.checked || false;
                            const order = Number((document.getElementById("new_tc_order") as HTMLInputElement)?.value || testCases.length + 1);
                            if (!input && !output) { toast.error("Vui lòng nhập input/output"); return; }
                            addTestCaseMutation.mutate({ problem_id: editingProblem!._id, input_data: input, expected_output: output, is_public: pub, order_index: order });
                          }}>Thêm</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <Input
          placeholder="Tìm kiếm bài tập"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="w-full md:flex-1 lg:w-[480px]"
        />
        <Button
          variant="outline"
          onClick={() => {
            setTempProblemFilters(problemFilters);
            setFilterDialogOpen(true);
          }}
          className="md:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          Bộ lọc
        </Button>
      </div>
      {(problemFilters.topicId || problemFilters.subTopicId || problemFilters.difficulty) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {problemFilters.topicId && (
            <Badge variant="outline">
              Chủ đề: {topics.find((t) => t._id === problemFilters.topicId)?.topic_name || problemFilters.topicId}
            </Badge>
          )}
          {problemFilters.subTopicId && (
            <Badge variant="outline">
              Chủ đề con: {subTopics.find((st) => st._id === problemFilters.subTopicId)?.sub_topic_name || problemFilters.subTopicId}
            </Badge>
          )}
          {problemFilters.difficulty && (
            <Badge variant="outline">Độ khó: {problemFilters.difficulty}</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => {
              setProblemFilters({});
              setTempProblemFilters({});
              setSearch("");
              setPage(1);
            }}
          >
            Xóa lọc
          </Button>
        </div>
      )}

        <Dialog
          open={filterDialogOpen}
          onOpenChange={(open) => {
            setFilterDialogOpen(open);
            if (!open) {
              setTempProblemFilters(problemFilters);
            }
          }}
        >
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
                        !nextTopicId || (selectedSubTopic && selectedSubTopic.topic_id !== nextTopicId);
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
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={() => setTempProblemFilters({})}>
                Xóa lựa chọn
              </Button>
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                <Button variant="secondary" onClick={() => setFilterDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    setProblemFilters(tempProblemFilters);
                    setPage(1);
                    setFilterDialogOpen(false);
                  }}
                >
                  Áp dụng
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {error ? (
        <div className="border rounded-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại hoặc sử dụng bộ lọc để giảm số lượng kết quả.
          </div>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["problems"] })}>
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                {visibleCols.no && (
                  <TableHead className="relative" style={{ width: colWidth.no }}>
                    <div className="flex items-center">No.</div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("no", e)} />
                  </TableHead>
                )}
              {visibleCols.name && (
              <TableHead className="relative" style={{ width: colWidth.name }}>
                <div className="flex items-center gap-2">
                  <span>Tên</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPage(1);
                      setSortKey("name");
                      setSortDir((d) => (sortKey === "name" && d === "asc" ? "desc" : "asc"));
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("name", e)} />
              </TableHead>
              )}
              {visibleCols.topic && (
              <TableHead className="relative" style={{ width: colWidth.topic }}>
                <div className="flex items-center gap-2">
                  <span>Chủ đề</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPage(1);
                      setSortKey("topic");
                      setSortDir((d) => (sortKey === "topic" && d === "asc" ? "desc" : "asc"));
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("topic", e)} />
              </TableHead>
              )}
              {visibleCols.subTopic && (
              <TableHead className="relative" style={{ width: colWidth.subTopic }}>
                <div className="flex items-center gap-2">
                  <span>Chủ đề con</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPage(1);
                      setSortKey("subTopic");
                      setSortDir((d) => (sortKey === "subTopic" && d === "asc" ? "desc" : "asc"));
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("subTopic", e)} />
              </TableHead>
              )}
              {visibleCols.difficulty && (
              <TableHead className="relative" style={{ width: colWidth.difficulty }}>
                <div className="flex items-center gap-2">
                  <span>Độ khó</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPage(1);
                      setSortKey("difficulty");
                      setSortDir((d) => (sortKey === "difficulty" && d === "asc" ? "desc" : "asc"));
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("difficulty", e)} />
              </TableHead>
              )}
              {visibleCols.tests && (
              <TableHead className="relative" style={{ width: colWidth.tests }}>
                <div className="flex items-center gap-2">
                  <span>Số test</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPage(1);
                      setSortKey("tests");
                      setSortDir((d) => (sortKey === "tests" && d === "asc" ? "desc" : "asc"));
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("tests", e)} />
              </TableHead>
              )}
              {visibleCols.status && (
              <TableHead className="relative" style={{ width: colWidth.status }}>Trạng thái<div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("status", e)} /></TableHead>
              )}
              {visibleCols.actions && (
              <TableHead className="relative text-right" style={{ width: colWidth.actions }}>Thao tác<div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("actions", e)} /></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((problem) => (
              <TableRow key={problem._id} data-row-id={problem._id}>
                {visibleCols.no && (<TableCell className="truncate" style={{ width: colWidth.no }}>{(page - 1) * pageSize + 1 + paged.indexOf(problem)}</TableCell>)}
                {visibleCols.name && (<TableCell className="font-medium truncate" style={{ width: colWidth.name }}>{problem.name}</TableCell>)}
                {visibleCols.topic && (
                  <TableCell className="truncate" style={{ width: colWidth.topic }}>
                    {rowEditId === problem._id ? (
                      <Select
                        value={rowTopicId ?? problem.topic_id}
                        onValueChange={(v) => {
                          setRowTopicId(v);
                          setRowSubTopicId(undefined);
                          updateMutation.mutate({ id: problem._id, dto: { topic_id: v, sub_topic_id: null } });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chủ đề" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((t) => (
                            <SelectItem key={t._id} value={t._id}>{t.topic_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <button className="underline underline-offset-2" onClick={() => { setRowEditId(problem._id); setRowTopicId(problem.topic_id); setRowSubTopicId(problem.sub_topic_id); }}>
                        {getTopicName(problem.topic_id, problem)}
                      </button>
                    )}
                  </TableCell>
                )}
                {visibleCols.subTopic && (
                  <TableCell className="truncate" style={{ width: colWidth.subTopic }}>
                    {rowEditId === problem._id ? (
                      <Select
                        value={rowSubTopicId ?? problem.sub_topic_id}
                        onValueChange={(v) => {
                          setRowSubTopicId(v);
                          updateMutation.mutate({ id: problem._id, dto: { sub_topic_id: v } });
                          setRowEditId(undefined);
                        }}
                        disabled={!(rowTopicId ?? problem.topic_id)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {subTopics
                            .filter((st) => st.topic_id === (rowTopicId ?? problem.topic_id))
                            .map((st) => (
                              <SelectItem key={st._id} value={st._id}>{st.sub_topic_name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <button className="underline underline-offset-2" onClick={() => { setRowEditId(problem._id); setRowTopicId(problem.topic_id); setRowSubTopicId(problem.sub_topic_id); }}>
                        {getSubTopicName(problem.sub_topic_id, problem)}
                      </button>
                    )}
                  </TableCell>
                )}
                {visibleCols.difficulty && (<TableCell className="truncate" style={{ width: colWidth.difficulty }}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getDifficultyColor(problem.difficulty)}`} />
                    <span>{problem.difficulty}/5</span>
                  </div>
                </TableCell>)}
                {visibleCols.tests && (<TableCell className="truncate" style={{ width: colWidth.tests }}>{problem.number_of_tests} tests</TableCell>)}
                {visibleCols.status && (<TableCell className="truncate" style={{ width: colWidth.status }}>
                  <div className="flex gap-1">
                    {problem.is_public && <Badge variant="outline">Public</Badge>}
                    {problem.is_active && <Badge>Active</Badge>}
                  </div>
                </TableCell>)}
                {visibleCols.actions && (<TableCell className="text-right truncate" style={{ width: colWidth.actions }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingProblem(problem);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(problem._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
      {!error && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
              </PaginationItem>
              {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                const p = startPage + i;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink href="#" isActive={page === p} onClick={(e) => { e.preventDefault(); setPage(p); }}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
