
import React, { useState } from 'react';
import { Plus, CheckSquare, EyeOff } from 'lucide-react';
import TodoItem from './TodoItem';
import { Toggle } from "@/components/ui/toggle";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  listId: string;
}

const TodoList = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo, listId }: TodoListProps) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      onAddTodo(newTodoText.trim());
      setNewTodoText('');
    }
  };
  
  // Sort todos to move completed to the bottom
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
  
  // Filter todos based on hideCompleted state
  const displayedTodos = hideCompleted 
    ? sortedTodos.filter(todo => !todo.completed) 
    : sortedTodos;
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleAddTodo} className="flex items-center space-x-2">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-secondary/50 rounded-lg border-0 px-4 py-3 focus:ring-2 focus:ring-primary transition-all"
        />
        <button 
          type="submit"
          disabled={!newTodoText.trim()}
          className="bg-primary hover:bg-primary hover:opacity-[0.9] text-primary-foreground rounded-lg p-3 transition-colors disabled:opacity-50"
        >
          <Plus size={20} />
        </button>
      </form>
      
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">
          {todos.filter(t => !t.completed).length} remaining
        </div>
        <Toggle 
          aria-label="Toggle completed tasks"
          pressed={hideCompleted}
          onPressedChange={setHideCompleted}
          className="flex items-center space-x-2 text-sm"
        >
          <EyeOff size={14} className="mr-1" />
          <span className="hidden sm:inline">Hide completed</span>
        </Toggle>
      </div>
      
      <div className="space-y-2 mt-4">
        {displayedTodos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {todos.length === 0 
              ? "No tasks yet. Add one to get started!"
              : "No tasks match your filter."}
          </div>
        ) : (
          <>
            {displayedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                id={todo.id}
                text={todo.text}
                completed={todo.completed}
                onToggle={onToggleTodo}
                onDelete={onDeleteTodo}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default TodoList;
