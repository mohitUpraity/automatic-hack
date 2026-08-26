import { motion } from 'framer-motion';

export default function PageShell({ title, subtitle, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto p-6 lg:p-10 w-full"
    >
      <div className="flex items-center gap-4 mb-8">
        {Icon && (
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Icon className="w-8 h-8 text-indigo-400" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="w-full">{children}</div>
    </motion.div>
  );
}
