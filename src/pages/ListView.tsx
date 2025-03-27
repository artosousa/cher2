
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import TodoList from '@/components/TodoList';
import { toast } from "sonner";

const ListView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const todoService = window.todoService;
  
  const { data: list, isLoading: isLoadingList } = useQuery({
    queryKey: ['list', id],
    queryFn: () => todoService.getList(id || ''),
    enabled: !!id,
  });
  
  const { data: todos = [], isLoading: isLoadingTodos } = useQuery({
    queryKey: ['todos', id],
    queryFn: () => todoService.getTodos(id || ''),
    enabled: !!id,
  });
  
  const addTodoMutation = useMutation({
    mutationFn: (text: string) => todoService.addTodo(id || '', text),
    onSuccess: () => {
      toast.success("Task added");
    },
  });
  
  const toggleTodoMutation = useMutation({
    mutationFn: (todoId: string) => todoService.toggleTodo(todoId),
    onSuccess: () => {
      // Success is silent for toggles
    },
  });
  
  const deleteTodoMutation = useMutation({
    mutationFn: (todoId: string) => todoService.deleteTodo(todoId),
    onSuccess: () => {
      toast.success("Task deleted");
    },
  });
  
  const deleteListMutation = useMutation({
    mutationFn: () => todoService.deleteList(id || ''),
    onSuccess: () => {
      toast.success("List deleted");
      navigate('/');
    },
  });
  
  // Handle list not found
  useEffect(() => {
    if (!isLoadingList && !list) {
      toast.error("List not found");
      navigate('/');
    }
  }, [list, isLoadingList, navigate]);
  
  if (isLoadingList) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="glass rounded-lg px-4 py-2 animate-pulse-light">Loading list...</div>
        </div>
      </Layout>
    );
  }
  
  if (!list) return null;
  
  return (
    <Layout>
      <div className="mb-8">
        <button 
          onClick={() => navigate('/')}
          className="mb-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to Lists</span>
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">{list.title}</h1>
            {list.description && (
              <p className="text-muted-foreground">{list.description}</p>
            )}
          </div>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this list?")) {
                deleteListMutation.mutate();
              }
            }}
            className="text-muted-foreground hover:text-destructive transition-colors p-2"
          >
            <Trash2 size={18} />
          </button>
        </div>
        
        {/* {list.currentStreak > 0 && (
          <div className="inline-flex items-center gap-2 bg-accent/50 px-3 py-1.5 rounded-full text-sm font-medium mt-3">
            <Calendar size={14} className="text-primary" />
            <span>{list.currentStreak} day streak</span>
          </div>
        )} */}
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="glass rounded-xl p-5 sm:p-6">
          <TodoList
            listId={id || ''}
            todos={todos}
            onAddTodo={(text) => addTodoMutation.mutate(text)}
            onToggleTodo={(todoId) => toggleTodoMutation.mutate(todoId)}
            onDeleteTodo={(todoId) => deleteTodoMutation.mutate(todoId)}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ListView;
