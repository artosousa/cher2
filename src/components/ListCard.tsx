
import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface ListCardProps {
  id: string;
  title: string;
  description: string;
  tasksCount: number;
  completedCount: number;
  currentStreak: number;
  lastUpdated: string;
}

const ListCard = ({
  id,
  title,
  description,
  tasksCount,
  completedCount,
  currentStreak,
  lastUpdated
}: ListCardProps) => {
  const progress = tasksCount > 0 ? (completedCount / tasksCount) * 100 : 0;
  
  return (
    <Link to={`/list/${id}`} className="block">
      <Card className="hover-scale">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-1 mt-1">{description}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 flex justify-between items-center text-sm">
          <div className="flex space-x-4">
            <span className="text-muted-foreground">
              {completedCount}/{tasksCount} tasks
            </span>
            <span className="text-muted-foreground">
              {lastUpdated}
            </span>
          </div>
          
          {/* {currentStreak > 0 && (
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Flame size={12} className="text-primary" />
              </div>
              <span>{currentStreak} day streak</span>
            </div>
          )} */}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ListCard;
