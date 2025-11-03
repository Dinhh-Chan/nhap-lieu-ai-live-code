import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Trash2 } from "lucide-react";
import { ClassesApi } from "@/services/classes";
import { UsersApi } from "@/services/users";
import type { ClassItem } from "@/types/class";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Classes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["classes", "many"],
    queryFn: () => ClassesApi.listMany(),
  });

  const items: ClassItem[] = Array.isArray(data?.data) ? (data?.data as ClassItem[]) : (data?.data ? [data?.data as any] : []);

  const [open, setOpen] = useState(false) as any;
  const [form, setForm] = useState<any>({
    class_id: "",
    class_name: "",
    class_code: "",
    teacher_id: "",
    teacher_username: "",
    start_time: "",
    end_time: "",
    description: "",
    is_active: true,
  }) as any;

  const [openTeacher, setOpenTeacher] = useState(false) as any;
  const [teacherSearch, setTeacherSearch] = useState("") as any;
  const [teacherPage, setTeacherPage] = useState(1) as any;
  const [teacherLimit, setTeacherLimit] = useState(7) as any;
  const { data: teachersPage, isLoading: teachersLoading } = useQuery({
    queryKey: ["class-teachers", teacherPage, teacherLimit, teacherSearch, openTeacher],
    queryFn: () => UsersApi.searchByUsernamePage(teacherSearch, teacherPage, teacherLimit, { sort: "username" }),
    enabled: openTeacher,
  });
  const teacherResults: any[] = teachersPage?.result ?? [];
  const hasNextTeachers = (teachersPage?.page ?? teacherPage) * (teachersPage?.limit ?? teacherLimit) < (teachersPage?.total ?? 0);

  const { mutate: createClass, isPending: creating } = useMutation({
    mutationFn: (dto: any) => ClassesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", "many"] });
      setOpen(false);
      setForm({ class_id: "", class_name: "", class_code: "", teacher_id: "", teacher_username: "", start_time: "", end_time: "", description: "", is_active: true });
    },
  });

  const { mutate: deleteClass } = useMutation({
    mutationFn: (id: string) => ClassesApi.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", "many"] });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lớp học</h1>
          <p className="text-muted-foreground">Quản lý danh sách lớp học</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Thêm lớp học</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Thêm lớp học</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Class ID</Label>
                <Input className="col-span-3" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tên lớp</Label>
                <Input className="col-span-3" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Mã lớp</Label>
                <Input className="col-span-3" value={form.class_code} onChange={e => setForm({ ...form, class_code: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Giáo viên</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input readOnly placeholder="Chưa chọn" value={form.teacher_username} />
                  <Dialog open={openTeacher} onOpenChange={setOpenTeacher}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline">Chọn</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[560px]">
                      <DialogHeader>
                        <DialogTitle>Chọn giáo viên</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Input placeholder="Tìm theo username..." value={teacherSearch} onChange={e => { setTeacherPage(1); setTeacherSearch(e.target.value); }} />
                        </div>
                        <div className="rounded border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead className="text-right">Chọn</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teacherResults.map((u: any) => (
                                <TableRow key={u._id}>
                                  <TableCell>{u.fullname}</TableCell>
                                  <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => { setForm({ ...form, teacher_id: u._id, teacher_username: u.username }); setOpenTeacher(false); }}>Chọn</Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Trang {teachersPage?.page || teacherPage}</div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={teacherPage<=1 || teachersLoading} onClick={()=> setTeacherPage((p:number)=> Math.max(1, p-1))}>Trước</Button>
                            <Button variant="outline" size="sm" disabled={teachersLoading || !hasNextTeachers} onClick={()=> setTeacherPage((p:number)=> p+1)}>Sau</Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="secondary" onClick={() => setOpenTeacher(false)}>Đóng</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Bắt đầu</Label>
                <Input type="datetime-local" className="col-span-3" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Kết thúc</Label>
                <Input type="datetime-local" className="col-span-3" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Mô tả</Label>
                <Input className="col-span-3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Kích hoạt</Label>
                <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={() => createClass({
                class_id: form.class_id,
                class_name: form.class_name,
                class_code: form.class_code,
                teacher_id: form.teacher_id || undefined,
                start_time: form.start_time ? new Date(form.start_time).toISOString() : undefined,
                end_time: form.end_time ? new Date(form.end_time).toISOString() : undefined,
                description: form.description,
                is_active: !!form.is_active,
              })} disabled={creating}>
                {creating ? "Đang tạo..." : "Tạo lớp"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lớp</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Không thể tải lớp học</div>
          ) : (
            <div className="rounded border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.class_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.class_code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{c.teacher?.fullname || "—"}</div>
                        <div className="text-xs text-muted-foreground">@{c.teacher?.username || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{c.start_time ? new Date(c.start_time).toLocaleString("vi-VN") : "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{c.end_time ? new Date(c.end_time).toLocaleString("vi-VN") : "—"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${c._id}`)}>
                            <Eye className="h-4 w-4 mr-2" />Xem chi tiết
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />Xóa
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Bạn có chắc muốn xóa lớp này?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteClass(c._id)}>Xóa</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


