
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import ListCard from '@/components/ListCard';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const todoService = window.todoService;
  
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: () => todoService.getLists(),
  });
  
  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => todoService.getTodos(),
  });
  
  const getListStats = (listId: string) => {
    const listTodos = todos.filter((todo: any) => todo.listId === listId);
    const completedTodos = listTodos.filter((todo: any) => todo.completed);
    
    return {
      total: listTodos.length,
      completed: completedTodos.length
    };
  };
  
  const formatLastUpdated = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Lists</h1>
        <p className="text-muted-foreground">Track your tasks and build streaks.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="glass rounded-lg px-4 py-2 animate-pulse-light">Loading your lists...</div>
        </div>
      ) : lists.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarRange size={32} className="text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Create your first list</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking your tasks and build a streak.
          </p>
          <button
            onClick={() => navigate('/create-list')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 py-3 font-medium transition-colors flex items-center justify-center mx-auto"
          >
            <Plus size={18} className="mr-2" />
            Create a List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list: any) => {
            const { total, completed } = getListStats(list.id);
            
            return (
              <ListCard
                key={list.id}
                id={list.id}
                title={list.title}
                description={list.description}
                tasksCount={total}
                completedCount={completed}
                currentStreak={list.currentStreak}
                lastUpdated={formatLastUpdated(list.updatedAt)}
              />
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Index;
