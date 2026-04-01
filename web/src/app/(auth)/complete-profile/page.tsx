import { AuthLayout } from "@/components/layout/AuthLayout";
import { AuthRouteGate } from "@/components/auth/AuthRouteGate";
import CompleteProfileForm from "@/components/feature/auth/CompleteProfileForm";

export default function CompleteProfilePage() {
  return (
    <AuthRouteGate mode="protected">
      <AuthLayout
        title="Complete Your Profile"
        subtitle="Set up your account details"
      >
        <CompleteProfileForm />
      </AuthLayout>
    </AuthRouteGate>
  );
}