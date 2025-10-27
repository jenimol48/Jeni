import type { RFIDCard, Trip, Recharge, Route, User } from '../types';

const MOCK_CARD: RFIDCard = {
  cardNumber: 'C4RD2GO8',
  balance: 250.75,
  holderName: 'John Doe',
};

const MOCK_TRIPS: Trip[] = [
  { id: 't1', from: 'Central Station', to: 'City Mall', date: '2024-07-29T10:30:00Z', fare: 15.00, status: 'Completed' },
  { id: 't2', from: 'City Mall', to: 'Tech Park', date: '2024-07-29T17:45:00Z', fare: 20.50, status: 'Completed' },
  { id: 't3', from: 'Downtown', to: 'Airport', date: '2024-07-28T08:00:00Z', fare: 50.00, status: 'Completed' },
  { id: 't4', from: 'Suburbia', to: 'Central Station', date: '2024-07-27T09:12:00Z', fare: 25.00, status: 'Completed' },
];

const MOCK_RECHARGES: Recharge[] = [
  { id: 'r1', amount: 200, date: '2024-07-25T14:00:00Z', paymentMethod: 'UPI', status: 'Success' },
  { id: 'r2', amount: 500, date: '2024-07-15T11:20:00Z', paymentMethod: 'Card', status: 'Success' },
  { id: 'r3', amount: 100, date: '2024-06-30T18:55:00Z', paymentMethod: 'Net Banking', status: 'Success' },
];

const MOCK_ROUTES: Route[] = [
    { id: 'route1', routeNumber: '101A', from: 'Central Station', to: 'Tech Park', stops: ['Market', 'City Mall', 'University'], baseFare: 10 },
    { id: 'route2', routeNumber: '205', from: 'Airport', to: 'Suburbia', stops: ['Downtown', 'Hospital', 'Green Valley'], baseFare: 15 },
    { id: 'route3', routeNumber: '40B', from: 'City Mall', to: 'Downtown', stops: ['Library', 'Museum'], baseFare: 8 },
];

const MOCK_USERS: User[] = [
    { id: 'u1', name: 'John Doe', email: 'john.doe@example.com', password: 'password123' },
];

const simulateDelay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), 500 + Math.random() * 500));

export const fetchCardDetails = (): Promise<RFIDCard> => simulateDelay(MOCK_CARD);

export const fetchTripHistory = (): Promise<Trip[]> => simulateDelay(MOCK_TRIPS);

export const fetchRechargeHistory = (): Promise<Recharge[]> => simulateDelay(MOCK_RECHARGES);

export const fetchRoutes = (): Promise<Route[]> => simulateDelay(MOCK_ROUTES);

export const processRecharge = (amount: number, paymentMethod: Recharge['paymentMethod']): Promise<{ success: boolean; newBalance: number }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (amount > 0) {
        MOCK_CARD.balance += amount;
        const newRecharge: Recharge = {
            id: `r${Date.now()}`,
            amount,
            date: new Date().toISOString(),
            paymentMethod,
            status: 'Success'
        };
        MOCK_RECHARGES.unshift(newRecharge);
        resolve({ success: true, newBalance: MOCK_CARD.balance });
      } else {
        resolve({ success: false, newBalance: MOCK_CARD.balance });
      }
    }, 1500);
  });
};

export const signInUser = (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
            if (user) {
                const { password, ...userWithoutPass } = user;
                resolve({ success: true, user: userWithoutPass });
            } else {
                resolve({ success: false, message: 'Invalid email or password.' });
            }
        }, 1000);
    });
};

export const signUpUser = (name: string, email: string, pass:string): Promise<{ success: boolean; user?: User; message?: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            if (MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                resolve({ success: false, message: 'Email already exists.' });
            } else {
                const newUser: User = {
                    id: `u${Date.now()}`,
                    name,
                    email,
                    password: pass,
                };
                MOCK_USERS.push(newUser);
                const { password, ...userWithoutPass } = newUser;
                resolve({ success: true, user: userWithoutPass });
            }
        }, 1000);
    });
}

export const linkNewRfidCard = (newCardNumber: string): Promise<{ success: boolean; newCard?: RFIDCard; message?: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            if (newCardNumber && newCardNumber.length === 8 && /^[a-zA-Z0-9]+$/.test(newCardNumber)) {
                MOCK_CARD.cardNumber = newCardNumber.toUpperCase();
                resolve({ success: true, newCard: { ...MOCK_CARD } });
            } else {
                resolve({ success: false, message: 'Invalid card number format.' });
            }
        }, 1000);
    });
};

export const syncWithCloud = (): Promise<{ success: boolean; lastSynced: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ success: true, lastSynced: new Date().toLocaleString() });
        }, 1500);
    });
};


export interface AdminStats {
    totalUsers: number;
    totalTripsToday: number;
    revenueToday: number;
    userGrowth: { name: string; users: number }[];
    dailyTrips: { name: string; trips: number }[];
    dailyRevenue: { name: string; revenue: number }[];
}

export const fetchAdminStats = (): Promise<AdminStats> => {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyTripsData = [];
    const dailyRevenueData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayName = days[d.getDay()];
        
        const trips = 200 + Math.floor(Math.random() * 70);
        dailyTripsData.push({
            name: dayName,
            trips: trips,
        });

        dailyRevenueData.push({
            name: dayName,
            revenue: trips * (20 + Math.random() * 10),
        })
    }


    const userGrowthData = [
        { name: 'May', users: 50 },
        { name: 'Jun', users: 80 },
        { name: 'Jul', users: 150 },
        { name: 'Aug', users: MOCK_USERS.length + 150 },
    ];

    return simulateDelay({
        totalUsers: MOCK_USERS.length,
        totalTripsToday: 238,
        revenueToday: 5950.00,
        userGrowth: userGrowthData,
        dailyTrips: dailyTripsData,
        dailyRevenue: dailyRevenueData,
    });
};