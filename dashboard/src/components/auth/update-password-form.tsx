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
  })
  .required();

type FormValues = yup.InferType<typeof schema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated. Sign in with your new credentials.");
      router.push("/auth/login");
    });
  });

  const isBusy = pending || isSubmitting;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Input
        label="New password"
        error={errors.password?.message}
        id="password"
        type="password"
        {...register("password")}
      />

      <Input
        label="Confirm new password"
        error={errors.confirmPassword?.message}
        id="confirmPassword"
        type="password"
        {...register("confirmPassword")}
      />

      <Button type="submit" className="w-full" loading={isBusy}>
        Update password
      </Button>
    </form>
  );
}
