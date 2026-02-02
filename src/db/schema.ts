import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const planEnum = pgEnum("plan", ["lite", "standard", "enterprise"]);
export const roleEnum = pgEnum("role", ["admin", "manager", "worker"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "recording",
  "editing",
  "submitted",
  "approved",
  "rejected",
]);
export const vacationStatusEnum = pgEnum("vacation_status", [
  "pending",
  "approved",
  "rejected",
]);
export const vacationTypeEnum = pgEnum("vacation_type", [
  "annual",      // 연차
  "half",        // 반차
  "sick",        // 병가
  "special",     // 경조사
  "other",       // 기타
]);

// Company
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  plan: planEnum("plan").default("lite").notNull(),
  screenshotInterval: integer("screenshot_interval").default(60).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  role: roleEnum("role").default("worker").notNull(),
  department: varchar("department", { length: 100 }),
  hireDate: date("hire_date"), // 입사일 (연차 계산용)
  annualLeaveBalance: integer("annual_leave_balance").default(15), // 수동 조정된 연차 (null이면 자동 계산)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// WorkSession
export const workSessions = pgTable("work_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: sessionStatusEnum("status").default("recording").notNull(),
  totalWorkSeconds: integer("total_work_seconds").default(0).notNull(),
  totalActiveSeconds: integer("total_active_seconds").default(0).notNull(),
  deviceOs: varchar("device_os", { length: 50 }),
  deviceHostname: varchar("device_hostname", { length: 100 }),
  deviceIp: varchar("device_ip", { length: 45 }),
  memo: text("memo"),
  adminComment: text("admin_comment"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ActivityLog
export const activityLogs = pgTable("activity_logs", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  sessionId: uuid("session_id")
    .references(() => workSessions.id)
    .notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  keyboardCount: integer("keyboard_count").default(0).notNull(),
  keyPressCount: integer("key_press_count").default(0).notNull(),
  mouseClickCount: integer("mouse_click_count").default(0).notNull(),
  mouseDistance: integer("mouse_distance").default(0).notNull(),
  actionCount: integer("action_count").default(0).notNull(),
  isExcluded: boolean("is_excluded").default(false).notNull(),
  excludeReason: varchar("exclude_reason", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// WindowUsage
export const windowUsages = pgTable("window_usages", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  activityLogId: bigint("activity_log_id", { mode: "number" })
    .references(() => activityLogs.id)
    .notNull(),
  programName: varchar("program_name", { length: 100 }).notNull(),
  focusSeconds: integer("focus_seconds").notNull(),
});

// Screenshot
export const screenshots = pgTable("screenshots", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  sessionId: uuid("session_id")
    .references(() => workSessions.id)
    .notNull(),
  activityLogId: bigint("activity_log_id", { mode: "number" }).references(
    () => activityLogs.id
  ),
  capturedAt: timestamp("captured_at").notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Department (Enterprise only)
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  parentId: uuid("parent_id"),
  managerId: uuid("manager_id").references(() => users.id),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vacation (Enterprise only)
export const vacations = pgTable("vacations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  type: vacationTypeEnum("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: integer("days").notNull(), // 사용 일수 (반차는 0.5)
  reason: text("reason"),
  status: vacationStatusEnum("status").default("pending").notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// WorkPolicy (Enterprise only)
export const workPolicies = pgTable("work_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull()
    .unique(),
  // 기본 근무 시간
  workStartTime: varchar("work_start_time", { length: 5 }).default("09:00").notNull(),
  workEndTime: varchar("work_end_time", { length: 5 }).default("18:00").notNull(),
  // 유연근무제
  flexibleWorkEnabled: boolean("flexible_work_enabled").default(false).notNull(),
  coreTimeStart: varchar("core_time_start", { length: 5 }).default("10:00"),
  coreTimeEnd: varchar("core_time_end", { length: 5 }).default("16:00"),
  // 최소/최대 근무시간
  minDailyHours: integer("min_daily_hours").default(8).notNull(),
  maxDailyHours: integer("max_daily_hours").default(12).notNull(),
  // 연차 정책
  annualVacationDays: integer("annual_vacation_days").default(15).notNull(),
  // 기타 설정
  autoApproveEnabled: boolean("auto_approve_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many, one }) => ({
  users: many(users),
  departments: many(departments),
  workPolicy: one(workPolicies),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  workSessions: many(workSessions),
  vacations: many(vacations),
}));

export const departmentsRelations = relations(departments, ({ one }) => ({
  company: one(companies, {
    fields: [departments.companyId],
    references: [companies.id],
  }),
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
  }),
  manager: one(users, {
    fields: [departments.managerId],
    references: [users.id],
  }),
}));

export const vacationsRelations = relations(vacations, ({ one }) => ({
  user: one(users, {
    fields: [vacations.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [vacations.approvedBy],
    references: [users.id],
  }),
}));

export const workPoliciesRelations = relations(workPolicies, ({ one }) => ({
  company: one(companies, {
    fields: [workPolicies.companyId],
    references: [companies.id],
  }),
}));

export const workSessionsRelations = relations(
  workSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workSessions.userId],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [workSessions.approvedBy],
      references: [users.id],
    }),
    activityLogs: many(activityLogs),
    screenshots: many(screenshots),
  })
);

export const activityLogsRelations = relations(
  activityLogs,
  ({ one, many }) => ({
    session: one(workSessions, {
      fields: [activityLogs.sessionId],
      references: [workSessions.id],
    }),
    windowUsages: many(windowUsages),
    screenshots: many(screenshots),
  })
);

export const windowUsagesRelations = relations(windowUsages, ({ one }) => ({
  activityLog: one(activityLogs, {
    fields: [windowUsages.activityLogId],
    references: [activityLogs.id],
  }),
}));

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
  session: one(workSessions, {
    fields: [screenshots.sessionId],
    references: [workSessions.id],
  }),
  activityLog: one(activityLogs, {
    fields: [screenshots.activityLogId],
    references: [activityLogs.id],
  }),
}));

// Types
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WorkSession = typeof workSessions.$inferSelect;
export type NewWorkSession = typeof workSessions.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type WindowUsage = typeof windowUsages.$inferSelect;
export type NewWindowUsage = typeof windowUsages.$inferInsert;
export type Screenshot = typeof screenshots.$inferSelect;
export type NewScreenshot = typeof screenshots.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Vacation = typeof vacations.$inferSelect;
export type NewVacation = typeof vacations.$inferInsert;
export type WorkPolicy = typeof workPolicies.$inferSelect;
export type NewWorkPolicy = typeof workPolicies.$inferInsert;
