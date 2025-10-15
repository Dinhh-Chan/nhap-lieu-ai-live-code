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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SubTopicsApi, type SubTopic } from "@/services/sub-topics";
import { TopicsApi, type Topic } from "@/services/topics";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";

export default function SubTopics() {
  const [open, setOpen] = useState(false);
  const [editingSubTopic, setEditingSubTopic] = useState<SubTopic | null>(null);
  const queryClient = useQueryClient();
  const { data: subTopicsData, isLoading } = useQuery({ queryKey: ["sub-topics"], queryFn: () => SubTopicsApi.list() });
  const { data: topicsData } = useQuery({ queryKey: ["topics"], queryFn: () => TopicsApi.list() });
  const subTopics = useMemo(() => (Array.isArray(subTopicsData) ? subTopicsData : []), [subTopicsData]);
  const topics = useMemo(() => (Array.isArray(topicsData) ? topicsData : []), [topicsData]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const total = subTopics.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => subTopics.slice((page - 1) * pageSize, page * pageSize), [subTopics, page, pageSize]);

  const createMutation = useMutation({
    mutationFn: SubTopicsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-topics"] }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<SubTopic> }) => SubTopicsApi.updateById(id, dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-topics"] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => SubTopicsApi.deleteById(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-topics"] }); },
  });

  const getTopicName = (topicId: string) => topics.find((t: Topic) => t._id === topicId)?.topic_name || "Unknown";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dto = {
      topic_id: String(formData.get("topic_id") || ""),
      sub_topic_name: String(formData.get("sub_topic_name") || ""),
      description: String(formData.get("description") || ""),
      lo: String(formData.get("lo") || ""),
      order_index: Number(formData.get("order_index") || 0),
    } as Partial<SubTopic>;
    if (editingSubTopic) updateMutation.mutate({ id: editingSubTopic._id, dto }); else createMutation.mutate(dto as any);
    setOpen(false);
    setEditingSubTopic(null);
  };

  const handleDelete = (id: string) => { deleteMutation.mutate(id); };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sub Topics</h1>
          <p className="text-muted-foreground">Manage sub topics under main topics</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSubTopic(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sub Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubTopic ? "Edit Sub Topic" : "Create Sub Topic"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="topic_id">Parent Topic</Label>
                <Select name="topic_id" defaultValue={editingSubTopic?.topic_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
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
                <Label htmlFor="sub_topic_name">Sub Topic Name</Label>
                <Input
                  id="sub_topic_name"
                  name="sub_topic_name"
                  defaultValue={editingSubTopic?.sub_topic_name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingSubTopic?.description}
                />
              </div>
              <div>
                <Label htmlFor="lo">Learning Objective</Label>
                <Textarea
                  id="lo"
                  name="lo"
                  defaultValue={editingSubTopic?.lo}
                />
              </div>
              <div>
                <Label htmlFor="order_index">Order</Label>
                <Input
                  id="order_index"
                  name="order_index"
                  type="number"
                  defaultValue={editingSubTopic?.order_index}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSubTopic ? "Update" : "Create"}
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
              <TableHead>Parent Topic</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((subTopic) => (
              <TableRow key={subTopic._id}>
                <TableCell className="font-medium">{subTopic.sub_topic_name}</TableCell>
                <TableCell>{getTopicName(subTopic.topic_id)}</TableCell>
                <TableCell className="max-w-xs truncate">{subTopic.description}</TableCell>
                <TableCell>{subTopic.order_index}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingSubTopic(subTopic);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(subTopic._id)}
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
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
