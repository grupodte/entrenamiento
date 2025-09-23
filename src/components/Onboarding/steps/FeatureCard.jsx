import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, bullets }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center h-full flex flex-col justify-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl mx-auto mb-6">
        <span>{icon}</span>
      </div>
      <h2 className="text-3xl font-bold text-white/95 mb-4">{title}</h2>
      {description && (
        <p className="text-white/75 leading-relaxed max-w-md mx-auto">{description}</p>
      )}
      {bullets?.length > 0 && (
        <ul className="text-left text-white/80 space-y-3 max-w-md mx-auto mt-4">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-cyan-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

export default FeatureCard;
