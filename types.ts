export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface RFIDCard {
  cardNumber: string;
  balance: number;
  holderName: string;
}

export interface Trip {
  id: string;
  from: string;
  to: string;
  date: string;
  fare: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface Recharge {
  id: string;
  amount: number;
  date: string;
  paymentMethod: 'UPI' | 'Card' | 'Net Banking';
  status: 'Success' | 'Pending' | 'Failed';
}

export interface Route {
    id: string;
    routeNumber: string;
    from: string;
    to: string;
    stops: string[];
    baseFare: number;
}

export type HistoryItem = Trip | Recharge;

export type ActiveView = 'home' | 'history' | 'routes' | 'profile' | 'admin';