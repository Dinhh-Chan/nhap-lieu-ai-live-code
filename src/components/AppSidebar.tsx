import { Home, BookOpen, List, Code, TestTube, LogOut, User, Users, Trophy, GraduationCap } from "lucide-react";
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

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Topics", url: "/topics", icon: BookOpen },
  { title: "Sub Topics", url: "/sub-topics", icon: List },
  { title: "Problems", url: "/problems", icon: Code },
  { title: "Test Cases", url: "/test-cases", icon: TestTube },
  { title: "Users", url: "/users", icon: Users },
  { title: "Contests", url: "/contests", icon: Trophy },
  { title: "Classes", url: "/classes", icon: GraduationCap },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            {open && <span className="font-semibold text-lg">Learning CMS</span>}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
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
