export type User = {
  _id: string;
  username: string;
  password?: string;
  ssoId?: string | null;
  email: string;
  firstname: string;
  lastname: string;
  fullname: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  systemRole: "Admin" | "Student" | "Teacher" | "User";
  studentPtitCode?: string | null;
  dataPartitionCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateUserDto = Omit<User, "_id" | "createdAt" | "updatedAt" | "password"> & {
  password: string;
};

export type UpdateUserDto = Partial<CreateUserDto>;

export type UserListResponse = {
  success: boolean;
  data: {
    page: number;
    skip: number;
    limit: number;
    total: number;
    result: User[];
  };
};

export type UserListParams = {
  page?: number;
  limit?: number;
  search?: string;
  systemRole?: string;
  gender?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};
