// Synthetic. Module names are generic, not copied from any real course.
export type CourseDef = { id: string; task: string; title: string; level: string; lessons: string[]; blurb: string; skill: string }
export const courses: CourseDef[] = [
  { id: 'pandas', task: 't1', title: 'Data Analysis with pandas', level: 'Beginner', skill: 'Debugging with pandas',
    blurb: 'Load, clean and total up order data.',
    lessons: ['Loading data', 'Cleaning data', 'Grouping and totals', 'Dates and months', 'Reading results'] },
  { id: 'text-cleaning', task: 't2', title: 'Python Text Cleaning', level: 'Beginner', skill: 'Text cleaning',
    blurb: 'Make messy strings clean and consistent.',
    lessons: ['Trimming spaces', 'Upper and lower case', 'Splitting and joining', 'Handling missing values', 'Cleaning a column', 'Checking your result'] },
  { id: 'data-structures', task: 't3', title: 'Python Data Structures', level: 'Intermediate', skill: 'Data structures',
    blurb: 'Lists, dictionaries and sets for real records.',
    lessons: ['Lists and records', 'Dictionaries', 'Sets and uniqueness', 'Counting things', 'Finding duplicates'] },
]
export const courseById = (id?: string) => courses.find((c) => c.id === id)
