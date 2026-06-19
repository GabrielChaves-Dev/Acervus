import Database from "better-sqlite3";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { books, libraryMembers, loans, users } from "../drizzle/schema";
import type { InsertBook, InsertLibraryMember, InsertLoan, InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { seed } from "./seed";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;

export function getDb() {
  if (!_db) {
    const dbPath = ENV.databaseUrl || (process.env.VERCEL
      ? "/tmp/biblioteca.db"
      : path.resolve(process.cwd(), "data/biblioteca.db"));
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    _sqlite = new Database(dbPath);
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("foreign_keys = ON");
    _db = drizzle(_sqlite);
    runMigrations();
    seedIfEmpty();
  }
  return _db;
}

function runMigrations() {
  if (!_sqlite) return;
  _sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "openId" TEXT NOT NULL UNIQUE,
      "name" TEXT,
      "email" TEXT,
      "loginMethod" TEXT,
      "role" TEXT NOT NULL DEFAULT 'user',
      "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
      "lastSignedIn" TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "title" TEXT NOT NULL,
      "author" TEXT NOT NULL,
      "isbn" TEXT UNIQUE,
      "category" TEXT,
      "publishYear" INTEGER,
      "totalCopies" INTEGER NOT NULL DEFAULT 1,
      "availableCopies" INTEGER NOT NULL DEFAULT 1,
      "description" TEXT,
      "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS library_members (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "matricula" TEXT UNIQUE,
      "email" TEXT UNIQUE,
      "phone" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loans (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "memberId" INTEGER NOT NULL,
      "bookId" INTEGER NOT NULL,
      "loanDate" TEXT NOT NULL DEFAULT (datetime('now')),
      "dueDate" TEXT NOT NULL,
      "returnDate" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "notes" TEXT,
      "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedIfEmpty() {
  if (!_sqlite) return;
  const row = _sqlite.prepare("SELECT COUNT(*) as c FROM books").get() as { c: number };
  if (row.c === 0) {
    seed(_sqlite);
  }
}

function nowISO() {
  return new Date().toISOString();
}

// ─── Auth Users ──────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: Record<string, unknown> = { openId: user.openId };
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) values.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined) values.role = user.role;
    else if (user.openId === ENV.ownerOpenId) values.role = "admin";
    if (!values.lastSignedIn) values.lastSignedIn = nowISO();
    await db.insert(users).values(values as InsertUser).onConflictDoUpdate({ target: users.openId, set: values as Partial<InsertUser> });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Books ───────────────────────────────────────────────────────────────────
export async function listBooks(search?: string) {
  const db = getDb();
  if (!db) return [];
  if (search) {
    const q = `%${search}%`;
    return db.select().from(books).where(
      or(like(books.title, q), like(books.author, q), like(books.isbn, q), like(books.category, q))
    ).orderBy(desc(books.createdAt));
  }
  return db.select().from(books).orderBy(desc(books.createdAt));
}

export async function getBookById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return result[0];
}

export async function createBook(data: Omit<InsertBook, "id" | "createdAt" | "updatedAt">) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(books).values({ ...data, availableCopies: data.availableCopies ?? data.totalCopies });
  const result = await db.select().from(books).orderBy(desc(books.createdAt)).limit(1);
  return result[0];
}

export async function updateBook(id: number, data: Partial<Omit<InsertBook, "id" | "createdAt" | "updatedAt">>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(books).set({ ...data, updatedAt: nowISO() }).where(eq(books.id, id));
  return getBookById(id);
}

export async function deleteBook(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(books).where(eq(books.id, id));
}

// ─── Library Members ─────────────────────────────────────────────────────────
export async function listMembers(search?: string) {
  const db = getDb();
  if (!db) return [];
  if (search) {
    const q = `%${search}%`;
    return db.select().from(libraryMembers).where(
      or(like(libraryMembers.name, q), like(libraryMembers.email, q), like(libraryMembers.matricula, q), like(libraryMembers.phone, q))
    ).orderBy(desc(libraryMembers.createdAt));
  }
  return db.select().from(libraryMembers).orderBy(desc(libraryMembers.createdAt));
}

export async function getMemberById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(libraryMembers).where(eq(libraryMembers.id, id)).limit(1);
  return result[0];
}

export async function createMember(data: Omit<InsertLibraryMember, "id" | "createdAt" | "updatedAt">) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(libraryMembers).values(data);
  const result = await db.select().from(libraryMembers).orderBy(desc(libraryMembers.createdAt)).limit(1);
  return result[0];
}

export async function updateMember(id: number, data: Partial<Omit<InsertLibraryMember, "id" | "createdAt" | "updatedAt">>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(libraryMembers).set({ ...data, updatedAt: nowISO() }).where(eq(libraryMembers.id, id));
  return getMemberById(id);
}

export async function deleteMember(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(libraryMembers).where(eq(libraryMembers.id, id));
}

// ─── Loans ───────────────────────────────────────────────────────────────────
export async function listLoans(status?: "active" | "returned" | "overdue") {
  const db = getDb();
  if (!db) return [];
  await markOverdueLoans();
  const query = db.select({
    id: loans.id,
    memberId: loans.memberId,
    bookId: loans.bookId,
    loanDate: loans.loanDate,
    dueDate: loans.dueDate,
    returnDate: loans.returnDate,
    status: loans.status,
    notes: loans.notes,
    createdAt: loans.createdAt,
    updatedAt: loans.updatedAt,
    memberName: libraryMembers.name,
    memberMatricula: libraryMembers.matricula,
    bookTitle: books.title,
    bookAuthor: books.author,
    bookIsbn: books.isbn,
  }).from(loans)
    .leftJoin(libraryMembers, eq(loans.memberId, libraryMembers.id))
    .leftJoin(books, eq(loans.bookId, books.id))
    .orderBy(desc(loans.createdAt));
  if (status) {
    return query.where(eq(loans.status, status));
  }
  return query;
}

export async function getLoanById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: loans.id,
    memberId: loans.memberId,
    bookId: loans.bookId,
    loanDate: loans.loanDate,
    dueDate: loans.dueDate,
    returnDate: loans.returnDate,
    status: loans.status,
    notes: loans.notes,
    createdAt: loans.createdAt,
    updatedAt: loans.updatedAt,
    memberName: libraryMembers.name,
    memberMatricula: libraryMembers.matricula,
    bookTitle: books.title,
    bookAuthor: books.author,
    bookIsbn: books.isbn,
  }).from(loans)
    .leftJoin(libraryMembers, eq(loans.memberId, libraryMembers.id))
    .leftJoin(books, eq(loans.bookId, books.id))
    .where(eq(loans.id, id))
    .limit(1);
  return result[0];
}

export async function createLoan(data: { memberId: number; bookId: number; dueDate: Date; notes?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(books).set({ availableCopies: sql`availableCopies - 1` }).where(and(eq(books.id, data.bookId), sql`availableCopies > 0`));
  await db.insert(loans).values({ ...data, dueDate: data.dueDate.toISOString(), status: "active", loanDate: nowISO() });
  const result = await db.select().from(loans).orderBy(desc(loans.createdAt)).limit(1);
  return result[0];
}

export async function registerReturn(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const loan = await getLoanById(id);
  if (!loan) throw new Error("Loan not found");
  await db.update(loans).set({ status: "returned", returnDate: nowISO() }).where(eq(loans.id, id));
  await db.update(books).set({ availableCopies: sql`availableCopies + 1` }).where(eq(books.id, loan.bookId));
  return getLoanById(id);
}

export async function updateLoan(id: number, data: Partial<{ dueDate: Date; notes: string; status: "active" | "returned" | "overdue" }>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const setData: Record<string, unknown> = { ...data, updatedAt: nowISO() };
  if (data.dueDate) setData.dueDate = data.dueDate.toISOString();
  await db.update(loans).set(setData).where(eq(loans.id, id));
  return getLoanById(id);
}

export async function deleteLoan(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const loan = await getLoanById(id);
  if (loan && loan.status === "active") {
    await db.update(books).set({ availableCopies: sql`availableCopies + 1` }).where(eq(books.id, loan.bookId));
  }
  await db.delete(loans).where(eq(loans.id, id));
}

export async function markOverdueLoans() {
  const db = getDb();
  if (!db) return;
  const now = nowISO();
  await db.update(loans).set({ status: "overdue" }).where(
    and(eq(loans.status, "active"), sql`"dueDate" < ${now}`)
  );
}

export async function getDashboardStats() {
  const db = getDb();
  if (!db) return { totalBooks: 0, totalMembers: 0, activeLoans: 0, overdueLoans: 0 };
  await markOverdueLoans();
  const [booksCount] = await db.select({ count: sql<number>`count(*)` }).from(books);
  const [membersCount] = await db.select({ count: sql<number>`count(*)` }).from(libraryMembers).where(eq(libraryMembers.status, "active"));
  const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(loans).where(eq(loans.status, "active"));
  const [overdueCount] = await db.select({ count: sql<number>`count(*)` }).from(loans).where(eq(loans.status, "overdue"));
  return {
    totalBooks: Number(booksCount?.count ?? 0),
    totalMembers: Number(membersCount?.count ?? 0),
    activeLoans: Number(activeCount?.count ?? 0),
    overdueLoans: Number(overdueCount?.count ?? 0),
  };
}

export async function getTopBorrowedBooks(limit = 5) {
  const db = getDb();
  if (!db) return [];
  return db.select({
    bookId: loans.bookId,
    title: books.title,
    author: books.author,
    count: sql<number>`count(*) as "count"`,
  }).from(loans)
    .leftJoin(books, eq(loans.bookId, books.id))
    .groupBy(loans.bookId, books.title, books.author)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getRecentActivity(limit = 10) {
  const db = getDb();
  if (!db) return [];
  return db.select({
    id: loans.id,
    type: loans.status,
    loanDate: loans.loanDate,
    returnDate: loans.returnDate,
    memberName: libraryMembers.name,
    bookTitle: books.title,
    status: loans.status,
  }).from(loans)
    .leftJoin(libraryMembers, eq(loans.memberId, libraryMembers.id))
    .leftJoin(books, eq(loans.bookId, books.id))
    .orderBy(desc(loans.updatedAt))
    .limit(limit);
}
