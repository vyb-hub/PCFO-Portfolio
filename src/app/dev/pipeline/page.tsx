import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db/prisma";
import { createDefaultPipeline } from "@/lib/finance/pipeline";
import { PipelineInspector } from "@/components/pipeline/PipelineInspector";

export default async function PipelineInspectorPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  let data: unknown = null;
  let error: string | null = null;

  try {
    const pipeline = createDefaultPipeline(db);
    const result = await pipeline.run(userId);
    data = JSON.parse(
      JSON.stringify(result, (_key, value: unknown) =>
        value instanceof Date ? value.toISOString() : value,
      ),
    );
  } catch (err) {
    error = err instanceof Error ? err.message : "Pipeline failed";
  }

  return <PipelineInspector data={data} error={error} />;
}
