import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.ts';
import { useAuthStore } from '../store/authStore.ts';
import Bottle from '../components/game/Bottle.tsx';
import Coin from '../components/game/Coin.tsx';
import TaskModal from '../components/game/TaskModal.tsx';

const GameRoom = () => {
    const { code } = useParams<{ code: string }>();
    const socket = useSocket(code || '');
    const [players, setPlayers] = useState<any[]>([]);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                if (!code) return;
                const res = await fetch(`http://localhost:5000/api/rooms/${code}`, {
                    headers: {
                        'Authorization': `Bearer ${useAuthStore.getState().token}`
                    }
                });
                const data = await res.json();
                if (data.players) {
                    setPlayers(data.players);
                }
            } catch (err) {
                console.error("Failed to fetch room:", err);
            }
        };
        fetchRoom();
    }, [code]);

    // Game State
    const [bottleRotation, setBottleRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showCoin, setShowCoin] = useState(false);
    const [coinSide, setCoinSide] = useState<'heads' | 'tails' | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [currentTask, setCurrentTask] = useState<{ type: 'TRUTH' | 'DARE', content: string, askedBy?: string } | null>(null);

    // Question submission states
    const [showQuestionInput, setShowQuestionInput] = useState(false);
    // const [submittedQuestions, setSubmittedQuestions] = useState<any[]>([]); // Unused
    const [hasSubmittedQuestion, setHasSubmittedQuestion] = useState(false);
    const [questionProgress, setQuestionProgress] = useState({ current: 0, total: 0 });
    const [votesProgress, setVotesProgress] = useState({ completedVotes: 0, incompleteVotes: 0, totalVotes: 0, required: 0 });
    const [userVote, setUserVote] = useState<'complete' | 'incomplete' | null>(null);
    const [taskResult, setTaskResult] = useState<'complete' | 'incomplete' | null>(null);

    // Scoreboard
    const [scores, setScores] = useState<{ userId: string, userName: string, score: number }[]>([]);

    // Responsive Radius Logic
    const [radius, setRadius] = useState(250);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [taskType, setTaskType] = useState<'TRUTH' | 'DARE' | null>(null);
    const [hostId, setHostId] = useState<string | null>(null);

    const currentUser = useAuthStore((state) => state.user);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setRadius(120); // Mobile
            else if (width < 1024) setRadius(180); // Tablet
            else setRadius(250); // Desktop
        };
        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ... (socket useEffect) ...
    // Note: I will need to intelligently merge this with the existing socket useEffect or create a new one to avoid overwriting too much and losing context.
    // Instead of replacing everything, let's just use the existing socket effect and add the new state handling.

    useEffect(() => {
        if (!socket) return;

        socket.on('player_joined', (data) => {
            if (typeof data === 'object' && data.players) {
                setPlayers(data.players);
                setHostId(data.hostId);
            } else {
                // Fallback for old format
                setPlayers(data);
            }
        });

        socket.on('spin_result', ({ angle, targetPlayerId, targetPlayerName }) => {
            setIsSpinning(true);
            setBottleRotation(angle);
            setSelectedPlayer(null);
            setSelectedPlayerId(targetPlayerId);

            setTimeout(() => {
                setIsSpinning(false);
                setShowCoin(true);
                if (targetPlayerName) {
                    setSelectedPlayer(targetPlayerName);
                }
            }, 3000);
        });

        socket.on('coin_flip_result', ({ side, taskType: type }) => {
            setIsFlipping(true);
            setTaskType(type);
            setTimeout(() => {
                setIsFlipping(false);
                setCoinSide(side);
                setTimeout(() => {
                    setShowCoin(false);
                    // Initialize task session on backend
                    socket.emit('init_task_session', {
                        roomCode: code,
                        targetPlayerId: selectedPlayerId,
                        targetPlayerName: selectedPlayer,
                        taskType: type
                    });
                    // Show question input for non-target players
                    if (currentUser?.id !== selectedPlayerId) {
                        setShowQuestionInput(true);
                    } else {
                        // Target player waits for questions
                        setCurrentTask({
                            type: type,
                            content: 'Waiting for questions...'
                        });
                    }
                }, 1000);
            }, 2000);
        });

        socket.on('questions_updated', ({ current, total }) => {
            setQuestionProgress({ current, total });
        });

        socket.on('question_selected', ({ question, askedBy }) => {
            setShowQuestionInput(false);
            setCurrentTask({
                type: taskType || 'TRUTH',
                content: question,
                askedBy
            });
        });

        socket.on('votes_updated', ({ completedVotes, incompleteVotes, totalVotes, required }) => {
            setVotesProgress({ completedVotes, incompleteVotes, totalVotes, required });
        });

        socket.on('task_result', ({ result }) => {
            setTaskResult(result);
        });

        socket.on('scores_updated', (scoresArray) => {
            setScores(scoresArray);
        });

        socket.on('turn_complete', () => {
            // Reset all states
            setCurrentTask(null);
            setCoinSide(null);
            setSelectedPlayer(null);
            setSelectedPlayerId(null);
            setCoinSide(null);
            setSelectedPlayer(null);
            setSelectedPlayerId(null);
            setShowQuestionInput(false);
            // setSubmittedQuestions([]);
            setHasSubmittedQuestion(false);
            setQuestionProgress({ current: 0, total: 0 });
            setVotesProgress({ completedVotes: 0, incompleteVotes: 0, totalVotes: 0, required: 0 });
            setUserVote(null);
            setTaskResult(null);
            setTaskType(null);
        });

        return () => {
            socket.off('spin_result');
            socket.off('coin_flip_result');
            socket.off('questions_updated');
            socket.off('question_selected');
            socket.off('votes_updated');
            socket.off('task_result');
            socket.off('scores_updated');
            socket.off('turn_complete');
        };
    }, [socket, selectedPlayerId, currentUser, code, selectedPlayer, taskType]);

    const handleSpin = () => {
        socket?.emit('spin_request', { roomCode: code });
    };

    const handleCoinFlip = () => {
        socket?.emit('coin_flip_request', { roomCode: code });
    };

    const handleVote = (vote: 'complete' | 'incomplete') => {
        if (currentUser?.id) {
            socket?.emit('vote_task', { roomCode: code, userId: currentUser.id, vote });
            setUserVote(vote);
        }
    };

    const handleSubmitQuestion = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const question = formData.get('question') as string;

        if (question && currentUser) {
            socket?.emit('submit_question', {
                roomCode: code,
                userId: currentUser.id,
                userName: currentUser.username,
                question
            });
            setHasSubmittedQuestion(true);
        }
    };

    const handleLeaveRoom = () => {
        if (currentUser?.id && socket) {
            socket.emit('leave_room', { roomCode: code, userId: currentUser.id });
            window.location.href = '/';
        }
    };

    const isTargetPlayer = currentUser?.id === selectedPlayerId;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 left-4 z-20 flex gap-4 items-center">
                <h2 className="text-xl font-bold bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">Room: {code}</h2>
                <button
                    onClick={handleLeaveRoom}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg flex items-center gap-2"
                >
                    Exit Room
                </button>
            </div>

            {selectedPlayer && !isSpinning && !currentTask && (
                <div className="absolute top-16 z-20 bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-xl animate-bounce shadow-lg">
                    Selected: {selectedPlayer}
                </div>
            )}

            <div className="relative w-full max-w-4xl h-[400px] sm:h-[500px] md:h-[600px] bg-gray-800 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0">
                    {players.map((player, i) => {
                        const angle = (i / players.length) * 360;
                        const x = radius * Math.cos(angle * Math.PI / 180);
                        const y = radius * Math.sin(angle * Math.PI / 180);
                        return (
                            <div
                                key={player.userId}
                                className="absolute flex flex-col items-center justify-center pointer-events-none"
                                style={{
                                    left: `calc(50% + ${x}px - 2rem)`,
                                    top: `calc(50% + ${y}px - 2rem)`
                                }}
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ring-2 ring-gray-700 shadow-lg relative z-10">
                                    {player.name[0]?.toUpperCase()}
                                </div>
                                <span className="mt-1 text-xs sm:text-sm font-semibold bg-gray-900/50 px-2 py-0.5 rounded text-white whitespace-nowrap z-20">
                                    {player.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="z-10 transform scale-75 sm:scale-100 transition-transform">
                    {!showCoin && !currentTask && !showQuestionInput && (
                        <Bottle
                            rotation={bottleRotation}
                            spinning={isSpinning}
                            onSpin={handleSpin}
                            disabled={isSpinning || showCoin || (currentUser?.id !== hostId)}
                        />
                    )}

                    {showCoin && (
                        <Coin
                            side={coinSide}
                            flipping={isFlipping}
                            onFlip={handleCoinFlip}
                            disabled={currentUser?.id !== hostId}
                        />
                    )}
                </div>
            </div>

            {/* Question Input Modal */}
            {showQuestionInput && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-2xl max-w-lg w-full text-center border-4 border-purple-500">
                        <h2 className="text-3xl font-black mb-2 text-purple-400">
                            Submit a {taskType}
                        </h2>
                        <h3 className="text-lg text-yellow-500 mb-6">
                            For {selectedPlayer}
                        </h3>

                        {!hasSubmittedQuestion ? (
                            <form onSubmit={handleSubmitQuestion}>
                                <textarea
                                    name="question"
                                    rows={4}
                                    className="w-full bg-gray-700 text-white p-4 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder={`Type your ${taskType?.toLowerCase()} question here...`}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-colors w-full"
                                >
                                    Submit Question
                                </button>
                            </form>
                        ) : (
                            <div>
                                <p className="text-gray-300 mb-4">
                                    ✓ Question submitted!
                                </p>
                                <p className="text-sm text-gray-400">
                                    Waiting for other players... ({questionProgress.current}/{questionProgress.total})
                                </p>
                                <div className="mt-4 w-full bg-gray-700 rounded-full h-4">
                                    <div
                                        className="bg-purple-500 h-4 rounded-full transition-all duration-300"
                                        style={{ width: `${(questionProgress.current / questionProgress.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Scoreboard */}
            {scores.length > 0 && (
                <div className="md:absolute md:top-4 md:right-4 z-20 bg-gray-800 rounded-xl p-4 border-2 border-gray-700 min-w-[200px] mt-6 md:mt-0 w-full md:w-auto max-w-md md:max-w-none">
                    <h3 className="text-lg font-bold mb-3 text-center border-b border-gray-600 pb-2">🏆 Scoreboard</h3>
                    <div className="space-y-2">
                        {scores
                            .sort((a, b) => b.score - a.score)
                            .map((player, index) => (
                                <div
                                    key={player.userId}
                                    className={`flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-600/30' :
                                        index === 1 ? 'bg-gray-600/30' :
                                            index === 2 ? 'bg-orange-700/30' : 'bg-gray-700/20'
                                        }`}
                                >
                                    <span className="text-sm font-semibold">
                                        {index === 0 && '🥇 '}
                                        {index === 1 && '🥈 '}
                                        {index === 2 && '🥉 '}
                                        {player.userName}
                                    </span>
                                    <span className="text-lg font-bold text-yellow-400">{player.score}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Task Result */}
            {taskResult && (
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 px-8 py-4 rounded-2xl text-2xl font-black shadow-2xl ${taskResult === 'complete' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {taskResult === 'complete' ? '✓ Task Completed!' : '✗ Task Incomplete!'}
                </div>
            )}

            {/* Task Modal */}
            {currentTask && (
                <TaskModal
                    type={currentTask.type}
                    content={currentTask.content}
                    playerName={selectedPlayer || 'Player'}
                    askedBy={currentTask.askedBy}
                    votesProgress={votesProgress}
                    isTargetPlayer={isTargetPlayer}
                    userVote={userVote}
                    onVote={handleVote}
                />
            )}
        </div>
    );
};

export default GameRoom;
