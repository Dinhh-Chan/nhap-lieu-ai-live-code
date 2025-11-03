import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClassStudentsApi } from "@/services/class-students";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UsersApi } from "@/services/users";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["class-students", id],
    queryFn: () => ClassStudentsApi.getByClassId(id!),
    enabled: !!id,
  });

  const students: any[] = data?.data ?? [];

  const [openAdd, setOpenAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(7);
  const { data: studentsPick, isLoading: picking } = useQuery({
    queryKey: ["pick-students", page, limit, search, openAdd],
    queryFn: () => UsersApi.searchByUsernamePage(search, page, limit, { sort: "username" }),
    enabled: openAdd,
  });
  const pickResults: any[] = studentsPick?.result ?? [];
  const hasNext = (studentsPick?.page ?? page) * (studentsPick?.limit ?? limit) < (studentsPick?.total ?? 0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { mutate: addMultiple, isPending: addingMany } = useMutation({
    mutationFn: (ids: string[]) => ClassStudentsApi.addMultiple(id!, ids),
    onSuccess: () => {
      setOpenAdd(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["class-students", id] });
    },
  });

  const { mutate: addOne, isPending: addingOne } = useMutation({
    mutationFn: (studentId: string) => ClassStudentsApi.create(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-students", id] });
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate("/classes") }>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chi tiết lớp học</h1>
          <p className="text-muted-foreground">ID: {id}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Học sinh trong lớp</CardTitle>
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button>Thêm học sinh</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Tìm theo username..." value={search} onChange={(e)=> { setPage(1); setSearch(e.target.value); }} />
                  <div className="rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[36px]"></TableHead>
                          <TableHead>Họ tên</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Mã SV</TableHead>
                          <TableHead className="text-right">Chọn</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pickResults.map(u => (
                          <TableRow key={u._id}>
                            <TableCell>
                              <Checkbox checked={selectedIds.includes(u._id)} onCheckedChange={(v)=> setSelectedIds(prev => v ? [...prev, u._id] : prev.filter(id2 => id2 !== u._id))} />
                            </TableCell>
                            <TableCell>{u.fullname}</TableCell>
                            <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                            <TableCell>{u.studentPtitCode || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={()=> addOne(u._id)} disabled={addingOne}>Chọn</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Trang {studentsPick?.page || page}</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={page<=1 || picking} onClick={()=> setPage(p=> Math.max(1, p-1))}>Trước</Button>
                      <Button variant="outline" size="sm" disabled={picking || !hasNext} onClick={()=> setPage(p=> p+1)}>Sau</Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={()=> setOpenAdd(false)}>Đóng</Button>
                  <Button onClick={()=> addMultiple(selectedIds)} disabled={selectedIds.length === 0 || addingMany}>
                    {addingMany ? "Đang thêm..." : `Thêm học sinh đã chọn (${selectedIds.length})`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Không thể tải học sinh</div>
          ) : (
            <div className="rounded border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Mã SV</TableHead>
                    <TableHead>Ngày vào lớp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s: any) => (
                    <TableRow key={s._id}>
                      <TableCell>
                        <div className="font-medium">{s.student_basic?.fullname || s.student_id}</div>
                        <div className="text-xs text-muted-foreground">@{s.student_basic?.username || "—"}</div>
                      </TableCell>
                      <TableCell>{s.student_basic?.studentPtitCode || "—"}</TableCell>
                      <TableCell>{s.enrolled_at ? new Date(s.enrolled_at).toLocaleString("vi-VN") : "—"}</TableCell>
                      <TableCell>{s.is_active ? "Active" : "Inactive"}</TableCell>
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


