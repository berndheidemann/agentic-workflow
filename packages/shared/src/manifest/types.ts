/** Course manifest schema — describes the full structure of a learning site. */

export interface ManifestExercise {
  /** Unique exercise ID, e.g. "netzwerktechnik-ip-adressierung-01" */
  id: string;
  /** Human-readable title, e.g. "IP-Klassen und Bereiche" */
  title: string;
  /** Component type, e.g. "DragDropExercise", "MultipleChoice", "Lueckentext" */
  type: string;
  /** Max score/points for this exercise */
  points: number;
  /** Difficulty level 1–3 */
  difficulty: number;
}

export interface ManifestLesson {
  /** Lesson slug, e.g. "netzwerktechnik/ip-adressierung" */
  slug: string;
  /** Human-readable lesson title, e.g. "IP-Adressierung" */
  title: string;
  /** Exercises within this lesson, in order */
  exercises: ManifestExercise[];
}

export interface ManifestModule {
  /** Module ID (= directory name), e.g. "netzwerktechnik" */
  id: string;
  /** Human-readable module title, e.g. "Netzwerktechnik" */
  title: string;
  /** Sort order from the sidebar configuration */
  sortOrder: number;
  /** Lessons within this module, in sidebar order */
  lessons: ManifestLesson[];
}

export interface CourseManifest {
  /** Schema version — increment when format changes */
  version: 1;
  /** Course slug matching sites.json, e.g. "ap1" */
  course: string;
  /** Human-readable course name, e.g. "AP1-Trainer" */
  name: string;
  /** ISO 8601 timestamp when this manifest was generated */
  generatedAt: string;
  /** Modules in sidebar order */
  modules: ManifestModule[];
  /** Total exercise count — sum of all exercises in all modules */
  totalExercises: number;
}
