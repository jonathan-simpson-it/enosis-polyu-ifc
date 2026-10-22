import katex from "katex";

export function Tex({
  tex,
  block = false,
  className = "",
}: {
  tex: string;
  block?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(tex, {
    displayMode: block,
    throwOnError: false,
    strict: false,
  });
  if (block) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}