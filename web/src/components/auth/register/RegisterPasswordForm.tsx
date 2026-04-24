import { Loader2, Lock, Mail, MapPin, UserPlus } from "lucide-react";
import {
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import {
  PASSWORD_VALIDATION_RULES,
  PASSWORD_MIN_LENGTH,
} from "@shared/lib/validation";

type RegisterFormValues = {
  email: string;
  password?: string;
  zip: string;
  acceptedPolicies: boolean;
};

interface RegisterPasswordFormProps {
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  register: UseFormRegister<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  watch: UseFormWatch<RegisterFormValues>;
  loading: boolean;
  emailRules: Record<string, unknown>;
  zipRules: Record<string, unknown>;
}

export function RegisterPasswordForm({
  onSubmit,
  register,
  errors,
  watch,
  loading,
  emailRules,
  zipRules,
}: RegisterPasswordFormProps) {
  const passwordValue = watch("password") ?? "";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label
          className="text-sm font-bold text-slate-700 ml-1"
          htmlFor="register-email"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 pl-11 rounded-xl"
            error={errors.email?.message}
            {...register("email", emailRules)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-bold text-slate-700 ml-1"
          htmlFor="register-password"
        >
          Password
        </label>
        <div className="relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-12 pl-11 rounded-xl"
            error={errors.password?.message}
            {...register("password", {
              required: "Enter a password.",
              minLength: {
                value: PASSWORD_MIN_LENGTH,
                message: PASSWORD_VALIDATION_RULES.message,
              },
            })}
          />
        </div>
        <PasswordStrengthMeter password={passwordValue} />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-bold text-slate-700 ml-1"
          htmlFor="register-zip"
        >
          Property ZIP Code
        </label>
        <div className="relative">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <Input
            id="register-zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            className="h-12 pl-11 rounded-xl"
            placeholder="For regional pricing"
            error={errors.zip?.message}
            {...register("zip", zipRules)}
          />
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        variant="primary"
        className="w-full h-14 font-black text-base shadow-xl shadow-teal-500/10"
        disabled={loading || !watch("acceptedPolicies")}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
        ) : (
          <UserPlus className="w-5 h-5 shrink-0" aria-hidden />
        )}
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
