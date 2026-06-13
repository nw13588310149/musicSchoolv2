import { ResourceManager } from "@/components/dashboard/resource-manager";
import { answerModuleConfig } from "@/components/dashboard/resource-configs";

export default function AnswerPage() {
  return <ResourceManager config={answerModuleConfig} />;
}
