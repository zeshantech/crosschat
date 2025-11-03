"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = yup
  .object({
    email: yup.string().email("Enter a valid email").required("Email is required"),
  })
  .required();

type FormValues = yup.InferType<typeof schema>;

export function ResetPasswordForm() {
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
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Check your inbox for password reset instructions.");
    });
  });

  const isBusy = pending || isSubmitting;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
        <Input
          label="Email address"
          error={errors.email?.message}
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />

      <Button type="submit" className="w-full" loading={isBusy}>
        Send reset instructions
      </Button>
    </form>
  );
}
