export type QuizQuestion = {
  q: string;
  options: string[];
  answerIndex: number;
  explain?: string;
};

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  body: string; // lightweight markdown
  quiz: QuizQuestion[];
};

export type Course = {
  id: "reader" | "admin";
  label: string;
  basePath: string;
  modules: Lesson[];
};
