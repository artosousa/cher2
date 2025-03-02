import { BaseService } from '../base/BaseService';
import { Todo } from '../models/todoModels';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { ListService } from '../lists/ListService';

export class TodoService extends BaseService {
  private listService: ListService;

  constructor(queryClient: any) {
    super(queryClient);
    this.listService = new ListService(queryClient);
  }

  async getTodos(listId?: string): Promise<Todo[]> {
    try {
      let todosQuery;
      
      if (listId) {
        todosQuery = query(collection(db, 'todos'), where('listId', '==', listId));
      } else {
        todosQuery = collection(db, 'todos');
      }
      
      const snapshot = await getDocs(todosQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          text: data.text,
          completed: data.completed,
          createdAt: data.createdAt.toDate().toISOString(),
          listId: data.listId
        };
      });
    } catch (error) {
      console.error('Error getting todos:', error);
      toast.error('Failed to fetch tasks');
      return [];
    }
  }
  
  async addTodo(listId: string, text: string): Promise<Todo> {
    try {
      const newTodo = {
        text,
        completed: false,
        createdAt: serverTimestamp(),
        listId
      };
      
      const docRef = await addDoc(collection(db, 'todos'), newTodo);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Failed to fetch new todo');
      }
      
      const data = docSnap.data() as DocumentData;
      
      this.queryClient.invalidateQueries({ queryKey: ['todos', listId] });
      
      // Update list's updatedAt time
      this.listService.updateListTimestamp(listId);
      
      toast.success('Task added');
      
      return {
        id: docRef.id,
        text: data.text,
        completed: data.completed,
        createdAt: data.createdAt.toDate().toISOString(),
        listId: data.listId
      };
    } catch (error) {
      console.error('Error adding todo:', error);
      toast.error('Failed to add task');
      throw error;
    }
  }
  
  async toggleTodo(id: string): Promise<void> {
    try {
      // First, get the current todo
      const todoRef = doc(db, 'todos', id);
      const todoSnap = await getDoc(todoRef);
      
      if (!todoSnap.exists()) {
        throw new Error('Todo not found');
      }
      
      const todoData = todoSnap.data();
      const listId = todoData.listId;
      
      // Toggle the completed status
      await updateDoc(todoRef, {
        completed: !todoData.completed
      });
      
      // Invalidate todos query
      this.queryClient.invalidateQueries({ queryKey: ['todos'] });
      
      if (listId) {
        // Update list data (streaks, etc)
        await this.updateListProgress(listId);
        
        // Also invalidate the completed dates query to refresh calendar
        this.queryClient.invalidateQueries({ queryKey: ['completedDates'] });
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error('Failed to update task');
    }
  }
  
  async deleteTodo(id: string): Promise<void> {
    try {
      // Get the todo before deleting to know the list ID
      const todoRef = doc(db, 'todos', id);
      const todoSnap = await getDoc(todoRef);
      
      let listId = '';
      if (todoSnap.exists()) {
        listId = todoSnap.data().listId;
      }
      
      // Delete the todo
      await deleteDoc(todoRef);
      
      this.queryClient.invalidateQueries({ queryKey: ['todos'] });
      
      if (listId) {
        // Update list timestamp
        this.listService.updateListTimestamp(listId);
        
        // Also check if we need to update completedDates
        const todoData = todoSnap.data();
        if (todoData.completed) {
          // This might affect the completed status of a list
          this.queryClient.invalidateQueries({ queryKey: ['completedDates'] });
        }
      }
      
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete task');
    }
  }
  
  private async updateListProgress(listId: string): Promise<void> {
    try {
      const todos = await this.getTodos(listId);
      const list = await this.listService.getList(listId);
      
      if (!list) return;
      
      const allCompleted = todos.length > 0 && todos.every(todo => todo.completed);
      
      // Get today's date in local time to ensure correct date
      const today = this.getLocalDateOnlyString();
      const lastCompletedDate = list.lastCompletedDate ? list.lastCompletedDate.split('T')[0] : null;
      
      console.log('Today is:', today);
      console.log('Last completed date was:', lastCompletedDate);
      
      let updates: any = {};
      
      if (allCompleted) {
        // Check if it was already completed today
        if (lastCompletedDate !== today) {
          // Check if the streak should continue or reset
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          // Format yesterday date properly to avoid timezone issues
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          console.log('Yesterday was:', yesterdayStr);
          
          let newStreak = 1; // Start with 1 for today
          if (lastCompletedDate === yesterdayStr) {
            // Continuing streak
            newStreak = list.currentStreak + 1;
          }
          
          updates = {
            currentStreak: newStreak,
            lastCompletedDate: this.getLocalDateString()
          };
          
          console.log('Setting new completed date to now:', this.getLocalDateString());
        }
      } else if (lastCompletedDate === today) {
        // Was completed today but now incomplete, remove completion
        updates = {
          lastCompletedDate: null
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await this.listService.updateList(listId, updates);
      }
    } catch (error) {
      console.error('Error updating list progress:', error);
    }
  }
}
