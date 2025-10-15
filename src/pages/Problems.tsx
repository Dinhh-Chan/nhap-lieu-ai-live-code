import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { ProblemsApi, type Problem } from "@/services/problems";
import { TopicsApi, type Topic } from "@/services/topics";
import { SubTopicsApi, type SubTopic } from "@/services/sub-topics";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";

export default function Problems() {
  const [open, setOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const queryClient = useQueryClient();
  const { data: problemsData, isLoading } = useQuery({ queryKey: ["problems"], queryFn: () => ProblemsApi.list() });
  const { data: topicsData } = useQuery({ queryKey: ["topics"], queryFn: () => TopicsApi.list() });
  const { data: subTopicsData } = useQuery({ queryKey: ["sub-topics"], queryFn: () => SubTopicsApi.list() });
  const problems = useMemo(() => (Array.isArray(problemsData) ? problemsData : []), [problemsData]);
  const topics = useMemo(() => (Array.isArray(topicsData) ? topicsData : []), [topicsData]);
  const subTopics = useMemo(() => (Array.isArray(subTopicsData) ? subTopicsData : []), [subTopicsData]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const total = problems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => problems.slice((page - 1) * pageSize, page * pageSize), [problems, page, pageSize]);
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
      topic_id: String(formData.get("topic_id") || ""),
      sub_topic_id: String(formData.get("sub_topic_id") || ""),
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
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProblem(null)}>
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
                  <Select name="topic_id" defaultValue={editingProblem?.topic_id}>
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
                  <Select name="sub_topic_id" defaultValue={editingProblem?.sub_topic_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {subTopics.map(subTopic => (
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((problem) => (
              <TableRow key={problem._id}>
                <TableCell className="font-medium">{problem.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getDifficultyColor(problem.difficulty)}`} />
                    <span>{problem.difficulty}/5</span>
                  </div>
                </TableCell>
                <TableCell>{problem.number_of_tests} tests</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {problem.is_public && <Badge variant="outline">Public</Badge>}
                    {problem.is_active && <Badge>Active</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
    </div>
  );
}
