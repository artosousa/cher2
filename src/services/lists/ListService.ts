
import { BaseService } from '../base/BaseService';
import { TodoList } from '../models/todoModels';
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
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { toast } from 'sonner';

export class ListService extends BaseService {
  async getLists(): Promise<TodoList[]> {
    try {
      if (!this.checkAuth()) return [];
      
      // Get lists for the current user only
      const uid = auth.currentUser?.uid;
      const listsRef = collection(db, 'lists');
      const q = query(listsRef, where("userId", "==", uid));
      
      console.log('Fetching lists for user:', uid);
      
      try {
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
      } catch (error: any) {
        console.error('Firebase query error:', error);
        if (error.code === 'permission-denied') {
          toast.error('Permission denied. Please check your Firebase security rules.');
        }
        return [];
      }
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
        userId: uid,
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
      
      // Invalidate both the lists and completedDates queries to ensure calendar updates
      this.queryClient.invalidateQueries({ queryKey: ['lists'] });
      this.queryClient.invalidateQueries({ queryKey: ['list', id] });
      
      // If lastCompletedDate was updated, also invalidate completedDates
      if (updates.lastCompletedDate) {
        this.queryClient.invalidateQueries({ queryKey: ['completedDates'] });
      }
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
      this.queryClient.invalidateQueries({ queryKey: ['completedDates'] });
      
      toast.success('List deleted successfully');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  }

  async updateListTimestamp(listId: string): Promise<void> {
    await this.updateList(listId, { updatedAt: this.getLocalDateString() });
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
