import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account Created</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-foreground">
                Thank you for signing up! Please check your email to verify your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Click the confirmation link in the email we sent to activate your shop.
              </p>
            </div>

            <Button asChild className="w-full">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
