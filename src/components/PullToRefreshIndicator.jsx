import { motion } from 'framer-motion';
import {
    PULL_THRESHOLD,
    PULL_INDICATOR_MAX_HEIGHT_ADDITION,
    MIN_PULL_DISPLAY_THRESHOLD,
    PULL_OPACITY_THRESHOLD_DIVISOR
} from '../utils/constants';

const PullToRefreshIndicator = ({ isRefreshing, pullDistance }) => {
    const clamped = Math.min(pullDistance, PULL_THRESHOLD + PULL_INDICATOR_MAX_HEIGHT_ADDITION);
    const opacity = Math.min(clamped / (PULL_THRESHOLD / PULL_OPACITY_THRESHOLD_DIVISOR), 1);
    const showSpinner = clamped > MIN_PULL_DISPLAY_THRESHOLD;

    const containerVariants = {
        hidden: { scale: 0.95, opacity: 0 },
        visible: { scale: 1, opacity: opacity, transition: { duration: 0.3, ease: 'easeOut' } }
    };

    const spinnerTransition = {
        loop: Infinity,
        ease: "linear",
        duration: 1
    };

    return (
        <motion.div
            className="w-full flex justify-center items-end overflow-hidden"
            style={{ height: `${clamped}px` }}
            initial="hidden"
            animate={clamped > 0 ? "visible" : "hidden"}
            variants={containerVariants}
        >
            {isRefreshing ? (
                <motion.div
                    className="mb-2 w-6 h-6 border-[3px] border-l-transparent border-white rounded-full shadow-md"
                    animate={{ rotate: 360 }}
                    transition={spinnerTransition}
                />
            ) : (
                showSpinner && (
                    <div className="mb-2 w-5 h-5 border-[3px] border-white/40 border-b-transparent rounded-full" />
                )
            )}
        </motion.div>
    );
};

export default PullToRefreshIndicator;
