import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import EventPageClient from "./EventPageClient";

type Props = {
  params: Promise<{ slug: string }>;
};

const DEFAULT_DESCRIPTION =
  "그룹 일정 조율 도구. 되는 시간을 표시하고 모두가 만날 수 있는 최적의 시간을 찾아보세요.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  if (!event) {
    return { title: "약속을 찾을 수 없습니다 - 언제되니" };
  }

  const description = event.description || DEFAULT_DESCRIPTION;

  return {
    title: `${event.title} - 언제되니`,
    description,
    openGraph: {
      title: event.title,
      description,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  return <EventPageClient slug={slug} />;
}
