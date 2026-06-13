import { ResourceManager } from "@/components/dashboard/resource-manager";
import { sightSingingModuleConfig } from "@/components/dashboard/resource-configs";

export default function SightSingingPage() {
  return <ResourceManager config={sightSingingModuleConfig} />;
}
