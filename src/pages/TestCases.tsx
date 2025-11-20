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
import { TestCasesApi, type TestCase } from "@/services/test-cases";
import { ProblemsApi, type Problem } from "@/services/problems";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";

export default function TestCases() {
  const [open, setOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { data: testCasesData, isLoading } = useQuery({
    queryKey: ["test-cases", { page, pageSize }],
    queryFn: () => TestCasesApi.listPage(page, pageSize),
    placeholderData: (prev) => prev,
  });
  const { data: problemsData } = useQuery({ queryKey: ["problems"], queryFn: () => ProblemsApi.list() });
  const testCases = useMemo(() => (Array.isArray(testCasesData) ? testCasesData : []), [testCasesData]);
  const problems = useMemo(() => (Array.isArray(problemsData) ? problemsData : []), [problemsData]);
  const startPage = useMemo(() => Math.floor((page - 1) / 10) * 10 + 1, [page]);
  const endPage = useMemo(() => startPage + 9, [startPage]);

  const createMutation = useMutation({
    mutationFn: TestCasesApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["test-cases"] }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<TestCase> }) => TestCasesApi.updateById(id, dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["test-cases"] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => TestCasesApi.deleteById(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["test-cases"] }); },
  });

  const getProblemName = (problemId: string) => {
    return problems.find((p: Problem) => p._id === problemId)?.name || "Unknown";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dto = {
      problem_id: String(formData.get("problem_id") || ""),
      input_data: String(formData.get("input_data") || ""),
      expected_output: String(formData.get("expected_output") || ""),
      order_index: Number(formData.get("order_index") || 0),
      is_public: Boolean(formData.get("is_public")),
    } as Partial<TestCase>;
    if (editingTestCase) updateMutation.mutate({ id: editingTestCase._id, dto }); else createMutation.mutate(dto as any);
    setOpen(false);
    setEditingTestCase(null);
  };

  const handleDelete = (id: string) => { deleteMutation.mutate(id); };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Test Cases</h1>
          <p className="text-muted-foreground">Manage problem test cases</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTestCase(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Test Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTestCase ? "Edit Test Case" : "Create Test Case"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="problem_id">Problem</Label>
                <Select name="problem_id" defaultValue={editingTestCase?.problem_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a problem" />
                  </SelectTrigger>
                  <SelectContent>
                    {problems.map(problem => (
                      <SelectItem key={problem._id} value={problem._id}>
                        {problem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="input_data">Input Data</Label>
                <Textarea
                  id="input_data"
                  name="input_data"
                  defaultValue={editingTestCase?.input_data}
                  placeholder="e.g., [2,7,11,15], 9"
                  className="font-mono text-sm"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="expected_output">Expected Output</Label>
                <Textarea
                  id="expected_output"
                  name="expected_output"
                  defaultValue={editingTestCase?.expected_output}
                  placeholder="e.g., [0,1]"
                  className="font-mono text-sm"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="order_index">Order</Label>
                <Input
                  id="order_index"
                  name="order_index"
                  type="number"
                  defaultValue={editingTestCase?.order_index}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id="is_public" name="is_public" defaultChecked={editingTestCase?.is_public} />
                <Label htmlFor="is_public">Public (visible to users)</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTestCase ? "Update" : "Create"}
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
              <TableHead>Bài tập</TableHead>
              <TableHead>Input</TableHead>
              <TableHead>Kết quả mong đợi</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Hiển thị</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testCases.map((testCase) => (
              <TableRow key={testCase._id}>
                <TableCell className="font-medium">{getProblemName(testCase.problem_id)}</TableCell>
                <TableCell className="max-w-xs truncate font-mono text-sm">{testCase.input_data}</TableCell>
                <TableCell className="max-w-xs truncate font-mono text-sm">{testCase.expected_output}</TableCell>
                <TableCell>{testCase.order_index}</TableCell>
                <TableCell>
                  {testCase.is_public ? (
                    <Badge>Công khai</Badge>
                  ) : (
                    <Badge variant="outline">Ẩn</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTestCase(testCase);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(testCase._id)}
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
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => p + 1); }} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
