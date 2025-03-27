
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import Calendar from '@/components/Calendar';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarRange, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import ListCard from '@/components/ListCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";

const CalendarListView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();
  const todoService = window.todoService;
  
  const { data: completedDates = [], isLoading: isLoadingDates } = useQuery({
    queryKey: ['completedDates'],
    queryFn: () => todoService.getCompletedDates(),
  });
  
  const { data: lists = [], isLoading: isLoadingLists } = useQuery({
    queryKey: ['lists'],
    queryFn: () => todoService.getLists(),
  });
  
  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => todoService.getTodos(),
  });
  
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    toast(`Selected ${format(date, 'MMMM d, yyyy')}`);
  };
  
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
      return `Updated ${format(new Date(dateString), 'MMM d')}`;
    } catch (e) {
      return 'recently';
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-muted-foreground">Track your tasks and build streaks.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lists Section - Now 75% width (3/4 columns) */}
        <div className="space-y-6 lg:col-span-3 order-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Lists</h2>
            <Button 
              onClick={() => navigate('/create-list')}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </div>
          
          {isLoadingLists ? (
            <div className="flex justify-center py-12">
              <div className="glass rounded-lg px-4 py-2 animate-pulse-light">Loading your lists...</div>
            </div>
          ) : lists.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Create your first list</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarRange size={32} className="text-primary" />
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  Start tracking your tasks and build a streak.
                </p>
                <Button
                  onClick={() => navigate('/create-list')}
                  className="mx-auto"
                >
                  <Plus size={18} className="mr-2" />
                  Create a List
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
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
        </div>
        
        {/* Calendar Section - Now 25% width (1/4 column) */}
        <div className="space-y-6 order-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Activity Calendar</h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={goToPreviousMonth}
                className="p-2 rounded-full hover:bg-secondary/70 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={goToNextMonth}
                className="p-2 rounded-full hover:bg-secondary/70 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <Calendar 
            completedDates={completedDates} 
            currentMonth={currentMonth} 
            onDateClick={handleDateClick}
          />
          
          <div className="glass rounded-xl p-5">
            <h3 className="text-lg font-medium mb-4">Activity Stats</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{completedDates.length}</p>
                <p className="text-sm text-muted-foreground">Total Active Days</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {completedDates.filter(date => {
                    const today = new Date();
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    return new Date(date) >= startOfMonth;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Active Days This Month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarListView;