import type { User } from "@/types/user";

export const users: User[] = [
  {
    id: "u-01",
    fullName: "Nguyen Van A",
    email: "a@example.com",
    accountType: "LMS_ADMIN",
    isActive: true,
  },
  {
    id: "u-02",
    fullName: "Tran Thi B",
    email: "b@example.com",
    accountType: "TEACHER",
    isActive: true,
  },
];
