import { ResourceManager } from "@/components/dashboard/resource-manager";
import { instrumentalModuleConfig } from "@/components/dashboard/resource-configs";

export default function InstrumentalPage() {
  return <ResourceManager config={instrumentalModuleConfig} />;
}
