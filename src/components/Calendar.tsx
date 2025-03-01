
import React from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isToday, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarProps {
  completedDates: string[]; // ISO date strings
  currentMonth?: Date;
  onDateClick?: (date: Date) => void;
  className?: string;
}

const Calendar = ({ 
  completedDates, 
  currentMonth = new Date(), 
  onDateClick, 
  className
}: CalendarProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Convert ISO strings to Date objects for comparison
  const completedDateObjects = completedDates.map(dateStr => new Date(dateStr));
  
  const isDateCompleted = (date: Date) => {
    // Check against actual completed dates
    return completedDateObjects.some(completedDate => 
      completedDate.getFullYear() === date.getFullYear() && 
      completedDate.getMonth() === date.getMonth() && 
      completedDate.getDate() === date.getDate()
    );
  };

  // Function to determine if a date has a completed day before it
  const hasCompletedBefore = (day: Date) => {
    const prevDay = new Date(day);
    prevDay.setDate(prevDay.getDate() - 1);
    return completedDateObjects.some(completedDate => 
      completedDate.getFullYear() === prevDay.getFullYear() && 
      completedDate.getMonth() === prevDay.getMonth() && 
      completedDate.getDate() === prevDay.getDate()
    );
  };

  // Function to determine if a date has a completed day after it
  const hasCompletedAfter = (day: Date) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    return completedDateObjects.some(completedDate => 
      completedDate.getFullYear() === nextDay.getFullYear() && 
      completedDate.getMonth() === nextDay.getMonth() && 
      completedDate.getDate() === nextDay.getDate()
    );
  };

  // Function to determine streak position
  const getStreakPosition = (day: Date) => {
    if (!isDateCompleted(day)) return '';
    
    const hasBeforeCompleted = hasCompletedBefore(day);
    const hasAfterCompleted = hasCompletedAfter(day);
    
    if (!hasBeforeCompleted && hasAfterCompleted) return 'streak-day-start';
    if (hasBeforeCompleted && !hasAfterCompleted) return 'streak-day-end';
    if (hasBeforeCompleted && hasAfterCompleted) return 'streak-day-middle';
    return ''; // Isolated completed day (no connections)
  };

  const handleDateClick = (day: Date) => {
    if (onDateClick) {
      onDateClick(day);
    }
  };

  return (
    <div className={cn("glass rounded-xl p-4 sm:p-6", className)}>
      {/* Month display above the calendar */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {monthDays.map((day, i) => {
          const isCompleted = isDateCompleted(day);
          const streakPositionClass = getStreakPosition(day);
          
          return (
            <div 
              key={i}
              onClick={() => handleDateClick(day)}
              className={cn(
                "streak-day aspect-square text-sm font-medium flex items-center justify-center",
                isToday(day) && !isCompleted && "ring-2 ring-primary/50",
                isCompleted && "streak-day-completed",
                streakPositionClass,
                !isSameMonth(day, currentMonth) && "opacity-30",
                onDateClick && "cursor-pointer hover:bg-secondary/70 transition-colors"
              )}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex items-center justify-center text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
          <span className="text-muted-foreground">Completed days</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
