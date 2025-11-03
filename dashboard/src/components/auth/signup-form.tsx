"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = yup
  .object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),
    password: yup
      .string()
      .min(8, "Minimum 8 characters")
      .matches(/[A-Z]/, "Include an uppercase letter")
      .matches(/[0-9]/, "Include a number")
      .required("Password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Confirm your password"),
    fullName: yup.string().required("Your name helps personalize the console"),
    acceptTerms: yup.boolean().oneOf([true], "You must accept the terms"),
  })
  .required();

type FormValues = yup.InferType<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      acceptTerms: false,
    },
  });

  const acceptedTerms = watch("acceptTerms");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created! Confirm the email we just sent you.");
      router.push("/auth/login");
    });
  });

  const isBusy = pending || isSubmitting;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Input
        id="fullName"
        autoComplete="name"
        label="Full name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <Input
        label="Email address"
        error={errors.email?.message}
        id="email"
        type="email"
        autoComplete="email"
        {...register("email")}
      />

      <Input
        id="password"
        type="password"
        autoComplete="new-password"
        label="Password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        id="confirmPassword"
        type="password"
        autoComplete="new-password"
        label="Confirm password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <label className="flex items-center space-x-2 text-sm">
        <Checkbox
          id="acceptTerms"
          checked={acceptedTerms}
          onCheckedChange={(checked) =>
            setValue("acceptTerms", Boolean(checked), {
              shouldValidate: true,
            })
          }
        />
        <span>
          I agree to the{" "}
          <a className="underline" href="/legal/terms">
            terms
          </a>{" "}
          and
          <a className="underline ml-1" href="/legal/privacy">
            privacy policy
          </a>
        </span>
      </label>
      {errors.acceptTerms && (
        <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
      )}

      <Button type="submit" className="w-full" loading={isBusy}>
        Create account
      </Button>
    </form>
  );
}
