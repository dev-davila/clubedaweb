import { RichText } from "../../_shared/RichText";

export function ContentSection({ data }: { data: Record<string, any> }) {
  const { html = "", maxWidth = "4xl" } = data;
  const widthClass =
    maxWidth === "6xl" ? "max-w-6xl" : maxWidth === "5xl" ? "max-w-5xl" : "max-w-4xl";
  return (
    <section className="py-12 md:py-16">
      <div className={`${widthClass} mx-auto px-4`}>
        <RichText
          html={html}
          className="prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:text-foreground prose-headings:font-bold
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-strong:text-foreground"
        />
      </div>
    </section>
  );
}
