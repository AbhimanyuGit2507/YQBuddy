import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { ArrowLeft, ExternalLink, Scan, Settings, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../../lib/api';
import { useAuth } from '../../../../components/AuthContext';
import { useQueueSocket } from '../../../../hooks/useQueueSocket';
import { toast } from 'sonner';
import { QueueHeader } from '../../../../components/queue/QueueHeader';
import { QueueControls } from '../../../../components/queue/QueueControls';
import { TokenList } from '../../../../components/queue/TokenList';
import { SettingsPanel } from '../../../../components/queue/SettingsPanel';
import { ChatDrawer } from '../../../../components/queue/ChatDrawer';

export default function QueueWorkspace() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const activeTab = (router.query.tab as 'workspace' | 'settings') || 'workspace';
  const setActiveTab = (tab: 'workspace' | 'settings') => {
    router.push({ query: { ...router.query, tab } }, undefined, { shallow: true });
  };
  
  // Chat State
  const [chatToken, setChatToken] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  
  // Settings Form Builder State
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [nextQueueId, setNextQueueId] = useState<string>('');
  const [allowAppointments, setAllowAppointments] = useState(false);
  const [requireManualCheckIn, setRequireManualCheckIn] = useState(false);
  const [appointmentGranularityMins, setAppointmentGranularityMins] = useState(15);

  const { data: allQueues = [] } = useQuery({
    queryKey: ['queues'],
    queryFn: () => fetchApi('/queue'),
  });

  const queryClient = useQueryClient();

  const { data: queue = null, refetch: refetchQueue } = useQuery({
    queryKey: ['queue', id],
    queryFn: async () => {
      const q = await fetchApi(`/queue/${id}`);
      if (q) {
        setQueueName(q.name);
        setNextQueueId(q.nextQueueId || '');
        setAllowAppointments(q.allowAppointments || false);
        setRequireManualCheckIn(q.requireManualCheckIn || false);
        setAppointmentGranularityMins(q.appointmentGranularityMins || 15);
        setFormConfig(q.formConfig || [
          { id: 'name', type: 'text', label: 'Full Name', required: true, system: true },
          { id: 'phone', type: 'phone', label: 'WhatsApp Number', required: true, system: true },
        ]);
      }
      return q;
    },
    enabled: !!id,
  });

  const { data: tokens = [], refetch } = useQuery({
    queryKey: ['queueTokens', id],
    queryFn: () => fetchApi(`/queue/${id}/tokens`),
    enabled: !!id,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', chatToken?.id],
    queryFn: () => fetchApi(`/messages/token/${chatToken.id}`),
    enabled: !!chatToken?.id,
    refetchInterval: 5000,
  });

  const { joinRoom } = useQueueSocket({
    queueId: id as string,
    onTokenJoined: () => refetch(),
    onTokenServing: () => refetch(),
    onTokenCompleted: () => refetch(),
    onTokenMissed: () => refetch(),
    onNewMessage: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  useEffect(() => {
    if (id) joinRoom(id as string);
  }, [id, joinRoom]);

  const servingToken = tokens.find((t: any) => t.status === 'SERVING');

return (
    <AdminLayout pageTitle={queue?.name || 'Queue'} pageSubtitle="Queue workspace">
      <Head>
        <title>Manage {queueName || 'Queue'} | QMover</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <QueueHeader
          queueName={queueName}
          queueId={id as string}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdmin={user?.role === 'TENANT_ADMIN'}
        />

        {activeTab === 'workspace' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <p className="text-zinc-400 text-sm">Ready to serve visitors</p>
            <QueueControls queueId={id as string} servingToken={servingToken} />
            <TokenList
              tokens={tokens}
              queueId={id as string}
              nextQueueId={queue?.nextQueueId}
              onChat={setChatToken}
            />
          </div>
        ) : (
          <SettingsPanel
            queueId={id as string}
            queueName={queueName}
            formConfig={formConfig}
            setQueueName={setQueueName}
            setFormConfig={setFormConfig}
            allQueues={allQueues}
            nextQueueId={nextQueueId}
            setNextQueueId={setNextQueueId}
            allowAppointments={allowAppointments}
            setAllowAppointments={setAllowAppointments}
            requireManualCheckIn={requireManualCheckIn}
            setRequireManualCheckIn={setRequireManualCheckIn}
            appointmentGranularityMins={appointmentGranularityMins}
            setAppointmentGranularityMins={setAppointmentGranularityMins}
          />
        )}
      </div>

      <ChatDrawer
        chatToken={chatToken}
        messages={messages}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        onClose={() => setChatToken(null)}
      />
    </AdminLayout>
  );
}
