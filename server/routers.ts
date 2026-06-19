import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createBook, createLoan, createMember, deleteBook, deleteLoan, deleteMember,
  getDashboardStats, getRecentActivity, getTopBorrowedBooks,
  listBooks, listLoans, listMembers, markOverdueLoans,
  registerReturn, updateBook, updateLoan, updateMember,
  getLoanById, getBookById, getMemberById,
} from "./db";

// ─── Books Router ─────────────────────────────────────────────────────────────
const booksRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(({ input }) => listBooks(input?.search)),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBookById(input.id)),

  create: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      isbn: z.string().optional(),
      category: z.string().optional(),
      publishYear: z.number().int().optional(),
      totalCopies: z.number().int().min(1).default(1),
      availableCopies: z.number().int().min(0).optional(),
      description: z.string().optional(),
    }))
    .mutation(({ input }) => createBook(input)),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      author: z.string().min(1).optional(),
      isbn: z.string().optional(),
      category: z.string().optional(),
      publishYear: z.number().int().optional(),
      totalCopies: z.number().int().min(1).optional(),
      availableCopies: z.number().int().min(0).optional(),
      description: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateBook(id, data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBook(input.id)),
});

// ─── Members Router ───────────────────────────────────────────────────────────
const membersRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(({ input }) => listMembers(input?.search)),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMemberById(input.id)),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      matricula: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      status: z.enum(["active", "inactive"]).default("active"),
    }))
    .mutation(({ input }) => createMember(input)),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      matricula: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateMember(id, data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMember(input.id)),
});

// ─── Loans Router ─────────────────────────────────────────────────────────────
const loansRouter = router({
  list: publicProcedure
    .input(z.object({ status: z.enum(["active", "returned", "overdue"]).optional() }).optional())
    .query(async ({ input }) => {
      await markOverdueLoans();
      return listLoans(input?.status);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getLoanById(input.id)),

  create: publicProcedure
    .input(z.object({
      memberId: z.number(),
      bookId: z.number(),
      dueDate: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createLoan(input)),

  registerReturn: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => registerReturn(input.id)),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      dueDate: z.date().optional(),
      notes: z.string().optional(),
      status: z.enum(["active", "returned", "overdue"]).optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateLoan(id, data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteLoan(input.id)),
});

// ─── Dashboard Router ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: publicProcedure.query(() => getDashboardStats()),
  topBooks: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }).optional())
    .query(({ input }) => getTopBorrowedBooks(input?.limit)),
  recentActivity: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }).optional())
    .query(({ input }) => getRecentActivity(input?.limit)),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  books: booksRouter,
  members: membersRouter,
  loans: loansRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
