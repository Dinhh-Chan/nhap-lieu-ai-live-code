import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopicsApi, type Topic } from "@/services/topics";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function Topics() {
  const [open, setOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: () => TopicsApi.list(),
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const topics = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) =>
      [t.topic_name, t.description, t.lo].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [topics, search]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);
  const startPage = useMemo(() => Math.floor((page - 1) / 10) * 10 + 1, [page]);
  const endPage = useMemo(() => Math.min(totalPages, startPage + 9), [totalPages, startPage]);

  const createMutation = useMutation({
    mutationFn: TopicsApi.create,
    onSuccess: () => {
      toast.success("Topic created successfully");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (e: any) => toast.error(e?.message || "Create failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Topic> }) => TopicsApi.updateById(id, dto),
    onSuccess: () => {
      toast.success("Topic updated successfully");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TopicsApi.deleteById(id),
    onSuccess: () => {
      toast.success("Topic deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dto = {
      topic_name: String(formData.get("topic_name") || ""),
      description: String(formData.get("description") || ""),
      lo: String(formData.get("lo") || ""),
      order_index: Number(formData.get("order_index") || 0),
    } as Partial<Topic>;

    if (editingTopic) {
      updateMutation.mutate({ id: editingTopic._id, dto });
    } else {
      createMutation.mutate(dto as any);
    }

    setOpen(false);
    setEditingTopic(null);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chủ đề</h1>
          <p className="text-muted-foreground">Quản lý các chủ đề</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm theo tên hoặc mô tả"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-72"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTopic(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTopic ? "Edit Topic" : "Create Topic"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="topic_name">Topic Name</Label>
                <Input
                  id="topic_name"
                  name="topic_name"
                  defaultValue={editingTopic?.topic_name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingTopic?.description}
                />
              </div>
              <div>
                <Label htmlFor="lo">Learning Objective</Label>
                <Textarea
                  id="lo"
                  name="lo"
                  defaultValue={editingTopic?.lo}
                />
              </div>
              <div>
                <Label htmlFor="order_index">Order</Label>
                <Input
                  id="order_index"
                  name="order_index"
                  type="number"
                  defaultValue={editingTopic?.order_index}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTopic ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên chủ đề</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Mục tiêu học tập</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((topic) => (
              <TableRow key={topic._id}>
                <TableCell className="font-medium">{topic.topic_name}</TableCell>
                <TableCell className="max-w-xs truncate">{topic.description}</TableCell>
                <TableCell className="max-w-xs truncate">{topic.lo}</TableCell>
                <TableCell>{topic.order_index}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTopic(topic);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc muốn xóa chủ đề này?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(topic._id)}>
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>
            {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
              const p = startPage + i;
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={page === p}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
