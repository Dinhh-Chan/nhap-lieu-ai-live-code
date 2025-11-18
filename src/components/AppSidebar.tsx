import { Home, BookOpen, List, Code, LogOut, User, Users, Trophy, GraduationCap, FileText, ChevronDown, ChevronRight, BarChart3, MessageSquare } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLearningMaterialsOpen, setIsLearningMaterialsOpen] = useState(true);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Code className="h-5 w-5 text-primary-foreground" />
            </div>
            {open && <span className="font-semibold text-lg">Hệ thống quản lý học tập</span>}
          </div>
        </div>
        
        {/* QUẢN LÝ Section */}
        <SidebarGroup>
          <SidebarGroupLabel>QUẢN LÝ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }
                  >
                    <Home className="h-4 w-4" />
                    <span>Trang chủ</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Học liệu Section - Collapsible */}
        <SidebarGroup>
          <Collapsible open={isLearningMaterialsOpen} onOpenChange={setIsLearningMaterialsOpen}>
            <SidebarMenu>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <BookOpen className="h-4 w-4" />
                    <span>Học liệu</span>
                    {isLearningMaterialsOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="pl-8">
                        <NavLink
                          to="/topics"
                          className={({ isActive }) =>
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted"
                          }
                        >
                          <span>Chủ đề</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="pl-8">
                        <NavLink
                          to="/sub-topics"
                          className={({ isActive }) =>
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted"
                          }
                        >
                          <span>Chủ đề con</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="pl-8">
                        <NavLink
                          to="/problems"
                          className={({ isActive }) =>
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted"
                          }
                        >
                          <span>Bài tập</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </SidebarMenu>
          </Collapsible>
        </SidebarGroup>

        {/* Lịch sử nộp bài */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/student-submissions"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }
                  >
                    <FileText className="h-4 w-4" />
                    <span>Lịch sử nộp bài</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Người dùng */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }
                  >
                    <Users className="h-4 w-4" />
                    <span>Người dùng</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Lớp học */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/classes"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Lớp học</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cuộc thi */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/contests"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Cuộc thi</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* KHÁC Section */}
        <SidebarGroup>
          <SidebarGroupLabel>KHÁC</SidebarGroupLabel>
          <Collapsible open={isStatisticsOpen} onOpenChange={setIsStatisticsOpen}>
            <SidebarMenu>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <BarChart3 className="h-4 w-4" />
                    <span>Thống kê</span>
                    {isStatisticsOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu>
                    {/* Có thể thêm các mục con của Thống kê ở đây nếu cần */}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare className="h-4 w-4" />
                  <span>Phản hồi</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="p-2 border-t border-border space-y-2">
        {user && open && (
          <div className="px-2 py-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.firstName} {user.lastName}</span>
            </div>
            <div className="text-xs text-muted-foreground ml-6">
              {user.systemRole}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {open && <span>Đăng xuất</span>}
          </Button>
          <SidebarTrigger />
        </div>
      </div>
    </Sidebar>
  );
}
