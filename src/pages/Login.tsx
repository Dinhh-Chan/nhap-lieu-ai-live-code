import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth";
import { toast } from "sonner";

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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        <div>
          <label className="mb-1 block text-sm">Tên đăng nhập</label>
          <Input type="text" placeholder="Nhập tên đăng nhập" {...register("username")} />
          {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">Mật khẩu</label>
          <Input type="password" placeholder="••••••" {...register("password")} />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
};

export default Login;


