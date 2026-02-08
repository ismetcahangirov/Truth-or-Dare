import { motion } from 'framer-motion';

interface CoinProps {
    side: 'heads' | 'tails' | null;
    flipping: boolean;
    onFlip: () => void;
    disabled?: boolean;
}

const Coin = ({ side, flipping, onFlip, disabled = false }: CoinProps) => {
    return (
        <div className="flex flex-col items-center gap-4">
            <motion.div
                animate={{ rotateY: flipping ? 1800 : 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className={`w-32 h-32 rounded-full bg-yellow-400 border-4 border-yellow-600 shadow-xl flex items-center justify-center text-4xl font-bold text-yellow-800 transition-transform ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                    }`}
                onClick={disabled ? undefined : onFlip}
            >
                {flipping ? '...' : (side === 'heads' ? 'T' : 'D')} {/* T for Truth, D for Dare */}
            </motion.div>
            <p className="text-gray-300 font-semibold">
                {flipping ? 'Flipping...' : side ? (side === 'heads' ? 'TRUTH' : 'DARE') : disabled ? 'Waiting for host...' : 'Click to Flip'}
            </p>
        </div>
    );
};

export default Coin;
