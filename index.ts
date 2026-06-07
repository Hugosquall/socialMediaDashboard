import { config } from "dotenv";
import { streamText } from "ai";

config({ path: ".env.local" });

const prompt =
  process.argv.slice(2).join(" ") ||
  "Explique em uma frase como o AI Gateway ajuda um app de content intelligence.";

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error(
      "Missing AI Gateway credentials. Set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN in .env.local.",
    );
  }

  const result = streamText({
    model: "openai/gpt-5.4",
    prompt,
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  const [finishReason, totalUsage] = await Promise.all([
    result.finishReason,
    result.totalUsage,
  ]);

  process.stdout.write("\n\n");
  console.log("Finish reason:", finishReason);
  console.log("Token usage:", {
    inputTokens: totalUsage.inputTokens,
    outputTokens: totalUsage.outputTokens,
    totalTokens: totalUsage.totalTokens,
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
