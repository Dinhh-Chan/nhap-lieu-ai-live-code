# He-Thong-Nhap-Lieu (FE)

## Cấu trúc thư mục

```
src/
  components/
    ProtectedRoute.tsx
    ui/* (shadcn)
    Layout.tsx, AppSidebar.tsx
  pages/
    Login.tsx
    Dashboard.tsx, Topics.tsx, SubTopics.tsx, Problems.tsx, TestCases.tsx, NotFound.tsx
  services/
    api.ts
  contexts/
    AuthContext.tsx
  hooks/
  lib/
    utils.ts
  assets/
  styles/
  main.tsx
  App.tsx
```

## Biến môi trường

- Tạo file `.env` từ mẫu:

```
VITE_API_BASE_URL=https://jsonplaceholder.typicode.com
```

## API service

- `services/api.ts` dùng Axios, interceptor gắn `Authorization` khi có token.
- Sử dụng cùng React Query để caching và trạng thái tải.

## Xác thực

- `contexts/AuthContext.tsx` quản lý `token` và `user` trong `localStorage`.
- `components/ProtectedRoute.tsx` chặn truy cập nếu chưa đăng nhập.

## Chạy dự án

```
pnpm dev
```


