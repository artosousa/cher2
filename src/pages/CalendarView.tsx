
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import Calendar from '@/components/Calendar';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const todoService = window.todoService;
  
  const { data: completedDates = [], isLoading } = useQuery({
    queryKey: ['completedDates'],
    queryFn: () => todoService.getCompletedDates(),
  });
  
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  // For debugging
  console.log('Current date:', new Date().toISOString());
  console.log('Current local date:', format(new Date(), 'yyyy-MM-dd'));
  console.log('Completed dates:', completedDates);
  console.log('Completed dates formatted:', completedDates.map(d => d.split('T')[0]));
  
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Streaks</h1>
        <p className="text-muted-foreground">
          Track your progress day by day.
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-secondary/70 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-medium">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button 
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-secondary/70 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="glass rounded-lg px-4 py-2 animate-pulse-light">Loading your streaks...</div>
        </div>
      ) : (
        <Calendar 
          completedDates={completedDates} 
          currentMonth={currentMonth}
          className="mb-8"
        />
      )}
      
      <div className="mt-8 glass rounded-xl p-5">
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
    </Layout>
  );
};

export default CalendarView;