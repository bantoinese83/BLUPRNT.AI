import { motion } from "motion/react";

interface PasswordStrengthMeterProps {
  password: string;
}

function getStrength(password: string): {
  score: number;
  label: string;
  color: string;
  tips: string[];
} {
  const tips: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else tips.push("Use at least 8 characters");

  if (password.length >= 12) score++;
  else if (password.length >= 8)
    tips.push("Use 12+ characters for extra safety");

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else tips.push("Mix uppercase and lowercase");

  if (/\d/.test(password)) score++;
  else tips.push("Add a number");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else tips.push("Add a symbol (!@#$…)");

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: "Too short", color: "bg-slate-200" },
    1: { label: "Weak", color: "bg-red-500" },
    2: { label: "Fair", color: "bg-amber-500" },
    3: { label: "Good", color: "bg-amber-400" },
    4: { label: "Strong", color: "bg-emerald-500" },
    5: { label: "Very strong", color: "bg-emerald-600" },
  };

  const { label, color } = labels[score];
  return { score, label, color, tips: tips.slice(0, 2) };
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, color, tips } = getStrength(password);
  const percentage = (score / 5) * 100;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-widest ${
            score <= 1
              ? "text-red-600"
              : score <= 3
                ? "text-amber-600"
                : "text-emerald-600"
          }`}
        >
          {label}
        </span>
      </div>
      {tips.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {tips.map((tip) => (
            <span
              key={tip}
              className="text-[11px] text-slate-500 font-medium before:content-['•'] before:mr-1 before:text-slate-300"
            >
              {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
