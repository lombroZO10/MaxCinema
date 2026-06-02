"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { AdminMetric } from "@/services/admin-service";
import { cn } from "@/utils/cn";

const tones = {
  cyan: "from-cinema-cyan/24 text-cinema-cyan",
  amber: "from-cinema-amber/24 text-cinema-amber",
  emerald: "from-emerald-400/24 text-emerald-300",
  rose: "from-rose-400/24 text-rose-300",
  violet: "from-cinema-magenta/22 text-fuchsia-200",
};

export function AdminMetricCard({ metric, index }: { metric: AdminMetric; index: number }) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_70px_rgba(0,0,0,.28)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay: index * 0.035, duration: 0.38 }}
      whileHover={{ y: -4 }}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r via-white/40 to-transparent", tones[metric.tone])} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-white/45">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal text-white">{metric.value}</p>
        </div>
        <div className={cn("grid size-11 place-items-center rounded-lg bg-gradient-to-br to-white/5", tones[metric.tone])}>
          <Activity size={19} />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-cinema-muted">{metric.delta}</p>
    </motion.article>
  );
}
