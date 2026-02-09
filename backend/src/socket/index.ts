import { Server, Socket } from 'socket.io';
import GameRoom from '../models/GameRoom';
import User from '../models/User';

// In-memory storage for active game sessions
const gameSessions: Map<string, {
    targetPlayerId: string;
    targetPlayerName: string;
    questions: { userId: string, userName: string, question: string }[];
    selectedQuestion: string | null;
    completedVotes: Set<string>;
    incompleteVotes: Set<string>;
    taskType: 'TRUTH' | 'DARE';
    playersWhoHadBottle: Set<string>;
    playerScores: Map<string, number>;
}> = new Map();

export const socketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {

        socket.on('join_room', async ({ roomCode, user }) => {
            try {
                const room = await GameRoom.findOne({ code: roomCode });
                if (!room) {
                    socket.emit('error', 'Room not found');
                    return;
                }
                socket.join(roomCode);

                const existingPlayer = room.players.find(p => p.userId.toString() === user.id);
                if (!existingPlayer) {
                    room.players.push({ userId: user.id, socketId: socket.id, name: user.username, avatar: user.avatar });
                    await room.save();
                } else {
                    existingPlayer.socketId = socket.id;
                    await room.save();
                }
                io.to(roomCode).emit('player_joined', {
                    players: room.players,
                    hostId: room.hostId.toString()
                });

                // Initialize or get session
                let session = gameSessions.get(roomCode);
                if (!session) {
                    session = {
                        targetPlayerId: '',
                        targetPlayerName: '',
                        questions: [],
                        selectedQuestion: null,
                        completedVotes: new Set(),
                        incompleteVotes: new Set(),
                        taskType: 'TRUTH',
                        playersWhoHadBottle: new Set(),
                        playerScores: new Map()
                    };
                    // Initialize scores for all players
                    room.players.forEach(p => {
                        session!.playerScores.set(p.userId.toString(), 0);
                    });
                    gameSessions.set(roomCode, session);
                }

                // Send current scores
                const scoresArray = Array.from(session.playerScores.entries()).map(([userId, score]) => {
                    const player = room.players.find(p => p.userId.toString() === userId);
                    return { userId, userName: player?.name || 'Unknown', score };
                });
                io.to(roomCode).emit('scores_updated', scoresArray);
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('start_game', async ({ roomCode }) => {
            try {
                const room = await GameRoom.findOne({ code: roomCode });
                if (room) {
                    room.status = 'PLAYING';
                    await room.save();
                    console.log(`Game starting for room: ${roomCode}. Emitting game_started to all.`);
                    io.to(roomCode).emit('game_started');
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('spin_request', async ({ roomCode }) => {
            try {
                const room = await GameRoom.findOne({ code: roomCode });
                if (!room || room.players.length === 0) return;

                const session = gameSessions.get(roomCode);
                if (!session) return;

                let targetIndex: number;
                const playerCount = room.players.length;

                // First round: ensure everyone gets it once
                const playersNotYetSelected = room.players.filter(p =>
                    !session.playersWhoHadBottle.has(p.userId.toString())
                );

                if (playersNotYetSelected.length > 0) {
                    // Pick from players who haven't had it yet
                    const randomIdx = Math.floor(Math.random() * playersNotYetSelected.length);
                    targetIndex = room.players.findIndex(p => p.userId === playersNotYetSelected[randomIdx].userId);
                } else {
                    // Everyone has had it at least once, pick randomly
                    targetIndex = Math.floor(Math.random() * playerCount);
                }

                const targetPlayer = room.players[targetIndex];
                session.playersWhoHadBottle.add(targetPlayer.userId.toString());

                // Set target player in session (backend is source of truth)
                session.targetPlayerId = targetPlayer.userId.toString();
                session.targetPlayerName = targetPlayer.name;

                const segmentAngle = 360 / playerCount;
                const targetAngle = targetIndex * segmentAngle;
                const finalAngle = 1440 + targetAngle + 90;

                io.to(roomCode).emit('spin_result', {
                    angle: finalAngle,
                    targetPlayerId: targetPlayer.userId,
                    targetPlayerName: targetPlayer.name
                });
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('coin_flip_request', ({ roomCode }) => {
            const side = Math.random() > 0.5 ? 'heads' : 'tails';
            const taskType: 'TRUTH' | 'DARE' = side === 'heads' ? 'TRUTH' : 'DARE';

            // Initialize session on backend automatically
            const session = gameSessions.get(roomCode);
            if (session) {
                session.taskType = taskType;
                session.questions = [];
                session.selectedQuestion = null;
                session.completedVotes.clear();
                session.incompleteVotes.clear();
            }

            io.to(roomCode).emit('coin_flip_result', { side, taskType });
        });

        socket.on('submit_question', async ({ roomCode, userId, userName, question }) => {
            try {
                const room = await GameRoom.findOne({ code: roomCode });
                if (!room) return;

                let session = gameSessions.get(roomCode);
                if (!session) {
                    console.error('No active session for room:', roomCode);
                    return;
                }

                session.questions.push({ userId, userName, question });

                io.to(roomCode).emit('questions_updated', {
                    questions: session.questions,
                    total: room.players.length - 1,
                    current: session.questions.length
                });

                if (session.questions.length >= room.players.length - 1) {
                    const randomIndex = Math.floor(Math.random() * session.questions.length);
                    session.selectedQuestion = session.questions[randomIndex].question;

                    io.to(roomCode).emit('question_selected', {
                        question: session.selectedQuestion,
                        askedBy: session.questions[randomIndex].userName
                    });
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('vote_task', async ({ roomCode, userId, vote }) => {
            try {
                const room = await GameRoom.findOne({ code: roomCode });
                if (!room) return;

                let session = gameSessions.get(roomCode);
                if (!session) return;

                // Track vote
                if (vote === 'complete') {
                    session.completedVotes.add(userId);
                    session.incompleteVotes.delete(userId);
                } else {
                    session.incompleteVotes.add(userId);
                    session.completedVotes.delete(userId);
                }

                const totalVotes = session.completedVotes.size + session.incompleteVotes.size;
                const required = room.players.length - 1;

                io.to(roomCode).emit('votes_updated', {
                    completedVotes: session.completedVotes.size,
                    incompleteVotes: session.incompleteVotes.size,
                    totalVotes,
                    required
                });

                // Early majority exit: Check if we have a majority
                const majority = Math.ceil(required / 2);
                let result: 'complete' | 'incomplete' | null = null;

                if (session.completedVotes.size > majority) {
                    result = 'complete';
                } else if (session.incompleteVotes.size > majority) {
                    result = 'incomplete';
                } else if (totalVotes >= required) {
                    // All votes are in, determine final result
                    if (session.completedVotes.size > session.incompleteVotes.size) {
                        result = 'complete';
                    } else if (session.incompleteVotes.size > session.completedVotes.size) {
                        result = 'incomplete';
                    } else {
                        // Tie - random
                        result = Math.random() > 0.5 ? 'complete' : 'incomplete';
                    }
                }

                // If we have a result, process it
                if (result) {
                    // Award points if completed to the TARGET player ONLY
                    if (result === 'complete' && session.targetPlayerId) {
                        const currentScore = session.playerScores.get(session.targetPlayerId) || 0;
                        session!.playerScores.set(session.targetPlayerId, currentScore + 1);
                    }

                    // Send updated scores
                    const scoresArray = Array.from(session.playerScores.entries()).map(([userId, score]) => {
                        const player = room.players.find(p => p.userId.toString() === userId);
                        return { userId, userName: player?.name || 'Unknown', score };
                    });
                    io.to(roomCode).emit('scores_updated', scoresArray);

                    io.to(roomCode).emit('task_result', { result });

                    // Reset for next turn
                    setTimeout(() => {
                        session!.questions = [];
                        session!.selectedQuestion = null;
                        session!.completedVotes.clear();
                        session!.incompleteVotes.clear();
                        io.to(roomCode).emit('turn_complete');
                    }, 3000);
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('init_task_session', ({ roomCode, targetPlayerId, targetPlayerName, taskType }) => {
            let session = gameSessions.get(roomCode);
            if (session) {
                // Only update if not already set by backend (backward compatibility)
                if (!session.targetPlayerId) {
                    session.targetPlayerId = targetPlayerId;
                }
                if (!session.targetPlayerName) {
                    session.targetPlayerName = targetPlayerName;
                }
                if (!session.taskType) {
                    session.taskType = taskType;
                }
                session.questions = [];
                session.selectedQuestion = null;
                session.completedVotes.clear();
                session.incompleteVotes.clear();
            }

            io.to(roomCode).emit('task_session_ready', { taskType });
        });

        socket.on('task_complete', ({ roomCode }) => {
            io.to(roomCode).emit('turn_ended');
        });

        socket.on('leave_room', async ({ roomCode, userId }) => {
            try {
                const room = await GameRoom.findOne({ code: roomCode });
                if (!room) return;

                // Remove player
                room.players = room.players.filter(p => p.userId.toString() !== userId);

                if (room.players.length === 0) {
                    // Delete room if empty
                    await GameRoom.deleteOne({ code: roomCode });
                    gameSessions.delete(roomCode);
                    console.log(`Room ${roomCode} deleted (no players left)`);
                } else {
                    // Update room and notify others
                    // If host left, assign new host (optional logic)
                    if (room.hostId.toString() === userId) {
                        room.hostId = room.players[0].userId;
                        await room.save(); // Save the new host
                    } else {
                        await room.save();
                    }

                    io.to(roomCode).emit('player_joined', {
                        players: room.players,
                        hostId: room.hostId.toString()
                    });
                }

                socket.leave(roomCode);
            } catch (error) {
                console.error(error);
            }
        });
    });
};
