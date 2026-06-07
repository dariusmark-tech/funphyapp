import { createFileRoute } from "@tanstack/react-router";
import { LessonAssessment } from "@/components/lesson-assessment";

export const Route = createFileRoute("/_app/lessons/$id/assessment")({
  component: AssessmentRoute,
});

function AssessmentRoute() {
  const { id } = Route.useParams();
  return <LessonAssessment lessonId={id} />;
}