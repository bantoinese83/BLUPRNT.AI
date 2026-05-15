import { Loader2, Mail, MapPin, Wand2 } from "lucide-react";
import {
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RegisterFormValues = {
  email: string;
  password?: string;
  zip: string;
  acceptedPolicies: boolean;
};

interface RegisterMagicFormProps {
  onMagicRegister: () => Promise<void>;
  register: UseFormRegister<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  watch: UseFormWatch<RegisterFormValues>;
  loading: boolean;
  magicSent: boolean;
  setMagicSent: (sent: boolean) => void;
  emailValue: string;
}

export function RegisterMagicForm({
  onMagicRegister,
  register,
  errors,
  watch,
  loading,
  magicSent,
  setMagicSent,
  emailValue,
}: RegisterMagicFormProps) {
  if (magicSent) {
    return (
      <div className="rounded-2xl border border-teal-100 bg-teal-50/30 px-5 py-5 text-sm text-slate-900 space-y-3">
        <p className="font-black flex items-center gap-2 text-teal-900 uppercase tracking-wider text-xs">
          <Mail className="w-4 h-4 shrink-0" aria-hidden />
          Check your inbox
        </p>
        <p className="font-medium text-slate-600">
          We sent a sign-in link to{" "}
          <strong className="text-slate-900">{emailValue.trim()}</strong>. Open
          it on this device to create your account.
        </p>
        <button
          type="button"
          className="text-teal-600 font-bold hover:text-teal-500 text-sm transition-colors"
          onClick={() => setMagicSent(false)}
        >
          ← Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onMagicRegister();
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <label
          className="text-sm font-bold text-slate-700 ml-1"
          htmlFor="magic-email"
        >
          Email address
        </label>
        <div className="relative">
          <Mail
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <Input
            id="magic-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 pl-11 rounded-xl"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-bold text-slate-700 ml-1"
          htmlFor="magic-zip"
        >
          Property ZIP Code
        </label>
        <div className="relative">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <Input
            id="magic-zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            className="h-12 pl-11 rounded-xl"
            placeholder="For regional pricing"
            error={errors.zip?.message}
            {...register("zip")}
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
          <Wand2 className="w-5 h-5 shrink-0" aria-hidden />
        )}
        {loading ? "Sending…" : "Email me a magic link"}
      </Button>
    </form>
  );
}
