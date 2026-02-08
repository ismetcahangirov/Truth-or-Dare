import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.ts';
import api from '../services/api.ts';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', { username, email, password });
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-white">Register</h2>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition duration-200"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
