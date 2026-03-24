import { QuizFlow } from "@/components/quiz";

interface QuizPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;

  return <QuizFlow initialCategory={params.category} />;
}
