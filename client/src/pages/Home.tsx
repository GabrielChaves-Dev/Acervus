import { motion } from "framer-motion";
import { BookOpen, Users, BookMarked, AlertTriangle, TrendingUp, Clock, CheckCircle, Activity, PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } } as const,
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } as const,
};

const STAT_CARDS = [
  { key: "totalBooks", label: "Total de Livros", icon: BookOpen, gradient: "gradient-green", accent: "stat-card-green", desc: "acervo cadastrado" },
  { key: "totalMembers", label: "Usuários Ativos", icon: Users, gradient: "gradient-blue", accent: "stat-card-blue", desc: "membros registrados" },
  { key: "activeLoans", label: "Empréstimos Ativos", icon: BookMarked, gradient: "gradient-yellow", accent: "stat-card-yellow", desc: "em andamento" },
  { key: "overdueLoans", label: "Empréstimos Atrasados", icon: AlertTriangle, gradient: "gradient-red", accent: "stat-card-red", desc: "requer atenção" },
];

function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-active",
    returned: "badge-returned",
    overdue: "badge-overdue",
  };
  const labels: Record<string, string> = {
    active: "Ativo",
    returned: "Devolvido",
    overdue: "Atrasado",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "badge-inactive"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: topBooks, isLoading: topBooksLoading } = trpc.dashboard.topBooks.useQuery({ limit: 5 });
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery({ limit: 8 });

  const statValues: Record<string, number> = {
    totalBooks: stats?.totalBooks ?? 0,
    totalMembers: stats?.totalMembers ?? 0,
    activeLoans: stats?.activeLoans ?? 0,
    overdueLoans: stats?.overdueLoans ?? 0,
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-4 lg:p-6 pb-20 lg:pb-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
          <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground mt-1">Resumo do sistema de biblioteca acadêmica</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, gradient, accent, desc }) => (
            <motion.div key={key} variants={item}>
              {statsLoading ? (
                <StatCardSkeleton />
              ) : (
                <div className={`glass-card p-5 ${accent} hover:shadow-lg transition-shadow duration-200`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <div className={`w-8 h-8 rounded-lg ${gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{statValues[key]}</p>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Loan Status Chart + Bottom grid */}
        {!statsLoading && stats && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg gradient-yellow flex items-center justify-center">
                  <PieIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Distribuição de Empréstimos</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Ativos", value: stats.activeLoans, color: "#0F7A3E" },
                        { name: "Atrasados", value: stats.overdueLoans, color: "#ef4444" },
                        { name: "Devolvidos", value: Math.max(0, (stats.activeLoans + stats.overdueLoans) > 0 ? 14 - stats.activeLoans - stats.overdueLoans : 0), color: "#0077C8" },
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      paddingAngle={3} dataKey="value"
                    >
                      {["#0F7A3E", "#ef4444", "#0077C8"].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-700 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Ativos</span>
                    <span className="ml-auto text-sm font-bold text-foreground">{stats.activeLoans}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Atrasados</span>
                    <span className="ml-auto text-sm font-bold text-foreground">{stats.overdueLoans}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Devolvidos</span>
                    <span className="ml-auto text-sm font-bold text-foreground">{Math.max(0, 14 - stats.activeLoans - stats.overdueLoans)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Borrowed Books */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg gradient-green flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Livros Mais Emprestados</h3>
              </div>
              {topBooksLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : topBooks && topBooks.length > 0 ? (
                <div className="space-y-2">
                  {topBooks.map((book, i) => (
                    <motion.div
                      key={book.bookId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.3, ease: "easeOut" }}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{book.title ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{book.author ?? "—"}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0 text-xs">
                        {Number(book.count)} empréstimos
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum empréstimo registrado ainda</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Atividade Recente</h3>
              </div>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="space-y-2">
                  {activity.map((act, i) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 + 0.3, ease: "easeOut" }}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        act.status === "returned" ? "bg-blue-100" : act.status === "overdue" ? "bg-red-100" : "bg-green-100"
                      }`}>
                        {act.status === "returned" ? (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                        ) : act.status === "overdue" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {act.memberName ?? "—"} — <span className="font-normal text-muted-foreground">{act.bookTitle ?? "—"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {act.status === "returned" && act.returnDate
                            ? `Devolvido em ${new Date(act.returnDate).toLocaleDateString("pt-BR")}`
                            : `Emprestado em ${new Date(act.loanDate).toLocaleDateString("pt-BR")}`}
                        </p>
                      </div>
                      <StatusBadge status={act.status} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
