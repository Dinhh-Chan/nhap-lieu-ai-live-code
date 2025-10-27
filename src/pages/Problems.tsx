import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
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
import type { Problem, ProblemListParams } from "@/types/problem";
import { TopicsApi, type Topic } from "@/services/topics";
import { SubTopicsApi, type SubTopic } from "@/services/sub-topics";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Problems() {
  const [open, setOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | undefined>(undefined);
  const [subTopicFilter, setSubTopicFilter] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(undefined);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string | undefined>(undefined);
  const [rowEditId, setRowEditId] = useState<string | undefined>(undefined);
  const [rowTopicId, setRowTopicId] = useState<string | undefined>(undefined);
  const [rowSubTopicId, setRowSubTopicId] = useState<string | undefined>(undefined);

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
  const { data: problemsData, isLoading, error } = useQuery({ 
    queryKey: ["problems", page, pageSize, search, topicFilter, subTopicFilter, difficultyFilter, sortKey, sortDir], 
    queryFn: () => {
      const params: ProblemListParams = {
        page,
        limit: pageSize
      };
      
      if (search) params.search = search;
      if (topicFilter) params.topic_id = topicFilter;
      if (subTopicFilter) params.sub_topic_id = subTopicFilter;
      if (difficultyFilter) params.difficulty = Number(difficultyFilter);
      if (sortKey) {
        // Chuyển đổi sortKey từ UI sang tên trường trong API
        let apiSortField: string = sortKey;
        if (sortKey === "topic") apiSortField = "topic.topic_name";
        if (sortKey === "subTopic") apiSortField = "sub_topic.sub_topic_name";
        if (sortKey === "tests") apiSortField = "number_of_tests";
        
        params.sort = apiSortField;
        params.order = sortDir;
      }
      
      return ProblemsApi.list(page, pageSize, params);
    }
  });
  const { data: topicsData } = useQuery({ queryKey: ["topics"], queryFn: () => TopicsApi.list() });
  const { data: subTopicsData } = useQuery({ queryKey: ["sub-topics"], queryFn: () => SubTopicsApi.list() });
  const problems = useMemo(() => (problemsData?.data?.result ? problemsData.data.result : []), [problemsData]);
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
  const total = problemsData?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Problems</h1>
          <p className="text-muted-foreground">Manage coding problems</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={topicFilter} onValueChange={(v) => { setPage(1); setTopicFilter(v); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by Topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.topic_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subTopicFilter} onValueChange={(v) => { setPage(1); setSubTopicFilter(v); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by SubTopic" />
            </SelectTrigger>
            <SelectContent>
              {subTopics.map((st) => (
                <SelectItem key={st._id} value={st._id}>{st.sub_topic_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={(v) => { setPage(1); setDifficultyFilter(v); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <SelectItem key={i+1} value={String(i + 1)}>{i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search problem"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-64"
          />
          <Button variant="outline" onClick={() => { setSearch(""); setTopicFilter(undefined); setSubTopicFilter(undefined); setDifficultyFilter(undefined); setPage(1); }}>
            Reset
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.keys(visibleCols).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={(visibleCols as any)[key]}
                  onCheckedChange={(v) => setVisibleCols((prev) => ({ ...prev, [key]: Boolean(v) }))}
                >
                  {key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) return;
          if (editingProblem) {
            setSelectedTopicId(editingProblem.topic_id);
            setSelectedSubTopicId(editingProblem.sub_topic_id);
          } else {
            setSelectedTopicId(undefined);
            setSelectedSubTopicId(undefined);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProblem(null); setSelectedTopicId(undefined); setSelectedSubTopicId(undefined); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Problem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProblem ? "Edit Problem" : "Create Problem"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topic_id">Topic</Label>
                  <Select name="topic_id" value={selectedTopicId} onValueChange={(v) => { setSelectedTopicId(v); setSelectedSubTopicId(undefined); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
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
                  <Label htmlFor="sub_topic_id">Sub Topic</Label>
                  <Select name="sub_topic_id" value={selectedSubTopicId} onValueChange={(v) => setSelectedSubTopicId(v)} disabled={!selectedTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub topic" />
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
                <Label htmlFor="name">Problem Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProblem?.name}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProblem?.description}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                <Input
                  id="difficulty"
                  name="difficulty"
                  type="number"
                  min="1"
                  max="5"
                  defaultValue={editingProblem?.difficulty}
                />
              </div>
              
              <div>
                <Label htmlFor="code_template">Code Template</Label>
                <Textarea
                  id="code_template"
                  name="code_template"
                  defaultValue={editingProblem?.code_template}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time_limit_ms">Time Limit (ms)</Label>
                  <Input
                    id="time_limit_ms"
                    name="time_limit_ms"
                    type="number"
                    defaultValue={editingProblem?.time_limit_ms}
                  />
                </div>
                <div>
                  <Label htmlFor="memory_limit_mb">Memory Limit (MB)</Label>
                  <Input
                    id="memory_limit_mb"
                    name="memory_limit_mb"
                    type="number"
                    defaultValue={editingProblem?.memory_limit_mb}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="is_public" name="is_public" defaultChecked={editingProblem?.is_public} />
                  <Label htmlFor="is_public">Public</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="is_active" name="is_active" defaultChecked={editingProblem?.is_active} />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProblem ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  <span>Name</span>
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
                  <span>Topic</span>
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
                  <span>Sub Topic</span>
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
                  <span>Difficulty</span>
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
                  <span>Tests</span>
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
              <TableHead className="relative" style={{ width: colWidth.status }}>Status<div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("status", e)} /></TableHead>
              )}
              {visibleCols.actions && (
              <TableHead className="relative text-right" style={{ width: colWidth.actions }}>Actions<div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("actions", e)} /></TableHead>
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
                        value={rowTopicId}
                        onValueChange={(v) => {
                          setRowTopicId(v);
                          setRowSubTopicId(undefined);
                          updateMutation.mutate({ id: problem._id, dto: { topic_id: v, sub_topic_id: null } });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
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
                        value={rowSubTopicId}
                        onValueChange={(v) => {
                          setRowSubTopicId(v);
                          updateMutation.mutate({ id: problem._id, dto: { sub_topic_id: v } });
                          setRowEditId(undefined);
                        }}
                        disabled={!rowTopicId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {subTopics
                            .filter((st) => st.topic_id === rowTopicId)
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
