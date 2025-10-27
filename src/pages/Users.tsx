import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowUpDown, Users as UsersIcon, Eye } from "lucide-react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UsersApi } from "@/services/users";
import type { User, UserListParams } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Users() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [genderFilter, setGenderFilter] = useState<string | undefined>(undefined);
  const [sortKey, setSortKey] = useState<
    | "username"
    | "fullname"
    | "email"
    | "systemRole"
    | "gender"
    | "createdAt"
    | undefined
  >(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading, error } = useQuery({ 
    queryKey: ["users", page, pageSize, search, roleFilter, genderFilter, sortKey, sortDir], 
    queryFn: () => {
      const params: UserListParams = {
        page,
        limit: pageSize
      };
      
      if (search) params.search = search;
      if (roleFilter) params.systemRole = roleFilter;
      if (genderFilter) params.gender = genderFilter;
      if (sortKey) {
        params.sort = sortKey;
        params.order = sortDir;
      }
      
      return UsersApi.list(page, pageSize, params);
    }
  });

  const users = useMemo(() => (usersData?.data?.result ? usersData.data.result : []), [usersData]);
  
  const [visibleCols, setVisibleCols] = useState({
    no: true,
    username: true,
    fullname: true,
    email: true,
    role: true,
    gender: true,
    dob: true,
    createdAt: true,
    actions: true,
  });
  
  const [colWidth, setColWidth] = useState<Record<string, number>>({
    no: 56,
    username: 150,
    fullname: 200,
    email: 250,
    role: 120,
    gender: 100,
    dob: 120,
    createdAt: 150,
    actions: 120,
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
  const paged = useMemo(() => Array.isArray(users) ? users : [], [users]);
  const total = usersData?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startPage = useMemo(() => Math.floor((page - 1) / 10) * 10 + 1, [page]);
  const endPage = useMemo(() => Math.min(totalPages, startPage + 9), [totalPages, startPage]);

  const createMutation = useMutation({
    mutationFn: UsersApi.create,
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["users"] }); 
      toast.success("Tạo người dùng thành công");
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<User> }) => UsersApi.updateById(id, dto),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["users"] }); 
      toast.success("Cập nhật người dùng thành công");
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => UsersApi.deleteById(id),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["users"] }); 
      toast.success("Xóa người dùng thành công");
    },
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-500";
      case "Teacher": return "bg-blue-500";
      case "Student": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "Male": return "bg-blue-100 text-blue-800";
      case "Female": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dto = {
      username: String(formData.get("username") || ""),
      email: String(formData.get("email") || ""),
      firstname: String(formData.get("firstname") || ""),
      lastname: String(formData.get("lastname") || ""),
      fullname: String(formData.get("fullname") || ""),
      gender: String(formData.get("gender") || "Male") as "Male" | "Female" | "Other",
      dob: String(formData.get("dob") || ""),
      systemRole: String(formData.get("systemRole") || "User") as "Admin" | "Student" | "Teacher" | "User",
      password: String(formData.get("password") || ""),
    } as any;
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser._id, dto });
    } else {
      createMutation.mutate(dto);
    }
    setOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => { 
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      deleteMutation.mutate(id); 
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Người dùng</h1>
          <p className="text-muted-foreground">Quản lý thông tin người dùng hệ thống</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleFilter} onValueChange={(v) => { setPage(1); setRoleFilter(v); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Teacher">Teacher</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={genderFilter} onValueChange={(v) => { setPage(1); setGenderFilter(v); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Nam</SelectItem>
              <SelectItem value="Female">Nữ</SelectItem>
              <SelectItem value="Other">Khác</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Tìm kiếm người dùng"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-64"
          />
          
          <Button variant="outline" onClick={() => { 
            setSearch(""); 
            setRoleFilter(undefined); 
            setGenderFilter(undefined); 
            setPage(1); 
          }}>
            Reset
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Cột</Button>
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
          if (!v) setEditingUser(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUser(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Người dùng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Chỉnh sửa Người dùng" : "Thêm Người dùng"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input
                    id="username"
                    name="username"
                    defaultValue={editingUser?.username}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingUser?.email}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstname">Tên</Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    defaultValue={editingUser?.firstname}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastname">Họ</Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    defaultValue={editingUser?.lastname}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="fullname">Họ và tên</Label>
                <Input
                  id="fullname"
                  name="fullname"
                  defaultValue={editingUser?.fullname}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select name="gender" defaultValue={editingUser?.gender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Nam</SelectItem>
                      <SelectItem value="Female">Nữ</SelectItem>
                      <SelectItem value="Other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dob">Ngày sinh</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    defaultValue={editingUser?.dob}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systemRole">Vai trò</Label>
                  <Select name="systemRole" defaultValue={editingUser?.systemRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required={!editingUser}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">
                  {editingUser ? "Cập nhật" : "Tạo"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <div className="border rounded-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.
          </div>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}>
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <div className="border rounded-lg p-8 text-center">
          <div className="text-muted-foreground mb-4">Đang tải dữ liệu...</div>
        </div>
      ) : paged.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <div className="text-muted-foreground mb-4">Không tìm thấy người dùng nào</div>
          <Button onClick={() => { setSearch(""); setRoleFilter(undefined); setGenderFilter(undefined); setPage(1); }}>
            Xóa bộ lọc
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
                {visibleCols.username && (
                  <TableHead className="relative" style={{ width: colWidth.username }}>
                    <div className="flex items-center gap-2">
                      <span>Tên đăng nhập</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPage(1);
                          setSortKey("username");
                          setSortDir((d) => (sortKey === "username" && d === "asc" ? "desc" : "asc"));
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("username", e)} />
                  </TableHead>
                )}
                {visibleCols.fullname && (
                  <TableHead className="relative" style={{ width: colWidth.fullname }}>
                    <div className="flex items-center gap-2">
                      <span>Họ và tên</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPage(1);
                          setSortKey("fullname");
                          setSortDir((d) => (sortKey === "fullname" && d === "asc" ? "desc" : "asc"));
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("fullname", e)} />
                  </TableHead>
                )}
                {visibleCols.email && (
                  <TableHead className="relative" style={{ width: colWidth.email }}>
                    <div className="flex items-center gap-2">
                      <span>Email</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPage(1);
                          setSortKey("email");
                          setSortDir((d) => (sortKey === "email" && d === "asc" ? "desc" : "asc"));
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("email", e)} />
                  </TableHead>
                )}
                {visibleCols.role && (
                  <TableHead className="relative" style={{ width: colWidth.role }}>
                    <div className="flex items-center gap-2">
                      <span>Vai trò</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPage(1);
                          setSortKey("systemRole");
                          setSortDir((d) => (sortKey === "systemRole" && d === "asc" ? "desc" : "asc"));
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("role", e)} />
                  </TableHead>
                )}
                {visibleCols.gender && (
                  <TableHead className="relative" style={{ width: colWidth.gender }}>
                    <div className="flex items-center gap-2">
                      <span>Giới tính</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPage(1);
                          setSortKey("gender");
                          setSortDir((d) => (sortKey === "gender" && d === "asc" ? "desc" : "asc"));
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("gender", e)} />
                  </TableHead>
                )}
                {visibleCols.dob && (
                  <TableHead className="relative" style={{ width: colWidth.dob }}>
                    <div className="flex items-center">Ngày sinh</div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("dob", e)} />
                  </TableHead>
                )}
                {visibleCols.createdAt && (
                  <TableHead className="relative" style={{ width: colWidth.createdAt }}>
                    <div className="flex items-center gap-2">
                      <span>Ngày tạo</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPage(1);
                          setSortKey("createdAt");
                          setSortDir((d) => (sortKey === "createdAt" && d === "asc" ? "desc" : "asc"));
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("createdAt", e)} />
                  </TableHead>
                )}
                {visibleCols.actions && (
                  <TableHead className="relative text-right" style={{ width: colWidth.actions }}>
                    Thao tác
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none" onMouseDown={(e) => initResize("actions", e)} />
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((user) => (
                <TableRow key={user._id}>
                  {visibleCols.no && (
                    <TableCell className="truncate" style={{ width: colWidth.no }}>
                      {(page - 1) * pageSize + 1 + paged.indexOf(user)}
                    </TableCell>
                  )}
                  {visibleCols.username && (
                    <TableCell className="font-medium truncate" style={{ width: colWidth.username }}>
                      {user.username}
                    </TableCell>
                  )}
                  {visibleCols.fullname && (
                    <TableCell className="truncate" style={{ width: colWidth.fullname }}>
                      {user.fullname}
                    </TableCell>
                  )}
                  {visibleCols.email && (
                    <TableCell className="truncate" style={{ width: colWidth.email }}>
                      {user.email}
                    </TableCell>
                  )}
                  {visibleCols.role && (
                    <TableCell className="truncate" style={{ width: colWidth.role }}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getRoleColor(user.systemRole)}`} />
                        <span>{user.systemRole}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleCols.gender && (
                    <TableCell className="truncate" style={{ width: colWidth.gender }}>
                      <Badge className={getGenderColor(user.gender)}>
                        {user.gender === "Male" ? "Nam" : user.gender === "Female" ? "Nữ" : "Khác"}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleCols.dob && (
                    <TableCell className="truncate" style={{ width: colWidth.dob }}>
                      {formatDate(user.dob)}
                    </TableCell>
                  )}
                  {visibleCols.createdAt && (
                    <TableCell className="truncate" style={{ width: colWidth.createdAt }}>
                      {formatDate(user.createdAt)}
                    </TableCell>
                  )}
                  {visibleCols.actions && (
                    <TableCell className="text-right truncate" style={{ width: colWidth.actions }}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/users/${user._id}`)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingUser(user);
                            setOpen(true);
                          }}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user._id)}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!error && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Hiển thị {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} trong tổng số {total} người dùng
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Số dòng:</span>
              <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                const p = startPage + i;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink 
                      href="#" 
                      isActive={page === p} 
                      onClick={(e) => { e.preventDefault(); setPage(p); }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
