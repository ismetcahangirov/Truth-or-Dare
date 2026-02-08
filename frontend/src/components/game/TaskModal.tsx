interface TaskModalProps {
    type: 'TRUTH' | 'DARE';
    content: string;
    onVote: (vote: 'complete' | 'incomplete') => void;
    playerName: string;
    askedBy?: string;
    votesProgress: { completedVotes: number, incompleteVotes: number, totalVotes: number, required: number };
    isTargetPlayer: boolean;
    userVote: 'complete' | 'incomplete' | null;
}

const TaskModal = ({ type, content, onVote, playerName, votesProgress, isTargetPlayer, userVote }: TaskModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 p-8 rounded-2xl max-w-lg w-full text-center border-4 ${type === 'TRUTH' ? 'border-blue-500' : 'border-red-500'}`}>
                <h2 className={`text-4xl font-black mb-2 ${type === 'TRUTH' ? 'text-blue-400' : 'text-red-500'}`}>
                    {type}
                </h2>
                <h3 className="text-xl text-yellow-500 mb-6 font-bold">
                    {playerName}'s Turn
                </h3>

                <p className="text-2xl text-white mb-8 font-serif italic">
                    "{content}"
                </p>

                {votesProgress.required > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                            <span className="text-green-400">✓ Complete: {votesProgress.completedVotes}</span>
                            <span className="text-red-400">✗ Incomplete: {votesProgress.incompleteVotes}</span>
                        </div>
                        <div className="text-lg text-gray-300 mb-2">
                            Total Votes: {votesProgress.totalVotes} / {votesProgress.required}
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4">
                            <div
                                className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${(votesProgress.totalVotes / votesProgress.required) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {!isTargetPlayer && (
                    <div className="space-y-3">
                        {userVote ? (
                            <div className="text-gray-300 py-4">
                                Your vote: <span className={userVote === 'complete' ? 'text-green-400' : 'text-red-400'}>{userVote === 'complete' ? '✓ Complete' : '✗ Incomplete'}</span>
                            </div>
                        ) : (
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => onVote('complete')}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-colors"
                                >
                                    ✓ Complete
                                </button>
                                <button
                                    onClick={() => onVote('incomplete')}
                                    className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-white transition-colors"
                                >
                                    ✗ Incomplete
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {isTargetPlayer && (
                    <p className="text-gray-400 text-sm mt-4">Waiting for other players to vote...</p>
                )}
            </div>
        </div>
    );
};

export default TaskModal;
