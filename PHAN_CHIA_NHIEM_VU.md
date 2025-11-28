# 📋 PHÂN CHIA NHIỆM VỤ HỌC - 2 NGƯỜI

## 🎯 Mục tiêu
Chia các trang admin thành 2 nhóm nhiệm vụ học tập cân bằng về độ phức tạp và kích thước code.

---

## 👤 NHIỆM VỤ 1: QUẢN LÝ NỘI DUNG & HỌC LIỆU

### 📚 Mô tả nhiệm vụ
Người học sẽ làm việc với các trang quản lý nội dung học tập, bao gồm bài tập, cuộc thi, chủ đề và test cases.

### 📁 Các trang cần học (7 trang)

1. **Problems.tsx** (49KB, 1069 dòng) ⭐⭐⭐
   - Quản lý bài tập (CRUD)
   - Lọc theo chủ đề, độ khó
   - Quản lý test cases tích hợp
   - Form phức tạp với nhiều trường dữ liệu

2. **ContestDetail.tsx** (66KB, 1316 dòng) ⭐⭐⭐
   - Trang chi tiết cuộc thi (trang lớn nhất)
   - Quản lý bài tập trong cuộc thi
   - Quản lý người tham gia
   - Theo dõi submissions
   - Multiple tabs, nhiều chức năng

3. **Topics.tsx** (9.3KB, 269 dòng) ⭐⭐
   - Quản lý chủ đề (CRUD)
   - Tìm kiếm, phân trang
   - Form đơn giản

4. **SubTopics.tsx** (11KB, 275 dòng) ⭐⭐
   - Quản lý chủ đề con (CRUD)
   - Liên kết với chủ đề cha
   - Tương tự Topics

5. **Contests.tsx** (10KB, 226 dòng) ⭐⭐
   - Danh sách cuộc thi
   - Tạo, chỉnh sửa, xóa cuộc thi
   - Lọc và tìm kiếm

6. **TestCases.tsx** (9.8KB, 251 dòng) ⭐⭐
   - Quản lý test cases cho bài tập
   - Input/Output validation
   - Test case types

7. **Dashboard.tsx** (10KB, 257 dòng) ⭐⭐
   - Trang tổng quan với thống kê
   - Biểu đồ submissions
   - Top students
   - Cards hiển thị số liệu

### 📊 Thống kê nhiệm vụ 1
- **Tổng số trang**: 7
- **Tổng số dòng code**: ~3,663 dòng
- **Độ phức tạp**: Cao (2 trang rất lớn và phức tạp)

### 🎓 Kiến thức học được
- Form handling phức tạp
- Tabs navigation
- Data filtering và pagination
- React Query mutations
- Nested data structures
- Data visualization (charts)
- Multi-step forms

---

## 👤 NHIỆM VỤ 2: QUẢN LÝ NGƯỜI DÙNG & TỔ CHỨC

### 📚 Mô tả nhiệm vụ
Người học sẽ làm việc với các trang quản lý người dùng, lớp học, khóa học và theo dõi hoạt động.

### 📁 Các trang cần học (10 trang)

1. **Users.tsx** (29KB, 711 dòng) ⭐⭐⭐
   - Quản lý người dùng (CRUD)
   - Lọc theo vai trò, giới tính
   - Tìm kiếm nâng cao
   - Export/Import (nếu có)
   - Phân trang

2. **Courses.tsx** (29KB, 669 dòng) ⭐⭐⭐
   - Quản lý khóa học
   - CRUD operations
   - Form phức tạp
   - Liên kết với nhiều entities

3. **Classes.tsx** (14KB, 271 dòng) ⭐⭐
   - Quản lý lớp học
   - Danh sách lớp
   - Tạo, chỉnh sửa lớp

4. **ClassDetail.tsx** (11KB, 234 dòng) ⭐⭐
   - Chi tiết lớp học
   - Quản lý sinh viên trong lớp
   - Thêm/xóa sinh viên

5. **StudentSubmissions.tsx** (18KB, 494 dòng) ⭐⭐⭐
   - Xem nộp bài của sinh viên
   - Lọc theo status
   - Chi tiết submission

6. **SubmissionHistory.tsx** (17KB, 447 dòng) ⭐⭐⭐
   - Lịch sử nộp bài tổng hợp
   - Lọc và tìm kiếm
   - Thống kê submissions

7. **UserDetail.tsx** (6.5KB, 169 dòng) ⭐
   - Chi tiết người dùng
   - Xem thông tin cá nhân
   - Thống kê cá nhân

8. **Login.tsx** (8.4KB, 195 dòng) ⭐⭐
   - Trang đăng nhập
   - Form validation
   - Authentication flow

9. **NotFound.tsx** (756B, 25 dòng) ⭐
   - Trang 404 đơn giản

10. **Index.tsx** (483B, 15 dòng) ⭐
    - Trang index mặc định

### 📊 Thống kê nhiệm vụ 2
- **Tổng số trang**: 10
- **Tổng số dòng code**: ~3,026 dòng
- **Độ phức tạp**: Trung bình-Cao (nhiều trang, 2 trang lớn)

### 🎓 Kiến thức học được
- User management systems
- Role-based access control
- Form validation
- Authentication
- Data tables với filtering
- Relationships giữa entities
- Bulk operations

---

## ⚖️ So sánh 2 nhiệm vụ

| Tiêu chí | Nhiệm vụ 1 | Nhiệm vụ 2 |
|----------|-----------|-----------|
| **Số trang** | 7 trang | 10 trang |
| **Số dòng code** | ~3,663 dòng | ~3,026 dòng |
| **Độ phức tạp** | Rất cao (2 trang lớn) | Trung bình-Cao |
| **Tính năng** | Content management | User & organization |
| **Điểm mạnh** | Học sâu về form phức tạp | Học về hệ thống quản lý |

### 🎯 Khuyến nghị học tập

**Nhiệm vụ 1** phù hợp cho:
- Người muốn học về xử lý form phức tạp
- Quan tâm đến data visualization
- Muốn làm việc với nested data structures

**Nhiệm vụ 2** phù hợp cho:
- Người muốn học về user management
- Quan tâm đến authentication & authorization
- Muốn làm việc với relationships và bulk operations

---

## 📝 Lộ trình học tập đề xuất

### Nhiệm vụ 1:
1. Bắt đầu với **Topics.tsx** và **SubTopics.tsx** (đơn giản)
2. Tiếp theo **TestCases.tsx** và **Contests.tsx** (trung bình)
3. Sau đó **Dashboard.tsx** (visualization)
4. Cuối cùng **Problems.tsx** và **ContestDetail.tsx** (phức tạp nhất)

### Nhiệm vụ 2:
1. Bắt đầu với **Login.tsx**, **NotFound.tsx**, **Index.tsx** (đơn giản)
2. Tiếp theo **UserDetail.tsx**, **Classes.tsx** (trung bình)
3. Sau đó **ClassDetail.tsx**, **SubmissionHistory.tsx** (trung bình-cao)
4. Cuối cùng **Users.tsx**, **Courses.tsx**, **StudentSubmissions.tsx** (phức tạp)

---

## ✅ Checklist hoàn thành

### Nhiệm vụ 1:
- [ ] Topics.tsx
- [ ] SubTopics.tsx
- [ ] TestCases.tsx
- [ ] Contests.tsx
- [ ] Dashboard.tsx
- [ ] Problems.tsx
- [ ] ContestDetail.tsx

### Nhiệm vụ 2:
- [ ] Login.tsx
- [ ] NotFound.tsx
- [ ] Index.tsx
- [ ] UserDetail.tsx
- [ ] Classes.tsx
- [ ] ClassDetail.tsx
- [ ] SubmissionHistory.tsx
- [ ] StudentSubmissions.tsx
- [ ] Users.tsx
- [ ] Courses.tsx

---

*Tài liệu này được tạo tự động dựa trên phân tích các file trong thư mục `src/pages/`*


