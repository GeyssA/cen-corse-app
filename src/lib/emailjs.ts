// Configuration EmailJS
export const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_votre_service_id',
  TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_votre_template_id',
  PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'votre_public_key'
}

// Template pour l'email de signalement
export const SIGNALEMENT_TEMPLATE = {
  to_email: 'arnaud.geyssels@gmail.com',
  subject: 'Signalement de problème - Application CEN Corse'
}
