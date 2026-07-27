import { Card } from "../components/Card";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";

export function AccountPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Account"
        description="This page provides a clean placeholder for user profile, role configuration, and account preferences."
        title="Account"
      />
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-text-secondary">Name</p>
            <p className="mt-1 font-semibold text-text-primary">Operations Manager</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Email</p>
            <p className="mt-1 font-semibold text-text-primary">smartfm.ops@company.com</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Role</p>
            <p className="mt-1 font-semibold text-text-primary">Logistics Administrator</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Workspace</p>
            <p className="mt-1 font-semibold text-text-primary">Smart Freight Management Platform</p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}

