import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { ShieldCheck, Sparkles, Users } from "lucide-react";

const schema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

type FormValues = z.infer<typeof schema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await authService.login({
        platform: "Web",
        username: values.username,
        password: values.password,
      });

      if (response.success) {
        // Decode JWT để lấy thông tin user
        const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
        
        login(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.accessExpireAt,
          response.data.refreshExpireAt,
          {
            id: tokenPayload.sub,
            username: tokenPayload.username,
            email: tokenPayload.email,
            firstName: tokenPayload.firstName,
            lastName: tokenPayload.lastName,
            platform: tokenPayload.platform,
            systemRole: tokenPayload.systemRole,
          }
        );

        toast.success("Đăng nhập thành công!");
        const to = location.state?.from?.pathname || "/";
        navigate(to, { replace: true });
      } else {
        toast.error("Đăng nhập thất bại!");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Có lỗi xảy ra khi đăng nhập");
    }
  };

  const highlights = [
    {
      icon: Sparkles,
      title: "Trung tâm luyện thi",
      desc: "Kho bài tập đa dạng, cập nhật liên tục để bạn luyện tập mỗi ngày.",
    },
    {
      icon: ShieldCheck,
      title: "An toàn & Bảo mật",
      desc: "Hệ thống xác thực nhiều lớp giúp bảo vệ dữ liệu và tài khoản.",
    },
    {
      icon: Users,
      title: "Kết nối đội ngũ",
      desc: "Quản lý contest, lớp học, người dùng trong một giao diện thống nhất.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.2),_transparent_50%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="mb-8 inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
              AI TUTOR PLATFORM
            </div>
            <h1 className="mb-4 text-4xl font-semibold leading-tight lg:text-5xl">
              Nền tảng quản trị học tập hiện đại
            </h1>
            <p className="mb-8 text-base text-slate-200">
              Theo dõi thống kê, tổ chức contest, quản lý lớp học và người dùng chỉ trong vài thao tác.
              Đồng bộ dữ liệu xuyên suốt giúp bạn nắm bắt tình hình hệ thống tức thời.
            </p>

            <div className="grid gap-6">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-blue-400/30 text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-200">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center text-slate-200">
              <div>
                <p className="text-3xl font-bold text-white">120+</p>
                <p className="text-xs uppercase tracking-wide text-slate-300">Contest</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">3K+</p>
                <p className="text-xs uppercase tracking-wide text-slate-300">Học viên</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">450+</p>
                <p className="text-xs uppercase tracking-wide text-slate-300">Bài tập</p>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full rounded-3xl bg-white/95 p-10 shadow-2xl backdrop-blur"
            >
              <div className="mb-8 text-center">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Chào mừng trở lại</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">Đăng nhập hệ thống</h2>
                <p className="mt-2 text-sm text-slate-500">Tiếp tục hành trình dẫn dắt người học</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Tên đăng nhập</label>
                  <Input
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    {...register("username")}
                  />
                  {errors.username && <p className="mt-2 text-sm text-red-500">{errors.username.message}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Mật khẩu</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    {...register("password")}
                  />
                  {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-12 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-base font-semibold tracking-wide text-white shadow-lg transition-all hover:opacity-95 disabled:opacity-70"
                >
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </div>

              <p className="mt-6 text-center text-xs text-slate-500">
                Được phát triển bởi đội ngũ AI Tutor · Học nhanh hơn, quản trị thông minh hơn
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


