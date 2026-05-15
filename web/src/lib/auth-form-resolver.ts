import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordFormSchema,
  loginMagicFormSchema,
  loginPasswordFormSchema,
  marketingLeadFormSchema,
  registerMagicFormSchema,
  registerPasswordFormSchema,
} from "@shared/lib/validation";

type AuthMode = "password" | "magic";

const loginPasswordResolver = zodResolver(loginPasswordFormSchema);
const loginMagicResolver = zodResolver(loginMagicFormSchema);
const registerPasswordResolver = zodResolver(registerPasswordFormSchema);
const registerMagicResolver = zodResolver(registerMagicFormSchema);
export const forgotPasswordResolver = zodResolver(forgotPasswordFormSchema);
export const marketingLeadResolver = zodResolver(marketingLeadFormSchema);

export function loginResolverForMode(mode: AuthMode) {
  return mode === "password" ? loginPasswordResolver : loginMagicResolver;
}

export function registerResolverForMode(mode: AuthMode) {
  return mode === "password" ? registerPasswordResolver : registerMagicResolver;
}
