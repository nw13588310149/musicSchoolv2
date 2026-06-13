import { ResourceManager } from "@/components/dashboard/resource-manager";
import { vocalModuleConfig } from "@/components/dashboard/resource-configs";

export default function VocalPage() {
  return <ResourceManager config={vocalModuleConfig} />;
}
