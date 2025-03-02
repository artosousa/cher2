
import { QueryClient } from '@tanstack/react-query';
import { Todo, TodoList } from './models/todoModels';
import { ListService } from './lists/ListService';
import { TodoService as TodoItemService } from './todos/TodoService';

// Firebase service to replace the mock localStorage service
class TodoService {
  private queryClient: QueryClient;
  private listService: ListService;
  private todoItemService: TodoItemService;
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.listService = new ListService(queryClient);
    this.todoItemService = new TodoItemService(queryClient);
  }
  
  // Lists
  async getLists(): Promise<TodoList[]> {
    return this.listService.getLists();
  }
  
  async getList(id: string): Promise<TodoList | null> {
    return this.listService.getList(id);
  }
  
  async createList(title: string, description: string): Promise<string> {
    return this.listService.createList(title, description);
  }
  
  async updateList(id: string, updates: Partial<TodoList>): Promise<void> {
    return this.listService.updateList(id, updates);
  }
  
  async deleteList(id: string): Promise<void> {
    return this.listService.deleteList(id);
  }
  
  // Todos
  async getTodos(listId?: string): Promise<Todo[]> {
    return this.todoItemService.getTodos(listId);
  }
  
  async addTodo(listId: string, text: string): Promise<Todo> {
    return this.todoItemService.addTodo(listId, text);
  }
  
  async toggleTodo(id: string): Promise<void> {
    await this.todoItemService.toggleTodo(id);
    // Invalidate the completedDates query to force a refresh of the calendar
    this.queryClient.invalidateQueries({ queryKey: ['completedDates'] });
  }
  
  async deleteTodo(id: string): Promise<void> {
    return this.todoItemService.deleteTodo(id);
  }
  
  // Calendar data
  async getCompletedDates(): Promise<string[]> {
    return this.listService.getCompletedDates();
  }
}

export default TodoService;
// Fix the re-export TypeScript error by using 'export type'
export type { Todo, TodoList };
