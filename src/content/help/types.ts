export type HelpArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string; // lightweight markdown
  related?: string[];
};

export type HelpTrack = {
  id: "reader" | "admin";
  label: string;
  basePath: string;
  articles: HelpArticle[];
};
