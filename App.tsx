import React, { useState, useEffect, useCallback } from 'react';
import type { ActiveView, RFIDCard, Trip, Recharge, Route, HistoryItem, User } from './types';
import { 
    fetchCardDetails, 
    fetchTripHistory, 
    fetchRechargeHistory, 
    fetchRoutes, 
    processRecharge,
    signInUser,
    signUpUser,
    fetchAdminStats,
    linkNewRfidCard,
    syncWithCloud
} from './services/mockApi';
import type { AdminStats } from './services/mockApi';


import Header from './components/Header';
import BottomNav from './components/BottomNav';
import RechargeModal from './components/RechargeModal';
import SignInModal from './components/SignInModal';
import SignUpModal from './components/SignUpModal';
import AdminLoginModal from './components/AdminLoginModal';

// For jsPDF
declare const jspdf: any;

// For Recharts
declare const window: any;


const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('home');
    const [cardDetails, setCardDetails] = useState<RFIDCard | null>(null);
    const [initialCard, setInitialCard] = useState<RFIDCard | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [recharges, setRecharges] = useState<Recharge[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Auth state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
    
    const isLoggedIn = !!currentUser;
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [card, tripHistory, rechargeHistory, routeData] = await Promise.all([
                fetchCardDetails(),
                fetchTripHistory(),
                fetchRechargeHistory(),
                fetchRoutes()
            ]);
            setCardDetails(card);
            setInitialCard(card);
            setTrips(tripHistory);
            setRecharges(rechargeHistory);
            setRoutes(routeData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRecharge = async (amount: number, paymentMethod: Recharge['paymentMethod']): Promise<boolean> => {
        const result = await processRecharge(amount, paymentMethod);
        if (result.success && cardDetails) {
            setCardDetails({ ...cardDetails, balance: result.newBalance });
            fetchRechargeHistory().then(setRecharges); // Refresh recharge history
            return true;
        }
        return false;
    };
    
    // Auth Handlers
    const handleSignIn = async (email: string, pass: string) => {
        const result = await signInUser(email, pass);
        if (result.success && result.user) {
            setCurrentUser(result.user);
            setCardDetails(prev => prev ? { ...prev, holderName: result.user!.name } : null);
            setShowSignInModal(false);
        }
        return result;
    };

    const handleSignUp = async (name: string, email: string, pass: string) => {
        const result = await signUpUser(name, email, pass);
        if (result.success && result.user) {
            setCurrentUser(result.user);
            setCardDetails(prev => prev ? { ...prev, holderName: result.user!.name } : null);
        }
        return result;
    };

    const handleSignOut = () => {
        setCurrentUser(null);
        setIsAdmin(false);
        if (activeView === 'admin') setActiveView('profile');
        if (initialCard) {
             setCardDetails(prev => prev ? { ...prev, holderName: initialCard.holderName} : initialCard);
        }
    };
    
    const handleAdminLogin = async (key: string) => {
        if (key === 'ADMIN123') {
            setIsAdmin(true);
            setActiveView('admin');
            setShowAdminLoginModal(false);
            return { success: true };
        }
        return { success: false, message: 'Invalid Admin Key.' };
    };

    const handleLinkNewCard = async (newCardNumber: string) => {
        const result = await linkNewRfidCard(newCardNumber);
        if (result.success && result.newCard) {
            setCardDetails(result.newCard);
            return true;
        }
        // Should show an error message to the user
        console.error(result.message);
        return false;
    };


    const handleDownload = (format: 'pdf' | 'csv') => {
        const allHistory = [...trips, ...recharges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (format === 'csv') {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Date,Type,Description,Amount (₹),Status\n";
            
            allHistory.forEach(item => {
                const date = new Date(item.date).toLocaleString();
                const type = 'fare' in item ? 'Trip' : 'Recharge';
                const description = 'fare' in item 
                    ? `${item.from} to ${item.to}` 
                    : `Recharge via ${item.paymentMethod}`;
                const amount = 'fare' in item ? `-${item.fare.toFixed(2)}` : `+${item.amount.toFixed(2)}`;
                const status = item.status;
                csvContent += `"${date}","${type}","${description}","${amount}","${status}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "bus2go-statement.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();

            doc.text("BUS2go Transaction Statement", 14, 20);
            doc.autoTable({
                startY: 30,
                head: [['Date', 'Type', 'Description', 'Amount (₹)', 'Status']],
                body: allHistory.map(item => [
                    new Date(item.date).toLocaleString(),
                    'fare' in item ? 'Trip' : 'Recharge',
                    'fare' in item ? `${item.from} to ${item.to}` : `Recharge via ${item.paymentMethod}`,
                    'fare' in item ? `-${item.fare.toFixed(2)}` : `+${item.amount.toFixed(2)}`,
                    item.status
                ]),
            });

            doc.save('bus2go-statement.pdf');
        }
        setShowDownloadModal(false);
    };
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full pt-20"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-500"></i></div>;
        }
        switch (activeView) {
            case 'home':
                return <HomeView card={cardDetails} recentActivity={[...trips.slice(0, 2), ...recharges.slice(0, 1)]} onRechargeClick={() => setShowRechargeModal(true)} />;
            case 'history':
                return <HistoryView trips={trips} recharges={recharges} onDownloadClick={() => setShowDownloadModal(true)} />;
            case 'routes':
                return <RoutesView routes={routes} />;
            case 'profile':
                return <ProfileView 
                            card={cardDetails} 
                            user={currentUser}
                            isAdmin={isAdmin}
                            onSignOut={handleSignOut}
                            onSignInClick={() => setShowSignInModal(true)}
                            onSignUpClick={() => setShowSignUpModal(true)}
                            onAdminLoginClick={() => setShowAdminLoginModal(true)}
                            onGoToAdminPanel={() => setActiveView('admin')}
                            onLinkNewCard={handleLinkNewCard}
                        />;
            case 'admin':
                return <AdminView />;
            default:
                return <HomeView card={cardDetails} recentActivity={[...trips.slice(0, 2), ...recharges.slice(0, 1)]} onRechargeClick={() => setShowRechargeModal(true)} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            <Header isLoggedIn={isLoggedIn} card={cardDetails} />
            <main className="pt-20 pb-20 px-4">
                {renderContent()}
            </main>
            {showRechargeModal && cardDetails && (
                <RechargeModal 
                    currentBalance={cardDetails.balance}
                    onClose={() => setShowRechargeModal(false)} 
                    onRecharge={handleRecharge}
                />
            )}
            {showDownloadModal && (
                <DownloadModal 
                    onClose={() => setShowDownloadModal(false)}
                    onDownload={handleDownload}
                />
            )}
            {showSignInModal && (
                <SignInModal 
                    onClose={() => setShowSignInModal(false)}
                    onSignIn={handleSignIn}
                />
            )}
            {showSignUpModal && (
                <SignUpModal
                    onClose={() => setShowSignUpModal(false)}
                    onSignUp={handleSignUp}
                />
            )}
            {showAdminLoginModal && (
                <AdminLoginModal
                    onClose={() => setShowAdminLoginModal(false)}
                    onAdminLogin={handleAdminLogin}
                />
            )}
            <BottomNav activeView={activeView} setActiveView={setActiveView} />
        </div>
    );
};

// --- View Components ---
const HomeView: React.FC<{ card: RFIDCard | null, recentActivity: HistoryItem[], onRechargeClick: () => void }> = ({ card, recentActivity, onRechargeClick }) => (
    <div className="space-y-6">
        {card && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm opacity-80">{card.holderName}</p>
                        <p className="text-lg font-mono tracking-wider">{card.cardNumber}</p>
                    </div>
                    <i className="fa-solid fa-wifi text-xl opacity-80 transform -rotate-45"></i>
                </div>
                <div className="mt-8">
                    <p className="text-sm opacity-80">Balance</p>
                    <p className="text-4xl font-bold">₹{card.balance.toFixed(2)}</p>
                </div>
                 <button onClick={onRechargeClick} className="mt-6 w-full bg-white text-indigo-600 font-bold py-3 rounded-lg shadow-md hover:bg-gray-100 transition-transform transform hover:scale-105">
                    <i className="fa-solid fa-bolt mr-2"></i>
                    Quick Recharge
                </button>
            </div>
        )}
        <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Recent Activity</h2>
            <div className="space-y-3">
                {recentActivity.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                    'fare' in item ? <TripItem key={item.id} item={item} /> : <RechargeItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    </div>
);

const HistoryView: React.FC<{ trips: Trip[], recharges: Recharge[], onDownloadClick: () => void }> = ({ trips, recharges, onDownloadClick }) => {
    const [activeTab, setActiveTab] = useState<'trips' | 'recharges'>('trips');

    return (
        <div>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 mb-4">
                <div className="flex">
                    <button onClick={() => setActiveTab('trips')} className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'trips' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Trips</button>
                    <button onClick={() => setActiveTab('recharges')} className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'recharges' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Recharges</button>
                </div>
                <button onClick={onDownloadClick} title="Download Statement" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-full transition-colors">
                    <i className="fa-solid fa-download text-lg"></i>
                </button>
            </div>
            <div className="space-y-3">
                {activeTab === 'trips' && trips.map(trip => <TripItem key={trip.id} item={trip} />)}
                {activeTab === 'recharges' && recharges.map(recharge => <RechargeItem key={recharge.id} item={recharge} />)}
            </div>
        </div>
    );
};

const RoutesView: React.FC<{ routes: Route[] }> = ({ routes }) => {
    const [search, setSearch] = useState('');
    const filteredRoutes = routes.filter(route => 
        route.routeNumber.toLowerCase().includes(search.toLowerCase()) ||
        route.from.toLowerCase().includes(search.toLowerCase()) ||
        route.to.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="relative mb-6">
                <input 
                    type="text" 
                    placeholder="Search route no. or location"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            <div className="space-y-4">
                {filteredRoutes.map(route => (
                    <div key={route.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">{route.routeNumber}</span>
                             <span className="font-semibold text-lg">₹{route.baseFare}+</span>
                        </div>
                        <div className="flex items-center mt-4">
                            <div className="flex flex-col items-center mr-4">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            </div>
                            <div>
                                <p className="font-semibold">{route.from}</p>
                                <p className="text-gray-500 dark:text-gray-400">{route.to}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ProfileViewProps {
    card: RFIDCard | null;
    user: User | null;
    isAdmin: boolean;
    onSignInClick: () => void;
    onSignUpClick: () => void;
    onSignOut: () => void;
    onAdminLoginClick: () => void;
    onGoToAdminPanel: () => void;
    onLinkNewCard: (newCardNumber: string) => Promise<boolean>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ card, user, isAdmin, onSignInClick, onSignUpClick, onSignOut, onAdminLoginClick, onGoToAdminPanel, onLinkNewCard }) => {
    const [openSection, setOpenSection] = useState<string | null>('account');

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="space-y-4">
            {user && card ? (
                 <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center space-x-4">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-4xl">
                        <span>{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                 </div>
            ) : (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                         <i className="fa-solid fa-user text-4xl text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <h2 className="text-2xl font-bold">Welcome, Passenger</h2>
                    <p className="text-gray-500 dark:text-gray-400">Sign in to manage your profile.</p>
                </div>
            )}
            
            {user ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
                    <CollapsibleSection title="Account" iconClass="fa-user-circle" isOpen={openSection === 'account'} onToggle={() => toggleSection('account')}>
                        <div className="p-4 space-y-3">
                           {isAdmin && (
                                <button onClick={onGoToAdminPanel} className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <i className="fa-solid fa-user-shield w-5 text-center text-gray-500 dark:text-gray-400"></i>
                                    <span>Go to Admin Panel</span>
                                </button>
                            )}
                            <button onClick={onSignOut} className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-500">
                                <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center"></i>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleCardSection card={card} onLinkNewCard={onLinkNewCard} isOpen={openSection === 'card'} onToggle={() => toggleSection('card')} />
                    
                    <CollapsibleSection title="Notifications" iconClass="fa-bell" isOpen={openSection === 'notifications'} onToggle={() => toggleSection('notifications')}>
                        <div className="p-4">
                            <NotificationToggle />
                        </div>
                    </CollapsibleSection>
                    
                    <CollapsibleSection title="Security" iconClass="fa-shield-halved" isOpen={openSection === 'security'} onToggle={() => toggleSection('security')}>
                        <div className="p-4">
                             <button className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <i className="fa-solid fa-key w-5 text-center text-gray-500 dark:text-gray-400"></i>
                                <span>Change Password</span>
                            </button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSyncSection isOpen={openSection === 'sync'} onToggle={() => toggleSection('sync')} />
                </div>
            ) : (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-3">
                     <button onClick={onSignInClick} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                        Sign In
                    </button>
                    <button onClick={onSignUpClick} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Sign Up
                    </button>
                </div>
            )}
            
            {!isAdmin && (
                <div className="text-center pt-2">
                   <button onClick={onAdminLoginClick} className="text-sm text-indigo-500 hover:underline">Admin Login</button>
                </div>
            )}
        </div>
    );
};

const AdminView: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { ResponsiveContainer, LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar } = window.Recharts;

    useEffect(() => {
        setIsLoading(true);
        fetchAdminStats().then(data => {
            setStats(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-500"></i></div>;
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Trips Today</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalTripsToday}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Revenue Today</p>
                    <p className="text-4xl font-bold mt-2">₹{stats.revenueToday.toFixed(2)}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-bold mb-4 ml-4">Daily Revenue (Last 7 Days)</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={stats.dailyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }}/>
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-bold mb-4 ml-4">Daily Trips (Last 7 Days)</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.dailyTrips} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }}/>
                                <Legend />
                                <Bar dataKey="trips" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-bold mb-4 ml-4">User Growth</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={stats.userGrowth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }}/>
                                <Legend />
                                <Line type="monotone" dataKey="users" stroke="#ffc658" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">System Status</h2>
                <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="font-semibold text-green-600 dark:text-green-400">All Systems Operational</p>
                </div>
            </div>
        </div>
    );
};


// --- Helper Components ---

const DownloadModal: React.FC<{ onClose: () => void; onDownload: (format: 'pdf' | 'csv') => void }> = ({ onClose, onDownload }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 relative animate-in slide-in-from-bottom-10 duration-300">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Download Statement</h2>
            <div className="space-y-3">
                <button
                    onClick={() => onDownload('pdf')}
                    className="w-full flex items-center justify-center bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                >
                    <i className="fa-solid fa-file-pdf mr-2"></i> Download as PDF
                </button>
                <button
                    onClick={() => onDownload('csv')}
                    className="w-full flex items-center justify-center bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                    <i className="fa-solid fa-file-csv mr-2"></i> Download as CSV
                </button>
            </div>
        </div>
    </div>
);

const CollapsibleSection: React.FC<{ title: string; iconClass: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, iconClass, isOpen, onToggle, children }) => {
    return (
        <div>
            <button onClick={onToggle} className="w-full flex justify-between items-center p-4 text-left font-semibold">
                <div className="flex items-center space-x-3">
                    <i className={`fa-solid ${iconClass} w-5 text-center text-indigo-500`}></i>
                    <span>{title}</span>
                </div>
                <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );
};

const CollapsibleCardSection: React.FC<{ card: RFIDCard | null; onLinkNewCard: (newCardNumber: string) => Promise<boolean>; isOpen: boolean; onToggle: () => void; }> = ({ card, onLinkNewCard, isOpen, onToggle }) => {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [newCardNumber, setNewCardNumber] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [error, setError] = useState('');

    const handleLink = async () => {
        if (newCardNumber.length !== 8) {
            setError('Card number must be 8 characters.');
            return;
        }
        setError('');
        setIsLinking(true);
        const success = await onLinkNewCard(newCardNumber);
        setIsLinking(false);
        if (success) {
            setShowLinkInput(false);
            setNewCardNumber('');
        } else {
            setError('Failed to link card. Please try again.');
        }
    };

    return (
        <CollapsibleSection title="Manage Card" iconClass="fa-id-card" isOpen={isOpen} onToggle={onToggle}>
            <div className="p-4 space-y-4">
                {card && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                            <span>Card Number</span>
                            <span>Current Balance</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 font-semibold">
                            <span className="font-mono">{card.cardNumber}</span>
                            <span>₹{card.balance.toFixed(2)}</span>
                        </div>
                    </div>
                )}
                
                {showLinkInput ? (
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            value={newCardNumber}
                            onChange={(e) => setNewCardNumber(e.target.value.toUpperCase())}
                            maxLength={8}
                            placeholder="New 8-digit card number"
                            className="w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        />
                         {error && <p className="text-red-500 text-xs">{error}</p>}
                        <div className="flex space-x-2">
                            <button onClick={handleLink} disabled={isLinking} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">
                                {isLinking ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Confirm'}
                            </button>
                            <button onClick={() => setShowLinkInput(false)} className="flex-1 bg-gray-200 dark:bg-gray-600 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowLinkInput(true)} className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i className="fa-solid fa-link w-5 text-center text-gray-500 dark:text-gray-400"></i>
                        <span>Link New Card</span>
                    </button>
                )}
            </div>
        </CollapsibleSection>
    );
};

const CollapsibleSyncSection: React.FC<{ isOpen: boolean; onToggle: () => void; }> = ({ isOpen, onToggle }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState('Never');

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await syncWithCloud();
        if(result.success) {
            setLastSynced(result.lastSynced);
        }
        setIsSyncing(false);
    };

    return (
         <CollapsibleSection title="Data & Sync" iconClass="fa-cloud" isOpen={isOpen} onToggle={onToggle}>
            <div className="p-4 space-y-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Last synced: {lastSynced}</p>
                </div>
                <button onClick={handleSync} disabled={isSyncing} className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors">
                    {isSyncing ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                        <i className="fa-solid fa-rotate"></i>
                    )}
                    <span>{isSyncing ? 'Syncing...' : 'Sync with Cloud'}</span>
                </button>
            </div>
        </CollapsibleSection>
    );
};

const NotificationToggle: React.FC = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    return (
         <div className="flex justify-between items-center p-3">
            <span className="font-medium">Push Notifications</span>
            <label htmlFor="notif-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    id="notif-toggle"
                    className="sr-only peer"
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                    aria-label="Toggle Push Notifications"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
        </div>
    );
};


// --- List Item Components ---
const TripItem: React.FC<{ item: Trip }> = ({ item }) => {
    const statusClasses = item.status === 'Completed' 
        ? 'text-green-500' 
        : item.status === 'Pending' 
        ? 'text-yellow-500' 
        : 'text-red-500';
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full h-12 w-12 flex items-center justify-center">
                <i className="fa-solid fa-bus-simple text-xl"></i>
            </div>
            <div className="flex-1">
                <p className="font-semibold">{item.from} <i className="fa-solid fa-arrow-right mx-1 text-xs text-gray-400"></i> {item.to}</p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{new Date(item.date).toLocaleString()}</span>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                    <span className="font-mono text-xs">ID: {item.id}</span>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-red-500">-₹{item.fare.toFixed(2)}</p>
                <p className={`text-xs font-semibold mt-1 ${statusClasses}`}>{item.status.toUpperCase()}</p>
            </div>
        </div>
    );
};


const RechargeItem: React.FC<{ item: Recharge }> = ({ item }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full h-12 w-12 flex items-center justify-center">
            <i className="fa-solid fa-wallet text-xl"></i>
        </div>
        <div className="flex-1">
            <p className="font-semibold">Card Recharge ({item.paymentMethod})</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleString()}</p>
        </div>
        <div className="text-right">
            <p className="font-bold text-green-500">+₹{item.amount.toFixed(2)}</p>
        </div>
    </div>
);

export default App;