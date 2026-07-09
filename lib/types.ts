export type Batch = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  schedule: string | null;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Enrollment = {
  id: string;
  student_id: string;
  batch_id: string;
  joined_at: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type EnrollmentWithStudent = Enrollment & {
  students: Student;
};

export type BatchWithCount = Batch & {
  enrollments: { count: number }[];
};