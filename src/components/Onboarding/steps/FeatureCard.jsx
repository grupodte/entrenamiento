import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, bullets }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full flex flex-col justify-center items-center text-center "
    >
      <h2 className="text-[35px] text-[#000000] w-[272px] mb-4 leading-none">
        {title}
      </h2>

      {description && (
        <p className="text-[#000000] leading-snug w-[272px] mx-auto  text-[20px]">
          {description}
        </p>
      )}

      {bullets?.length > 0 && (
        <ul className="flex flex-col items-center space-y-3 mt-4 w-full ">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-center justify-center text-[#000000] text-center leading-none text-[20px]"
            >
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

export default FeatureCard;
