// Synthetic. Module names are generic, not copied from any real course.
export const course = {
  title: 'Data Analysis with pandas',
  completed: true,
  modules: ['Loading data', 'Cleaning data', 'Grouping and totals', 'Dates and months', 'Reading results'],
}
const id: string = import.meta.env.VITE_LEARNER_ID ?? 'L-001'
export const learner = { id, label: `Learner ${id}` }
