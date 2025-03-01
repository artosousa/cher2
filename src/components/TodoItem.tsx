
import React, { useState } from 'react';
import { Check, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoItem = ({ id, text, completed, onToggle, onDelete }: TodoItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = () => {
    setIsDeleting(true);
    // Delay to allow animation to complete
    setTimeout(() => {
      onDelete(id);
    }, 300);
  };
  
  return (
    <div 
      className={cn(
        "group flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-300",
        completed ? "bg-accent/50" : "bg-secondary/50",
        isDeleting && "transform translate-x-full opacity-0"
      )}
    >
      <div className="flex items-center space-x-3 flex-1">
        <button
          onClick={() => onToggle(id)}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
            completed 
              ? "bg-primary text-primary-foreground" 
              : "border-2 border-muted-foreground/30 hover:border-primary"
          )}
        >
          {completed && <Check size={12} />}
        </button>
        
        <span 
          className={cn(
            "transition-all duration-200",
            completed && "line-through text-muted-foreground"
          )}
        >
          {text}
        </span>
      </div>
      
      <button 
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity duration-200"
      >
        <Trash size={16} />
      </button>
    </div>
  );
};

export default TodoItem;
