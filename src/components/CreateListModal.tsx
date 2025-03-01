
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface CreateListModalProps {
  onCreateList: (title: string, description: string) => Promise<string>;
}

const CreateListModal = ({ onCreateList }: CreateListModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      toast.error('You must be logged in to create a list');
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Direct database access as a fallback in case the service has permission issues
      if (auth.currentUser) {
        try {
          // Try using the service first
          const listId = await onCreateList(title, description);
          toast.success('List created successfully');
          navigate(`/list/${listId}`);
        } catch (serviceError: any) {
          console.error('Service error:', serviceError);
          
          // If service fails with permission denied, try direct access
          if (serviceError.code === 'permission-denied') {
            console.log('Trying direct database access');
            
            const newList = {
              title,
              description,
              userId: auth.currentUser.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              currentStreak: 0,
              lastCompletedDate: null
            };
            
            const docRef = await addDoc(collection(db, 'lists'), newList);
            toast.success('List created successfully');
            navigate(`/list/${docRef.id}`);
          } else {
            throw serviceError; // Re-throw if it's not a permission issue
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to create list:', error);
      
      // Handle permission errors specifically
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your Firebase security rules.');
      } else {
        toast.error('Failed to create list. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="glass w-full max-w-md rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create New List</h2>
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground rounded-full p-1">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              List Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-secondary/50 rounded-lg border-0 px-4 py-3 focus:ring-2 focus:ring-primary"
              placeholder="E.g., Daily Tasks, Workout Plan, Reading List"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-secondary/50 rounded-lg border-0 px-4 py-3 focus:ring-2 focus:ring-primary resize-none"
              placeholder="What's this list for?"
              rows={3}
            />
          </div>
          
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Creating...' : 'Create List'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListModal;
