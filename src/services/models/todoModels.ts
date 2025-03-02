
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  listId: string;
}

export interface TodoList {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  currentStreak: number;
  lastCompletedDate: string | null;
}
