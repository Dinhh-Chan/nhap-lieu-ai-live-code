import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Shield,
  Calendar,
  Hash,
  MapPin,
  CalendarClock,
  UserCheck,
} from "lucide-react";
import type { User } from "@/types/user";
import type { UserStatistics } from "@/types/user-statistics";

interface ProfileSidebarProps {
  user?: User;
  statistics?: UserStatistics;
}

export const ProfileSidebar = ({ user, statistics }: ProfileSidebarProps) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN");
  };

  const genderLabel: Record<string, string> = {
    Male: "Nam",
    Female: "Nữ",
    Other: "Khác",
  };

  const initials =
    user?.fullname
      ?.split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || "--";

  const infoItems = [
    { label: "Email", value: user?.email || "—", icon: Mail },
    { label: "Vai trò", value: user?.systemRole || "—", icon: Shield },
    {
      label: "Giới tính",
      value: genderLabel[user?.gender || ""] || "Không xác định",
      icon: UserCheck,
    },
    { label: "Ngày sinh", value: formatDate(user?.dob), icon: Calendar },
    { label: "Mã sinh viên", value: user?.studentPtitCode || "—", icon: Hash },
    { label: "Vùng dữ liệu", value: user?.dataPartitionCode || "—", icon: MapPin },
    { label: "Tạo lúc", value: formatDateTime(user?.createdAt), icon: CalendarClock },
    { label: "Cập nhật", value: formatDateTime(user?.updatedAt), icon: CalendarClock },
  ];

  const practiceStats = [
    {
      label: "Tổng bài nộp",
      value: statistics?.total_submissions?.toLocaleString("vi-VN") ?? "0",
    },
    {
      label: "Đã chấp nhận",
      value: statistics?.accepted_submissions?.toLocaleString("vi-VN") ?? "0",
    },
    {
      label: "Tỉ lệ AC",
      value:
        statistics?.success_rate !== undefined
          ? `${statistics.success_rate.toFixed(1)}%`
          : "—",
    },
    {
      label: "Chuỗi dài nhất",
      value: statistics?.max_streak ? `${statistics.max_streak} ngày` : "—",
    },
    {
      label: "Ngày nộp gần nhất",
      value: formatDateTime(statistics?.last_submission_date),
    },
  ];

  const languageEntries = statistics?.language_stats
    ? Object.entries(statistics.language_stats)
    : [];

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{user?.fullname || "—"}</h2>
              {user?.systemRole && (
                <Badge variant="secondary" className="text-xs uppercase">
                  {user.systemRole}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{user?.username || "—"}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {infoItems.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-foreground">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Thống kê luyện tập</h3>
        <div className="space-y-3 text-sm">
          {practiceStats.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Ngôn ngữ đã sử dụng</h3>
        {languageEntries && languageEntries.length > 0 ? (
          <div className="space-y-2 text-sm">
            {languageEntries.map(([lang, count]) => (
              <div key={lang} className="flex items-center justify-between">
                <span className="capitalize text-foreground">{lang}</span>
                <span className="text-muted-foreground">
                  {count.toLocaleString("vi-VN")} bài nộp
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu ngôn ngữ.</p>
        )}
      </Card>
    </div>
  );
};
