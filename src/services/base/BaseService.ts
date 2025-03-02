
import { QueryClient } from '@tanstack/react-query';
import { auth } from '../../lib/firebase';
import { toast } from 'sonner';

export class BaseService {
  protected queryClient: QueryClient;
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }
  
  // Helper method to check authentication
  protected checkAuth(): boolean {
    if (!auth.currentUser) {
      toast.error('You must be logged in to perform this action');
      return false;
    }
    return true;
  }
  
  // Helper method to get local date string in ISO format
  // Fixed to ensure the correct date is used
  protected getLocalDateString(): string {
    const now = new Date();
    return now.toISOString();
  }
  
  // Helper method to get just the date portion in YYYY-MM-DD format
  // Fixed to ensure the correct date is used 
  protected getLocalDateOnlyString(): string {
    const now = new Date();
    // Use local date formatting to avoid timezone issues
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Helper to check if two dates are the same day (ignoring time)
  protected isSameDay(date1: string, date2: string): boolean {
    return date1.split('T')[0] === date2.split('T')[0];
  }
  
  // Helper to check if a date is yesterday relative to another date
  protected isYesterday(dateToCheck: string, relativeTo: string): boolean {
    const date = new Date(dateToCheck);
    const compareDate = new Date(relativeTo);
    
    // Set both dates to midnight to compare just the dates
    date.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);
    
    // Subtract one day from compareDate
    compareDate.setDate(compareDate.getDate() - 1);
    
    return date.getTime() === compareDate.getTime();
  }
}
