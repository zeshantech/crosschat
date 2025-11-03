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
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = yup
  .object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),
    password: yup
      .string()
      .min(6, "Minimum 6 characters")
      .required("Password is required"),
    remember: yup.boolean().default(true),
  })
  .required();

type FormValues = yup.InferType<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      remember: true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Welcome back! Redirecting to your dashboard.");
      router.push("/dashboard");
      router.refresh();
    });
  });

  const isBusy = pending || isSubmitting;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Input
        id="email"
        label="Email address"
        error={errors.email?.message}
        type="email"
        autoComplete="email"
        {...register("email")}
      />

      <Input
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" className="w-full" loading={isBusy}>
        Sign in
      </Button>
    </form>
  );
}
