
export interface Transaction {
  date: string;
  cards: number;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  date: string; // Last update date
  cards: number; // Total cards
  amount: number; // Total amount
  history: Transaction[];
}

export interface Expense {
  id: string;
  date: string;
  reason: string;
  amount: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  username: string;
}
