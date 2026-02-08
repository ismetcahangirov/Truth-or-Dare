import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.ts';
import { useState } from 'react';
import api from '../services/api.ts';

const Home = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState('');

    const createRoom = async () => {
        try {
            const res = await api.post('/rooms');
            navigate(`/lobby/${res.data.code}`);
        } catch (err) {
            console.error(err);
        }
    };

    const joinRoom = () => {
        if (roomCode.trim()) {
            navigate(`/lobby/${roomCode.trim()}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Truth or Dare
            </h1>

            <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
                <div className="text-center">
                    <p className="text-lg">Welcome, <span className="font-bold text-pink-400">{user?.username}</span>!</p>
                </div>

                <button
                    onClick={createRoom}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold hover:scale-105 transition-transform"
                >
                    Create New Group
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">Or Join Existing</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter Room Code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                        onClick={joinRoom}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                    >
                        Join
                    </button>
                </div>

                <button
                    onClick={logout}
                    className="w-full text-sm text-gray-500 hover:text-gray-300 mt-4"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default Home;
