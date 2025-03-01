import { QueryClient } from '@tanstack/react-query';
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
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  listId: string;
}

export interface TodoList {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  currentStreak: number;
  lastCompletedDate: string | null;
}

// Firebase service to replace the mock localStorage service
class TodoService {
  private queryClient: QueryClient;
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }
  
  // Helper method to check authentication
  private checkAuth(): boolean {
    if (!auth.currentUser) {
      toast.error('You must be logged in to perform this action');
      return false;
    }
    return true;
  }
  
  // Lists
  async getLists(): Promise<TodoList[]> {
    try {
      if (!this.checkAuth()) return [];
      
      // Get lists for the current user only
      const uid = auth.currentUser?.uid;
      const listsRef = collection(db, 'lists');
      const q = query(listsRef, where("userId", "==", uid));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
          currentStreak: data.currentStreak || 0,
          lastCompletedDate: data.lastCompletedDate ? data.lastCompletedDate.toDate().toISOString() : null
        };
      });
    } catch (error) {
      console.error('Error getting lists:', error);
      toast.error('Failed to fetch lists');
      return [];
    }
  }
  
  async getList(id: string): Promise<TodoList | null> {
    try {
      if (!this.checkAuth()) return null;
      
      const docRef = doc(db, 'lists', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Check if this list belongs to the current user
        if (data.userId !== auth.currentUser?.uid) {
          toast.error('You do not have permission to view this list');
          return null;
        }
        
        return {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
          currentStreak: data.currentStreak || 0,
          lastCompletedDate: data.lastCompletedDate ? data.lastCompletedDate.toDate().toISOString() : null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting list:', error);
      toast.error('Failed to fetch list details');
      return null;
    }
  }
  
  async createList(title: string, description: string): Promise<string> {
    try {
      if (!this.checkAuth()) throw new Error('Authentication required');
      
      const uid = auth.currentUser?.uid;
      
      const newList = {
        title,
        description,
        userId: uid, // Add user ID to the list
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        currentStreak: 0,
        lastCompletedDate: null
      };
      
      const docRef = await addDoc(collection(db, 'lists'), newList);
      this.queryClient.invalidateQueries({ queryKey: ['lists'] });
      return docRef.id;
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  }
  
  async updateList(id: string, updates: Partial<TodoList>): Promise<void> {
    try {
      const listRef = doc(db, 'lists', id);
      
      // Convert date strings to Firestore timestamps if present
      const firebaseUpdates: any = { ...updates };
      if (updates.lastCompletedDate) {
        firebaseUpdates.lastCompletedDate = Timestamp.fromDate(new Date(updates.lastCompletedDate));
      }
      
      // Always update the updatedAt timestamp
      firebaseUpdates.updatedAt = serverTimestamp();
      
      await updateDoc(listRef, firebaseUpdates);
      
      this.queryClient.invalidateQueries({ queryKey: ['lists'] });
      this.queryClient.invalidateQueries({ queryKey: ['list', id] });
    } catch (error) {
      console.error('Error updating list:', error);
      toast.error('Failed to update list');
    }
  }
  
  async deleteList(id: string): Promise<void> {
    try {
      // Delete the list document
      await deleteDoc(doc(db, 'lists', id));
      
      // Delete all todos for this list - first get them
      const todosQuery = query(collection(db, 'todos'), where('listId', '==', id));
      const todoSnapshot = await getDocs(todosQuery);
      
      // Then delete each one
      const deletePromises = todoSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      this.queryClient.invalidateQueries({ queryKey: ['lists'] });
      this.queryClient.invalidateQueries({ queryKey: ['todos'] });
      
      toast.success('List deleted successfully');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  }
  
  // Todos
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
      this.updateListTimestamp(listId);
      
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
      
      this.queryClient.invalidateQueries({ queryKey: ['todos'] });
      
      if (listId) {
        // Update list data (streaks, etc)
        await this.updateListProgress(listId);
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
        this.updateListTimestamp(listId);
      }
      
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete task');
    }
  }
  
  // Helper methods
  private async updateListTimestamp(listId: string): Promise<void> {
    await this.updateList(listId, { updatedAt: new Date().toISOString() });
  }
  
  private async updateListProgress(listId: string): Promise<void> {
    try {
      const todos = await this.getTodos(listId);
      const list = await this.getList(listId);
      
      if (!list) return;
      
      const allCompleted = todos.length > 0 && todos.every(todo => todo.completed);
      const today = new Date().toISOString().split('T')[0];
      const lastCompletedDate = list.lastCompletedDate ? list.lastCompletedDate.split('T')[0] : null;
      
      let updates: Partial<TodoList> = {};
      
      if (allCompleted) {
        // Check if it was already completed today
        if (lastCompletedDate !== today) {
          // Check if the streak should continue or reset
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          let newStreak = 1; // Start with 1 for today
          if (lastCompletedDate === yesterdayStr) {
            // Continuing streak
            newStreak = list.currentStreak + 1;
          }
          
          updates = {
            currentStreak: newStreak,
            lastCompletedDate: new Date().toISOString()
          };
        }
      } else if (lastCompletedDate === today) {
        // Was completed today but now incomplete, remove completion
        updates = {
          lastCompletedDate: null
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await this.updateList(listId, updates);
      }
    } catch (error) {
      console.error('Error updating list progress:', error);
    }
  }
  
  // Calendar data
  async getCompletedDates(): Promise<string[]> {
    try {
      const lists = await this.getLists();
      const completedDates = new Set<string>();
      
      lists.forEach(list => {
        if (list.lastCompletedDate) {
          completedDates.add(list.lastCompletedDate.split('T')[0]);
        }
      });
      
      return Array.from(completedDates);
    } catch (error) {
      console.error('Error getting completed dates:', error);
      return [];
    }
  }
}

export default TodoService;
