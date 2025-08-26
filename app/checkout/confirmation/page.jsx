'use client';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useCart } from '../../context/CartContext';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCart();
  
  // Vide le panier à l'arrivée sur la page de confirmation
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line
  }, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring' }}
        className="bg-white/90 rounded-3xl shadow-2xl p-10 max-w-lg w-full flex flex-col items-center border border-indigo-100 backdrop-blur-lg"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.5 }}
          className="mb-6"
        >
          <CheckCircle2 size={70} className="text-green-500 drop-shadow-lg animate-bounce" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-2xl md:text-3xl font-extrabold text-indigo-700 mb-2 text-center"
        >
          Commande confirmée !
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-gray-700 mb-4 text-center"
        >
          Merci pour votre achat.<br />
          <span className="text-indigo-600 font-bold">Numéro de commande :</span>
          <br />
          <span className="text-lg font-mono text-indigo-900">{orderId}</span>
        </motion.p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04 }}
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold shadow-lg hover:from-indigo-700 hover:to-blue-600 transition-all"
          onClick={() => router.push('/')}
        >
          Retour à l'accueil
        </motion.button>
      </motion.div>
    </div>
  );
}
  

