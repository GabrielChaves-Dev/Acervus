import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: text("email", { length: 320 }),
  loginMethod: text("loginMethod", { length: 64 }),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP").notNull(),
  lastSignedIn: text("lastSignedIn").default("CURRENT_TIMESTAMP").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title", { length: 255 }).notNull(),
  author: text("author", { length: 255 }).notNull(),
  isbn: text("isbn", { length: 20 }).unique(),
  category: text("category", { length: 100 }),
  publishYear: integer("publishYear"),
  totalCopies: integer("totalCopies").notNull().default(1),
  availableCopies: integer("availableCopies").notNull().default(1),
  description: text("description"),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP").notNull(),
});

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

export const libraryMembers = sqliteTable("library_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).notNull(),
  matricula: text("matricula", { length: 50 }).unique(),
  email: text("email", { length: 320 }).unique(),
  phone: text("phone", { length: 30 }),
  status: text("status", { enum: ["active", "inactive"] }).default("active").notNull(),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP").notNull(),
});

export type LibraryMember = typeof libraryMembers.$inferSelect;
export type InsertLibraryMember = typeof libraryMembers.$inferInsert;

export const loans = sqliteTable("loans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("memberId").notNull(),
  bookId: integer("bookId").notNull(),
  loanDate: text("loanDate").default("CURRENT_TIMESTAMP").notNull(),
  dueDate: text("dueDate").notNull(),
  returnDate: text("returnDate"),
  status: text("status", { enum: ["active", "returned", "overdue"] }).default("active").notNull(),
  notes: text("notes"),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP").notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;
