"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

const phoneSchema = yup.object({
  phone: yup
    .string()
    .matches(/^\+\d{10,15}$/, "Use international format, e.g. +12025550123")
    .required("Phone number is required"),
  otp: yup.string().optional(),
});

const verifySchema = phoneSchema.shape({
  otp: yup
    .string()
    .length(6, "Enter the 6 digit code you received")
    .required("Verification code is required"),
});

export default function LoginPage() {
  const supabase = useSupabaseBrowserClient();
  const [stage, setStage] = useState<"phone" | "verify">("phone");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolver = useMemo(
    () => yupResolver(stage === "phone" ? phoneSchema : verifySchema),
    [stage]
  );

  const form = useForm({
    resolver,
    defaultValues: { phone: "", otp: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    if (stage === "phone") {
      const { error } = await supabase.auth.signInWithOtp({
        phone: values.phone,
        options: { channel: "sms" },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("We sent you a verification code.");
        setStage("verify");
      }
    } else {
      const { error } = await supabase.auth.verifyOtp({
        phone: values.phone,
        token: values.otp ?? "",
        type: "sms",
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Authentication successful. Redirecting…");
      }
    }
    setIsSubmitting(false);
  });

  const resendCode = async () => {
    const phone = form.getValues("phone");
    if (!phone) {
      toast.error("Enter your phone number first.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: "sms" },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("We resent the verification code.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-semibold">Sign in with phone</CardTitle>
          <CardDescription className="text-center">
            Enter your phone number to receive a WhatsApp-style verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="+12025550123"
                {...form.register("phone")}
                disabled={isSubmitting || stage === "verify"}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
            {stage === "verify" && (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  {...form.register("otp")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.otp && (
                  <p className="text-sm text-destructive">{form.formState.errors.otp.message}</p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {stage === "phone" ? "Send code" : "Verify code"}
            </Button>
          </form>
          {stage === "verify" && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Didn&apos;t receive it?</span>
              <button
                type="button"
                onClick={resendCode}
                className="font-medium text-primary outline-none hover:underline"
              >
                Resend SMS
              </button>
            </div>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/legal/terms" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
