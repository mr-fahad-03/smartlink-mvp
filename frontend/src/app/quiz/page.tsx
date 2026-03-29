import { QuizFlow } from "@/components/quiz";

interface QuizPageProps {
  searchParams: Promise<{
    situation?: string;
    audience?: string;
  }>;
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;

  return <QuizFlow initialSituation={params.situation} initialAudience={params.audience} />;
}
