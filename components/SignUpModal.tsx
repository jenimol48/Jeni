import React, { useState } from 'react';

interface SignUpModalProps {
  onClose: () => void;
  onSignUp: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onClose, onSignUp }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [signUpStatus, setSignUpStatus] = useState<'success' | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        setError('');
        setIsProcessing(true);
        const result = await onSignUp(name, email, password);
        setIsProcessing(false);
        if (result.success) {
            setSignUpStatus('success');
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            setError(result.message || 'An unknown error occurred.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative transform transition-all animate-in slide-in-from-bottom-10 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Create Account</h2>
                
                {!signUpStatus ? (
                    <form onSubmit={handleSignUp}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                         <div className="mb-4">
                            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                id="signup-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                id="signup-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="8+ characters"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isProcessing ? (
                                <i className="fa-solid fa-spinner fa-spin text-xl"></i>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <i className="fa-solid fa-circle-check text-green-500 text-6xl mb-4"></i>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Account Created!</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome, {name}!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignUpModal;