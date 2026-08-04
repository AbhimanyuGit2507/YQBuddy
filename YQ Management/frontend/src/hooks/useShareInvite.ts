export function useShareInvite(inviteCode: string, workspaceName?: string) {
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`You're invited to join ${workspaceName || 'our workspace'} on Qmova`);
    const body = encodeURIComponent(
      `Hi there!\n\nYou've been invited to join ${workspaceName || 'our workspace'} on Qmova.\n\nJoin Code: ${inviteCode}\nJoin Link: ${window.location.origin}/join?code=${inviteCode}\n\nClick the link or enter the code to get started!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi! You're invited to join ${workspaceName || 'our workspace'} on Qmova.\n\nJoin Code: ${inviteCode}\nJoin Link: ${window.location.origin}/join?code=${inviteCode}\n\nClick the link or enter the code to get started!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return { shareViaEmail, shareViaWhatsApp };
}
