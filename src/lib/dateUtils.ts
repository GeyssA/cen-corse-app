/**
 * Utilitaires pour le formatage des dates
 */

/**
 * Formate une date au format DD/MM/AAAA
 * @param dateString - Date au format ISO (YYYY-MM-DD) ou autre format
 * @returns Date formatée en DD/MM/AAAA
 */
export function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Date invalide:', dateString);
      return dateString; // Retourner la chaîne originale si invalide
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return dateString; // Retourner la chaîne originale en cas d'erreur
  }
}

/**
 * Formate une heure au format HH:MM
 * @param timeString - Heure au format HH:MM:SS ou HH:MM
 * @returns Heure formatée en HH:MM
 */
export function formatTimeToHHMM(timeString: string): string {
  if (!timeString) return '';
  
  try {
    // Si c'est déjà au format HH:MM, le retourner tel quel
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    // Si c'est au format HH:MM:SS, enlever les secondes
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString.substring(0, 5);
    }
    
    return timeString;
  } catch (error) {
    console.error('Erreur lors du formatage de l\'heure:', error);
    return timeString;
  }
}

/**
 * Vérifier si une activité est passée
 * @param activityDate - Date de l'activité au format YYYY-MM-DD
 * @param activityTime - Heure de l'activité au format HH:MM (optionnel)
 * @returns true si l'activité est passée
 */
export function isActivityPast(activityDate: string, activityTime?: string): boolean {
  if (!activityDate) return false;
  
  try {
    const today = new Date();
    const activityDateTime = new Date(activityDate);
    
    // Si l'activité a une heure, l'inclure dans la comparaison
    if (activityTime) {
      const [hours, minutes] = activityTime.split(':');
      activityDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    return activityDateTime < today;
  } catch (error) {
    console.error('Erreur lors de la vérification de la date:', error);
    return false;
  }
}

/**
 * Vérifier si une activité est aujourd'hui
 * @param activityDate - Date de l'activité au format YYYY-MM-DD
 * @returns true si l'activité est aujourd'hui
 */
export function isActivityToday(activityDate: string): boolean {
  if (!activityDate) return false;
  
  try {
    const today = new Date();
    const activityDateObj = new Date(activityDate);
    
    return activityDateObj.toDateString() === today.toDateString();
  } catch (error) {
    console.error('Erreur lors de la vérification de la date:', error);
    return false;
  }
}

/**
 * Vérifier si une activité est dans le futur
 * @param activityDate - Date de l'activité au format YYYY-MM-DD
 * @param activityTime - Heure de l'activité au format HH:MM (optionnel)
 * @returns true si l'activité est dans le futur
 */
export function isActivityFuture(activityDate: string, activityTime?: string): boolean {
  if (!activityDate) return false;
  
  try {
    const today = new Date();
    const activityDateTime = new Date(activityDate);
    
    // Si l'activité a une heure, l'inclure dans la comparaison
    if (activityTime) {
      const [hours, minutes] = activityTime.split(':');
      activityDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    return activityDateTime > today;
  } catch (error) {
    console.error('Erreur lors de la vérification de la date:', error);
    return false;
  }
}
