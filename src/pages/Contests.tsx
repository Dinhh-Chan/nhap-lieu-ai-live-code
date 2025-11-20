import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import type { Contest, CreateContestDto, ContestManyItem, ContestCreateDto } from "@/types/contest";
import { mockProblems } from "@/lib/mockData";
import { Plus, Calendar } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContestsApi } from "@/services/contests";

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
  const [form, setForm] = useState<any>({
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

  const { mutate: createContest, isPending: creating } = useMutation({
    mutationFn: (payload: ContestCreateDto) => ContestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests", "many"] });
      setOpen(false);
      setForm({ name: "", description: "", start_time: "", end_time: "", is_active: true, duration_minutes: 0, max_problems: 0, order_index: 0, type: "practice" });
      setForm({ name: "", description: "", start_time: "", end_time: "", is_active: true, duration_minutes: 0, max_problems: 0, order_index: 0, type: "practice" });
    },
  });

  const handleCreate = () => {
    const payload: ContestCreateDto = {
      contest_name: form.name || "New Contest",
      description: form.description || "",
      start_time: form.start_time ? new Date(form.start_time).toISOString() : new Date().toISOString(),
      end_time: form.end_time ? new Date(form.end_time).toISOString() : new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      created_time: new Date().toISOString(),
      is_active: !!form.is_active,
      duration_minutes: Number(form.duration_minutes) || 0,
      max_problems: Number(form.max_problems) || 0,
      order_index: Number(form.order_index) || 0,
      type: form.type || "practice",
    };
    createContest(payload);
  };

  // Fetch contests from API
  const { data: contestsApi, isLoading } = useQuery({
    queryKey: ["contests", "many"],
    queryFn: () => ContestsApi.listMany(),
  });

  const apiContests = (contestsApi?.data || []) as ContestManyItem[];
  const visibleContests = useMemo(() => apiContests, [apiContests]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contests</h1>
          <p className="text-muted-foreground">Quản lý kỳ thi/contest</p>
        </div>
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
                <Input type="number" min={0} className="col-span-3" value={form.duration_minutes}
                  onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Số bài tối đa</Label>
                <Input type="number" min={0} className="col-span-3" value={form.max_problems}
                  onChange={e => setForm({ ...form, max_problems: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Thứ tự</Label>
                <Input type="number" min={0} className="col-span-3" value={form.order_index}
                  onChange={e => setForm({ ...form, order_index: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Loại</Label>
                <div className="col-span-3">
                  <Select value={form.type} onValueChange={(v)=> setForm({ ...form, type: v })}>
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
                <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              {visibleContests.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium">{"contest_name" in c ? c.contest_name : (c as any).name}</TableCell>
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
                    {"is_active" in c ? (
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
                    <Button variant="outline" size="sm" onClick={() => navigate(`/contests/${c._id}`)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


