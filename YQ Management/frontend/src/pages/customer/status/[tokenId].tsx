  import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { Bell, MapPin, Clock, Info, XCircle, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerStatus() {
  const router = useRouter();
  const { tokenId } = router.query;

  const { data: statusData, isLoading, error } = useQuery<any, any>({
    queryKey: ['token-status', tokenId],
    queryFn: () => fetchApi(`/token/${tokenId}/status`),
    enabled: !!tokenId,
    refetchInterval: (query) => {
      const state = query.state?.data?.token?.status;
      return state === 'COMPLETED' || state === 'MISSED' ? false : 3000;
    }, 
  });

  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => fetchApi(`/token/${tokenId}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-status', tokenId] });
    }
  });

  const checkInMutation = useMutation({
    mutationFn: () => fetchApi(`/token/${tokenId}/checkin`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-status', tokenId] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !statusData) {
    return <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">Token not found</div>;
  }

  const { token, position, estimatedWaitTime, isScheduled } = statusData;

  const isServing = token.status === 'SERVING';
  const isCompleted = token.status === 'COMPLETED' || token.status === 'MISSED';
  const lang = token.language || 'en';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex flex-col p-6 relative overflow-hidden transition-colors">
      <Head>
        <title>Live Status | QMover</title>
      </Head>

      {/* Decorative Glow depending on status */}
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0 transition-colors duration-1000 ${
        isServing ? 'bg-emerald-600/20' : isCompleted ? 'bg-gray-600/10' : 'bg-indigo-600/10'
      }`}></div>
      <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-0 transition-colors duration-1000 ${
        isServing ? 'bg-emerald-400/20' : isCompleted ? 'bg-gray-400/10' : 'bg-purple-600/10'
      }`}></div>

      <div className="w-full max-w-md mx-auto z-10 flex-1 flex flex-col">
        
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="flex items-center justify-between py-4 mb-6 border-b border-gray-200 dark:border-white/10"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-lg">
              YQ
            </div>
            <span className="font-bold tracking-wide">Qmover Live</span>
          </div>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
            <Bell className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
          </button>
        </motion.header>

        {/* Main Status Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className={`bg-white dark:bg-zinc-900/80 backdrop-blur-xl border ${isServing ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-gray-200 dark:border-white/10 shadow-xl dark:shadow-none'} rounded-3xl p-8 text-center mb-6 transition-all duration-500`}
        >
          
          <motion.div layout className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1">{t(lang, 'statusTitle')}</motion.div>
          <motion.div layout className={`text-2xl font-bold mb-8 ${isServing ? 'text-emerald-500' : isCompleted ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {isServing ? t(lang, 'itIsYourTurn') : token.status === 'MISSED' ? t(lang, 'tokenCancelled') : isCompleted ? t(lang, 'tokenCompleted') : t(lang, 'waitingInLine')}
          </motion.div>

          <motion.div 
            key={token.id}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-2 font-mono tracking-wider"
          >
            {token.id.substring(0, 5).toUpperCase()}
          </motion.div>
          <motion.p layout className="text-sm text-gray-500 dark:text-zinc-500 font-medium mb-8">Hi, {token.customerName}</motion.p>

          <AnimatePresence mode="wait">
            {isScheduled && (
              <motion.div 
                key="scheduled-alert"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden"
              >
                <CalendarCheck className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                <p className="text-indigo-700 dark:text-indigo-400 font-medium mb-2">Appointment Confirmed</p>
                <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70 mb-4">
                  Scheduled for {new Date(token.scheduledFor).toLocaleString()}
                </p>
                
                {token.queue?.requireManualCheckIn ? (
                  <button 
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {checkInMutation.isPending ? 'Checking In...' : 'I Have Arrived (Check In)'}
                  </button>
                ) : (
                  <p className="text-xs text-indigo-500 dark:text-indigo-300">
                    You will be automatically placed in the live queue 15 minutes before your time.
                  </p>
                )}
              </motion.div>
            )}

            {!isServing && !isCompleted && !isScheduled && (
              <motion.div 
                key="waiting-stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-gray-50 dark:bg-black/50 rounded-2xl p-5 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <MapPin className="w-5 h-5 text-gray-400 dark:text-zinc-500 mb-2" />
                  <motion.div 
                    key={position}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
                  >
                    #{position}
                  </motion.div>
                  <div className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium uppercase tracking-wider">{t(lang, 'yourPosition')}</div>
                </div>
                <div className="bg-gray-50 dark:bg-black/50 rounded-2xl p-5 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Clock className="w-5 h-5 text-gray-400 dark:text-zinc-500 mb-2" />
                  <motion.div 
                    key={estimatedWaitTime}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
                  >
                    ~{estimatedWaitTime}m
                  </motion.div>
                  <div className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium uppercase tracking-wider">{t(lang, 'estimatedWait')}</div>
                </div>
              </motion.div>
            )}

            {isServing && (
              <motion.div 
                key="serving-alert"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden"
              >
                <motion.div 
                  animate={{ opacity: [0.3, 0.8, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 2 }} 
                  className="absolute inset-0 bg-emerald-400/10" 
                />
                <p className="text-emerald-700 dark:text-emerald-400 font-medium mb-2 relative z-10">{t(lang, 'proceedToCounter')}</p>
                <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 relative z-10">Show this screen to the operator</p>
              </motion.div>
            )}

            {isCompleted && (
              <motion.div 
                key="completed-alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6"
              >
                <p className="text-gray-600 dark:text-zinc-400 font-medium">{t(lang, 'tokenCompleted')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Box */}
        <AnimatePresence>
          {!isServing && !isCompleted && !isScheduled && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex gap-3"
            >
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Keep this page open</p>
                <p className="text-xs text-blue-700/80 dark:text-blue-400/70 leading-relaxed">
                  We will update your position in real-time. You'll also receive a WhatsApp message when it's your turn.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isServing && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 flex justify-center"
            >
              <button 
                onClick={() => {
                  if (confirm(t(lang, 'cancelConfirm') as string)) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium transition-colors"
              >
                <XCircle className="w-5 h-5" />
                {cancelMutation.isPending ? 'Cancelling...' : t(lang, 'leaveQueue')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
