import { prisma } from "@/lib/db";
import Link from "next/link";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  BRIEFING: "bg-yellow-200 border-yellow-400 text-yellow-800",
  GENERATING: "bg-purple-200 border-purple-400 text-purple-800",
  DRAFT: "bg-gray-200 border-gray-400 text-gray-800",
  REVIEW: "bg-orange-200 border-orange-400 text-orange-800",
  APPROVED: "bg-blue-200 border-blue-400 text-blue-800",
  SCHEDULED: "bg-indigo-200 border-indigo-400 text-indigo-800",
  PUBLISHED: "bg-green-200 border-green-400 text-green-800"
};

export default async function CalendarioPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year || String(now.getFullYear()));
  const month = parseInt(params.month || String(now.getMonth() + 1));

  // Get first and last day of month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Get posts for this month (scheduled or published)
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        {
          scheduledAt: {
            gte: firstDay,
            lte: lastDay
          }
        },
        {
          publishedAt: {
            gte: firstDay,
            lte: lastDay
          },
          status: "PUBLISHED"
        }
      ]
    },
    orderBy: { scheduledAt: "asc" },
    include: { category: true }
  });

  // Group posts by day
  const postsByDay: Record<number, typeof posts> = {};
  posts.forEach((post) => {
    const date = post.status === "PUBLISHED" && post.publishedAt
      ? new Date(post.publishedAt)
      : post.scheduledAt
        ? new Date(post.scheduledAt)
        : null;
    
    if (date) {
      const day = date.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(post);
    }
  });

  // Calendar calculations
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday
  const weeks: number[][] = [];
  let currentWeek: number[] = [];

  // Fill initial empty days
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(0);
  }

  // Fill days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(0);
    }
    weeks.push(currentWeek);
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const today = now.getDate();
  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário Editorial</h1>
          <p className="text-gray-500">Visualize e gerencie suas publicações</p>
        </div>
        <Link
          href="/gestor/posts/nova-pauta"
          className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          + Nova Pauta
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <Link
            href={`/gestor/calendario?month=${prevMonth}&year=${prevYear}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </Link>
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[month - 1]} {year}
          </h2>
          <Link
            href={`/gestor/calendario?month=${nextMonth}&year=${nextYear}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </Link>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Header */}
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b bg-gray-50">
              {day}
            </div>
          ))}

          {/* Days */}
          {weeks.map((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const dayPosts = day > 0 ? postsByDay[day] || [] : [];
              const isToday = isCurrentMonth && day === today;

              return (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={`min-h-[120px] border-b border-r p-2 ${
                    day === 0 ? "bg-gray-50" : ""
                  } ${isToday ? "bg-blue-50" : ""}`}
                >
                  {day > 0 && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? "text-blue-600" : "text-gray-700"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map((post) => (
                          <Link
                            key={post.id}
                            href={`/gestor/posts/${post.id}/editar`}
                            className={`block text-xs p-1.5 rounded border truncate ${
                              statusColors[post.status] || "bg-gray-100"
                            }`}
                          >
                            {post.title}
                          </Link>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-xs text-gray-500 pl-1">
                            +{dayPosts.length - 3} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="text-sm text-gray-600">Legenda:</div>
        {[
          { status: "SCHEDULED", label: "Agendado" },
          { status: "PUBLISHED", label: "Publicado" },
          { status: "REVIEW", label: "Em Revisão" },
          { status: "DRAFT", label: "Rascunho" }
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded border ${statusColors[status]}`} />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
