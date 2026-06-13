import { ResourceManager } from "@/components/dashboard/resource-manager";
import { theoryModuleConfig } from "@/components/dashboard/resource-configs";

export default function TheoryPage() {
  return <ResourceManager config={theoryModuleConfig} />;
}
