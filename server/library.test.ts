import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "test-user", email: "test@test.com", name: "Test",
        loginMethod: "oauth", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => { cleared.push(name); } } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(cleared).toHaveLength(1);
  });
});

describe("books router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.books.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list with search returns filtered array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.books.list({ search: "Cálculo" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("members router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.members.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("loans router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.loans.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list with status filter returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.loans.list({ status: "active" });
    expect(Array.isArray(result)).toBe(true);
    result.forEach(l => expect(l.status).toBe("active"));
  });
});

describe("dashboard router", () => {
  it("stats returns numeric counts", async () => {
    const caller = appRouter.createCaller(createCtx());
    const stats = await caller.dashboard.stats();
    expect(typeof stats.totalBooks).toBe("number");
    expect(typeof stats.totalMembers).toBe("number");
    expect(typeof stats.activeLoans).toBe("number");
    expect(typeof stats.overdueLoans).toBe("number");
    expect(stats.totalBooks).toBeGreaterThanOrEqual(0);
  });

  it("topBooks returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const top = await caller.dashboard.topBooks({ limit: 5 });
    expect(Array.isArray(top)).toBe(true);
  });

  it("recentActivity returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const activity = await caller.dashboard.recentActivity({ limit: 10 });
    expect(Array.isArray(activity)).toBe(true);
  });
});
