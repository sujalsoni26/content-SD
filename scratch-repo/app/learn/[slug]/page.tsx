import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { LessonLayout } from "@/components/learning/lesson-layout";
import { getLesson, lessons } from "@/lib/curriculum";
import { getLessonHeadings } from "@/lib/lesson-headings";

interface LessonPageProps {
  params: Promise<{ slug: string }>;
}

/** All 42 lessons are prerendered at build time; any other slug renders the 404 page. */
export function generateStaticParams() {
  return lessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return lesson ? { title: lesson.title, description: lesson.summary } : {};
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  const { default: Content } = (await import(`@/content/lessons/${slug}.mdx`)) as { default: ComponentType };
  return (
    <LessonLayout lesson={lesson} headings={getLessonHeadings(slug)}>
      <Content />
    </LessonLayout>
  );
}
