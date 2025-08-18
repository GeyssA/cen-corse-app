import { supabase, supabaseAdmin } from './supabase'

export interface PollOption {
  id?: string
  activity_id: string
  option_text: string
  created_at?: string
}

export interface Vote {
  id?: string
  poll_option_id: string
  voter_id: string
  created_at?: string
}

export interface Activity {
  id?: string
  name: string
  creator_name: string
  location: string
  activity_date: string
  activity_time?: string
  description: string
  pollName?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  pollOptions?: PollOption[]
  votes?: Vote[]
  uniqueParticipants?: number
  votersByOption?: Record<string, string[]>
}



// Récupérer toutes les activités
export async function getActivities(): Promise<Activity[]> {
  try {
    // Récupérer les activités
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })

    if (activitiesError) {
      console.error('Erreur lors de la récupération des activités:', activitiesError)
      return []
    }

    if (!activities || activities.length === 0) {
      return []
    }

    // Récupérer les options de sondage pour chaque activité
    const activitiesWithPolls = await Promise.all(
      activities.map(async (activity) => {
    const { data: pollOptions, error: pollError } = await supabase
      .from('poll_options')
      .select('*')
          .eq('activity_id', activity.id)

    if (pollError) {
      console.error('Erreur lors de la récupération des options de sondage:', pollError)
          return { ...activity, pollOptions: [] }
        }

        // Récupérer les votes pour chaque option
        const pollOptionsWithVotes = await Promise.all(
          (pollOptions || []).map(async (option) => {
        const { data: votes, error: votesError } = await supabase
          .from('votes')
              .select('*')
          .eq('poll_option_id', option.id)

            if (votesError) {
              console.error('Erreur lors de la récupération des votes:', votesError)
              return { ...option, votes: [] }
            }

            return { ...option, votes: votes || [] }
          })
        )

        // Calculer les statistiques
        const allVotes = pollOptionsWithVotes.flatMap(option => option.votes)
        const uniqueVoters = [...new Set(allVotes.map((vote: Vote) => vote.voter_id))]
        const votersByOption: Record<string, string[]> = {}
        
        pollOptionsWithVotes.forEach(option => {
          votersByOption[option.id!] = option.votes.map((vote: Vote) => vote.voter_id)
        })

      return {
        ...activity,
        pollName: activity.poll_name, // Mapping poll_name vers pollName
          pollOptions: pollOptionsWithVotes,
          votes: allVotes,
          uniqueParticipants: uniqueVoters.length,
          votersByOption
        }
      })
    )

    return activitiesWithPolls
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des activités:', error)
    return []
  }
}

// Récupérer une activité par ID
export async function getActivityById(id: string): Promise<Activity | null> {
  try {
    // Récupérer l'activité
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single()

    if (activityError) {
      console.error('Erreur lors de la récupération de l\'activité:', activityError)
      return null
    }

    // Récupérer les options de sondage
    const { data: pollOptions, error: pollError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('activity_id', id)

    if (pollError) {
      console.error('Erreur lors de la récupération des options de sondage:', pollError)
      return { ...activity, pollOptions: [] }
    }

    // Récupérer les votes pour chaque option
    const pollOptionsWithVotes = await Promise.all(
      (pollOptions || []).map(async (option) => {
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('poll_option_id', option.id)

        if (votesError) {
          console.error('Erreur lors de la récupération des votes:', votesError)
          return { ...option, votes: [] }
        }

        return { ...option, votes: votes || [] }
      })
    )

    // Calculer les statistiques
    const allVotes = pollOptionsWithVotes.flatMap(option => option.votes)
    const uniqueVoters = [...new Set(allVotes.map((vote: Vote) => vote.voter_id))]
    const votersByOption: Record<string, string[]> = {}
    
    pollOptionsWithVotes.forEach(option => {
      votersByOption[option.id!] = option.votes.map((vote: Vote) => vote.voter_id)
    })

    return {
      ...activity,
      pollName: activity.poll_name, // Mapping poll_name vers pollName
      pollOptions: pollOptionsWithVotes,
      votes: allVotes,
      uniqueParticipants: uniqueVoters.length,
      votersByOption
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération de l\'activité:', error)
    return null
  }
}

// Créer une nouvelle activité
export async function createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>, pollOptions: string[] = []): Promise<Activity | null> {
  try {
    console.log('🚀 createActivity - Début')
    console.log('📝 ActivityData:', activityData)
    console.log('🗳️ PollOptions:', pollOptions)
    
    // Insérer l'activité
    console.log('📝 Insertion de l\'activité...')
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert(activityData)
      .select()
      .single()

    console.log('📊 Résultat insertion activité:')
    console.log('  - Data:', activity)
    console.log('  - Error:', activityError)

    if (activityError) {
      console.error('❌ Erreur lors de la création de l\'activité:', activityError)
      return null
    }

    // Insérer les options de sondage si fournies
    if (pollOptions.length > 0 && activity) {
      console.log('🗳️ Insertion des options de sondage...')
      const pollOptionsData = pollOptions.map(option => ({
          activity_id: activity.id,
        option_text: option
        }))

      const { error: pollError } = await supabase
          .from('poll_options')
        .insert(pollOptionsData)

      if (pollError) {
        console.error('❌ Erreur lors de l\'insertion des options de sondage:', pollError)
        // On continue quand même, l'activité a été créée
      } else {
        console.log('✅ Options de sondage insérées avec succès')
      }
    }

    console.log('✅ Activité créée avec succès:', activity)
    return activity
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la création de l\'activité:', error)
    if (error instanceof Error) {
      console.error('❌ Type d\'erreur:', error.name)
      console.error('❌ Message d\'erreur:', error.message)
    }
    return null
  }
}

// Mettre à jour une activité
export async function updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | null> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'activité:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour de l\'activité:', error)
    return null
  }
}

// Mettre à jour une activité
export async function updateActivityWithPollOptions(id: string, activityUpdates: Partial<Activity>, pollOptions: string[]): Promise<Activity | null> {
  try {
    console.log('🔄 updateActivityWithPollOptions - Début')
    console.log('📝 ActivityUpdates:', activityUpdates)
    console.log('🗳️ PollOptions:', pollOptions)

    // Mettre à jour l'activité
    const { data: updatedActivity, error: activityError } = await supabase
      .from('activities')
      .update(activityUpdates)
      .eq('id', id)
      .select()
      .single()

    if (activityError) {
      console.error('❌ Erreur lors de la mise à jour de l\'activité:', activityError)
      return null
    }

    // Supprimer les anciennes options de sondage
    const { error: deleteError } = await supabase
      .from('poll_options')
      .delete()
      .eq('activity_id', id)

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression des anciennes options:', deleteError)
    } else {
      console.log('✅ Anciennes options supprimées')
    }

    // Insérer les nouvelles options de sondage
    if (pollOptions.length > 0) {
      const pollOptionsData = pollOptions.map(option => ({
          activity_id: id,
        option_text: option
        }))

        const { error: insertError } = await supabase
          .from('poll_options')
          .insert(pollOptionsData)

        if (insertError) {
          console.error('❌ Erreur lors de l\'ajout des nouvelles options:', insertError)
        } else {
          console.log('✅ Nouvelles options ajoutées')
      }
    }

    console.log('🎉 updateActivityWithPollOptions - Fin avec succès')
    return updatedActivity
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la mise à jour de l\'activité:', error)
    return null
  }
}

// Supprimer une activité (fonction simple comme pour les projets)
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    console.log('🗑️ deleteActivity - Début pour l\'activité:', id)

    // Supprimer d'abord les votes associés aux options de sondage
    console.log('🗑️ Suppression des votes...')
    try {
      const { data: pollOptions, error: pollError } = await supabase
        .from('poll_options')
        .select('id')
        .eq('activity_id', id)

      console.log('📊 PollOptions trouvées:', pollOptions?.length || 0)
      console.log('📊 PollError:', pollError)

      if (pollError) {
        console.error('❌ Erreur lors de la récupération des options de sondage:', pollError)
      } else if (pollOptions && pollOptions.length > 0) {
        const pollOptionIds = pollOptions.map(option => option.id)
        console.log('📊 PollOptionIds à supprimer:', pollOptionIds)
        
        const { error: votesError } = await supabase
          .from('votes')
          .delete()
          .in('poll_option_id', pollOptionIds)

        if (votesError) {
          console.error('❌ Erreur lors de la suppression des votes:', votesError)
        } else {
          console.log('✅ Votes supprimés avec succès')
        }
      } else {
        console.log('ℹ️ Aucune option de sondage trouvée pour cette activité')
      }
    } catch (voteError) {
      console.error('❌ Erreur lors de la suppression des votes:', voteError)
    }

    // Supprimer les options de sondage
    console.log('🗑️ Suppression des options de sondage...')
    try {
      const { error: pollDeleteError } = await supabase
        .from('poll_options')
        .delete()
        .eq('activity_id', id)

      if (pollDeleteError) {
        console.error('❌ Erreur lors de la suppression des options de sondage:', pollDeleteError)
        console.error('❌ Code d\'erreur poll:', pollDeleteError.code)
        console.error('❌ Message d\'erreur poll:', pollDeleteError.message)
      } else {
        console.log('✅ Options de sondage supprimées avec succès')
      }
    } catch (pollError) {
      console.error('❌ Erreur lors de la suppression des options de sondage:', pollError)
    }

    // Supprimer l'activité
    console.log('🔄 Tentative de suppression directe...')
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Erreur avec client normal:', error)
      console.error('❌ Code d\'erreur:', error.code)
      console.error('❌ Message d\'erreur:', error.message)
      
      // Si ça échoue, essayer avec le client admin
      console.log('🔄 Tentative avec client admin...')
      try {
        if (!supabaseAdmin.client) {
          console.error('❌ Client admin non disponible')
          return false
        }
        
        const { error: adminError } = await supabaseAdmin.client
          .from('activities')
          .delete()
          .eq('id', id)
        
        if (adminError) {
          console.error('❌ Erreur avec client admin:', adminError)
          console.error('❌ Code d\'erreur admin:', adminError.code)
          console.error('❌ Message d\'erreur admin:', adminError.message)
          return false
        } else {
          console.log('✅ Activité supprimée avec client admin')
          return true
        }
      } catch (adminError) {
        console.error('❌ Erreur lors de l\'utilisation du client admin:', adminError)
        return false
      }
    } else {
      console.log('✅ Activité supprimée avec client normal')
      return true
    }
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la suppression de l\'activité:', error)
    if (error instanceof Error) {
      console.error('❌ Type d\'erreur:', error.name)
      console.error('❌ Message d\'erreur:', error.message)
    }
    return false
  }
}

// Voter pour une option
export async function voteForOption(pollOptionId: string, voterId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('votes')
      .insert({
        poll_option_id: pollOptionId,
        voter_id: voterId
      })

    if (error) {
      console.error('Erreur lors du vote:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur inattendue lors du vote:', error)
    return false
  }
}

// Récupérer les statistiques de vote pour une activité
export async function getActivityVoteStats(activityId: string): Promise<{
  totalVotes: number
  uniqueVoters: number
  votesByOption: Record<string, number>
}> {
  try {
    const { data: pollOptions, error: pollError } = await supabase
      .from('poll_options')
      .select('id, option_text')
      .eq('activity_id', activityId)

    if (pollError || !pollOptions) {
      return { totalVotes: 0, uniqueVoters: 0, votesByOption: {} }
    }

    const votesByOption: Record<string, number> = {}
    let totalVotes = 0
    const allVoters = new Set<string>()
    
    for (const option of pollOptions) {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('voter_id')
        .eq('poll_option_id', option.id)

      if (!votesError && votes) {
        votesByOption[option.id] = votes.length
        totalVotes += votes.length
        votes.forEach(vote => allVoters.add(vote.voter_id))
      } else {
        votesByOption[option.id] = 0
      }
    }

    return {
      totalVotes,
      uniqueVoters: allVoters.size,
      votesByOption
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de vote:', error)
    return { totalVotes: 0, uniqueVoters: 0, votesByOption: {} }
  }
}

// Vérifier si un utilisateur a voté pour une activité
export async function hasUserVotedForActivity(activityId: string, voterId: string): Promise<boolean> {
  try {
    const { data: pollOptions, error: pollError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('activity_id', activityId)

    if (pollError || !pollOptions || pollOptions.length === 0) {
      return false
    }

    const pollOptionIds = pollOptions.map(option => option.id)
    
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id')
      .in('poll_option_id', pollOptionIds)
      .eq('voter_id', voterId)

    if (votesError) {
      return false
    }

    return votes && votes.length > 0
  } catch (error) {
    console.error('Erreur lors de la vérification du vote:', error)
    return false
  }
} 

// Supprimer un vote
export async function removeVote(pollOptionId: string, voterId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('poll_option_id', pollOptionId)
      .eq('voter_id', voterId)

    if (error) {
      console.error('Erreur lors de la suppression du vote:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression du vote:', error)
    return false
  }
} 

// Tester les permissions d'une activité
export async function testActivityPermissions(activityId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('id')
      .eq('id', activityId)
      .single()

    if (error) {
      console.error('Erreur lors du test des permissions:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Erreur inattendue lors du test des permissions:', error)
    return false
  }
}

// Récupérer les votes d'un utilisateur pour une activité (version robuste)
export async function getUserVotesForActivityRobust(activityId: string, voterId: string): Promise<string[]> {
  try {
    console.log('🔍 getUserVotesForActivityRobust - Début')
    console.log('📊 Paramètres:', { activityId, voterId })

    // Récupérer les options de sondage pour cette activité
    const { data: pollOptions, error: pollError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('activity_id', activityId)

    if (pollError) {
      console.error('❌ Erreur lors de la récupération des options:', pollError)
      return []
    }

    if (!pollOptions || pollOptions.length === 0) {
      console.log('ℹ️ Aucune option de sondage trouvée pour cette activité')
      return []
    }

    console.log('📊 Options trouvées:', pollOptions.length)

    // Récupérer les votes de l'utilisateur pour chaque option
    const userVotes: string[] = []
    
    for (const option of pollOptions) {
      try {
        const { data: votes, error: votesError } = await supabase
          .from('votes')
      .select('id')
          .eq('poll_option_id', option.id)
          .eq('voter_id', voterId)

        if (votesError) {
          console.error(`❌ Erreur lors de la récupération des votes pour l'option ${option.id}:`, votesError)
          continue
        }

        if (votes && votes.length > 0) {
          userVotes.push(option.id)
        }
      } catch (optionError) {
        console.error(`❌ Erreur lors du traitement de l'option ${option.id}:`, optionError)
        continue
      }
    }

    console.log('📊 Votes de l\'utilisateur:', userVotes)
    return userVotes
  } catch (error) {
    console.error('❌ Erreur inattendue dans getUserVotesForActivityRobust:', error)
    return []
  }
} 