import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.ts';
import { useAuthStore } from '../store/authStore.ts';
import api from '../services/api.ts';
// import { Users, Play, Settings } from 'lucide-react'; // If lucide-react was installed

interface Player {
    userId: string;
    name: string;
    avatar?: string;
    isHost?: boolean; // Mock for now, need to fetch room details to know host
}

const Lobby = () => {
    const { code } = useParams<{ code: string }>();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const socket = useSocket(code || '');
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost, setIsHost] = useState(false); // Should determine from API response
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await api.get(`/rooms/${code}`);
                setPlayers(res.data.players);
                if (res.data.status === 'PLAYING') {
                    navigate(`/game/${code}`);
                    return;
                }
                if (res.data.hostId._id === user?.id || res.data.hostId === user?.id) {
                    setIsHost(true);
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                navigate('/');
            }
        };
        fetchRoom();
    }, [code, user, navigate]);

    useEffect(() => {
        if (!socket) return;

        socket.on('player_joined', (data: any) => {
            if (typeof data === 'object' && data.players) {
                setPlayers(data.players);
                if (data.hostId === user?.id) {
                    setIsHost(true);
                }
            } else {
                setPlayers(data);
            }
        });

        socket.on('game_started', () => {
            console.log('Game started event received');
            // alert('Game is starting!'); // Optional debug
            navigate(`/game/${code}`);
        });

        return () => {
            socket.off('player_joined');
            socket.off('game_started');
        };
    }, [socket, navigate, code]);

    const startGame = () => {
        if (socket) {
            socket.emit('start_game', { roomCode: code });
        }
    };

    const handleLeaveRoom = () => {
        if (socket && user?.id) {
            socket.emit('leave_room', { roomCode: code, userId: user.id });
            navigate('/');
        }
    };

    if (loading) return <div className="text-white p-10">Loading Lobby...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl p-6 mt-10">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Lobby: <span className="tracking-widest font-mono">{code}</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-gray-400">
                            Players: {players.length} / 8
                        </div>
                        <button
                            onClick={handleLeaveRoom}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
                        >
                            Exit
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                    {players.map((player) => (
                        <div key={player.userId} className="flex flex-col items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold mb-3">
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold truncate w-full text-center">{player.name}</span>
                            {player.userId === user?.id && <span className="text-xs text-green-400 mt-1">(You)</span>}
                        </div>
                    ))}

                    {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex flex-col items-center p-4 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
                            <div className="w-16 h-16 rounded-full bg-gray-600/50 mb-3"></div>
                            <span className="text-gray-500">Empty</span>
                        </div>
                    ))}
                </div>

                {isHost ? (
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={startGame}
                            className="py-3 px-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 transition-all"
                        >
                            Start Game
                        </button>
                        <button className="py-3 px-6 bg-gray-700 rounded-full font-semibold hover:bg-gray-600 transition-colors">
                            Settings
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 animate-pulse">
                        Waiting for host to start...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Lobby;
