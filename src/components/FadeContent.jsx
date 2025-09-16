import { motion } from 'framer-motion';

const FadeContent = ({
    children,
    className = '',
    delay = 0,
    blur = false,
    ...props
}) => {
    const variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.8,
                delay: delay / 1000,
                ease: 'easeOut'
            }
        }
    };

    return (
        <motion.div
            className={`${className} ${blur ? 'backdrop-blur-sm' : ''}`}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }} // Triggers when 50% of the element is in view
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default FadeContent;
