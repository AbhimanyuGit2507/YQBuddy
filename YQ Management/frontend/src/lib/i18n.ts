export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
];

export const translations = {
  en: {
    joinQueue: 'Join Queue',
    fullName: 'Full Name',
    phoneNumber: 'WhatsApp Number (Optional)',
    joinButton: 'Get My Token',
    joining: 'Joining...',
    
    // Status Page
    statusTitle: 'Your Status',
    queueName: 'Queue',
    yourPosition: 'Your Position',
    estimatedWait: 'Estimated Wait',
    servingNow: 'Now Serving',
    
    itIsYourTurn: "It's your turn!",
    proceedToCounter: "Please proceed to the counter.",
    waitingInLine: "Waiting in line",
    peopleAhead: "people ahead of you",
    youAreNext: "You are next!",
    
    leaveQueue: "Leave Queue",
    cancelConfirm: "Are you sure you want to cancel your token?",
    yesCancel: "Yes, Cancel",
    keepWaiting: "No, Keep Waiting",
    
    tokenCancelled: "Your token was cancelled.",
    tokenCompleted: "Thanks for visiting!"
  },
  es: {
    joinQueue: 'Unirse a la Fila',
    fullName: 'Nombre Completo',
    phoneNumber: 'Número de WhatsApp (Opcional)',
    joinButton: 'Obtener Mi Turno',
    joining: 'Uniéndose...',
    
    statusTitle: 'Tu Estado',
    queueName: 'Fila',
    yourPosition: 'Tu Posición',
    estimatedWait: 'Espera Estimada',
    servingNow: 'Atendiendo Ahora',
    
    itIsYourTurn: "¡Es tu turno!",
    proceedToCounter: "Por favor, pasa al mostrador.",
    waitingInLine: "Esperando en línea",
    peopleAhead: "personas delante de ti",
    youAreNext: "¡Eres el siguiente!",
    
    leaveQueue: "Salir de la Fila",
    cancelConfirm: "¿Estás seguro de que quieres cancelar tu turno?",
    yesCancel: "Sí, Cancelar",
    keepWaiting: "No, Seguir Esperando",
    
    tokenCancelled: "Tu turno fue cancelado.",
    tokenCompleted: "¡Gracias por visitarnos!"
  },
  fr: {
    joinQueue: 'Rejoindre la File',
    fullName: 'Nom Complet',
    phoneNumber: 'Numéro WhatsApp (Optionnel)',
    joinButton: 'Obtenir Mon Ticket',
    joining: 'Rejoindre...',
    
    statusTitle: 'Votre Statut',
    queueName: 'File',
    yourPosition: 'Votre Position',
    estimatedWait: 'Attente Estimée',
    servingNow: 'En Cours',
    
    itIsYourTurn: "C'est votre tour !",
    proceedToCounter: "Veuillez vous rendre au guichet.",
    waitingInLine: "En attente",
    peopleAhead: "personnes devant vous",
    youAreNext: "Vous êtes le prochain !",
    
    leaveQueue: "Quitter la File",
    cancelConfirm: "Êtes-vous sûr de vouloir annuler votre ticket ?",
    yesCancel: "Oui, Annuler",
    keepWaiting: "Non, Continuer d'Attendre",
    
    tokenCancelled: "Votre ticket a été annulé.",
    tokenCompleted: "Merci de votre visite !"
  }
};

export function t(lang: string, key: keyof typeof translations['en']): string {
  const dictionary = translations[lang as keyof typeof translations] || translations.en;
  return dictionary[key] || translations.en[key] || key;
}
