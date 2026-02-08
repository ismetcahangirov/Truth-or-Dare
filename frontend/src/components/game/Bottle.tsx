import { motion } from 'framer-motion';

interface BottleProps {
    rotation: number;
    spinning: boolean;
    onSpin: () => void;
    disabled: boolean;
}

const Bottle = ({ rotation, spinning, onSpin, disabled }: BottleProps) => {
    return (
        <div className="relative w-40 h-40 sm:w-64 sm:h-64 flex flex-col items-center justify-center gap-4">
            <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: spinning ? 3 : 0.5, ease: "easeOut" }}
                className={`w-12 h-32 sm:w-16 sm:h-48 bg-gradient-to-b from-green-400 to-green-800 rounded-full border-4 border-green-900 shadow-2xl relative ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                    } transition-transform`}
                style={{ transformOrigin: "center center" }}
                onClick={!disabled ? onSpin : undefined}
            >
                {/* Bottle Neck */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full w-6 h-12 bg-green-700 border-2 border-green-900 rounded-t-md"></div>
            </motion.div>
            {disabled && !spinning && (
                <p className="text-gray-400 text-sm">Waiting for host to spin...</p>
            )}
        </div>
    );
};

export default Bottle;
