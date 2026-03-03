import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardGame } from '../useCardGame';

export const ActionNotification: React.FC = () => {
  const message = useCardGame(s => s.message);
  const phase = useCardGame(s => s.phase);
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([]);
  const [lastMessage, setLastMessage] = useState('');
  let notifId = 0;

  useEffect(() => {
    if (message && message !== lastMessage) {
      setLastMessage(message);
      if (phase === 'pay_debt' || phase === 'action_response' ||
          message.includes('stole') || message.includes('charges') ||
          message.includes('blocks') || message.includes('Birthday')) {
        const id = Date.now();
        setNotifications(prev => [...prev.slice(-2), { id, text: message }]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
      }
    }
  }, [message, phase, lastMessage]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/95 backdrop-blur border border-yellow-500/30 rounded-xl px-5 py-2.5 shadow-xl shadow-black/30"
          >
            <span className="text-yellow-300 font-semibold text-sm">{n.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
