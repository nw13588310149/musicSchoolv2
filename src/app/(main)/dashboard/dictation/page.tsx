import { ResourceManager } from "@/components/dashboard/resource-manager";
import { dictationModuleConfig } from "@/components/dashboard/resource-configs";

export default function DictationPage() {
  return <ResourceManager config={dictationModuleConfig} />;
}
