export interface CurriculumNode {
  id: string;
  title: string;
  level: "PROGRAM" | "GRADE" | "SUBJECT" | "LESSON";
  children?: CurriculumNode[];
}

export const curriculumTree: CurriculumNode[] = [
  {
    id: "p-01",
    title: "Program 1",
    level: "PROGRAM",
    children: [
      {
        id: "g-01",
        title: "Grade 1",
        level: "GRADE",
        children: [
          {
            id: "s-01",
            title: "Math",
            level: "SUBJECT",
            children: [
              { id: "l-01", title: "Lesson 1", level: "LESSON" },
            ],
          },
        ],
      },
    ],
  },
];
