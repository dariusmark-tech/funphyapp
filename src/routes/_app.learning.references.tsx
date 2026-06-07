import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_app/learning/references")({
  component: References,
});

function References() {
  const { data: refs } = useQuery({
    queryKey: ["refs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("references_list")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <h2 className="mb-3 text-center text-xl font-black italic">References</h2>
      <ul className="list-disc space-y-4 pl-5 text-sm leading-relaxed">
        {refs?.map((r) => (
          <li key={r.id}>
            <p>{r.citation}</p>
            {r.url && (
              <p className="mt-1">
                <span className="font-bold">Link: </span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-primary underline hover:text-accent"
                >
                  {r.url}
                </a>
                <ExternalLink className="ml-1 inline h-3 w-3 text-primary" />
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
