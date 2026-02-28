/**
 * Script de diagnostic pour vérifier la configuration des emails Supabase
 * Exécuter avec: node deploy/diagnose-email-config.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 DIAGNOSTIC DE LA CONFIGURATION EMAIL SUPABASE\n')
console.log('=' .repeat(60))

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ ERREUR: Variables d\'environnement manquantes!')
  console.log('\nVérifiez que votre fichier .env.local contient:')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL')
  console.log('  - SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseSuapbaseEmailConfig() {
  console.log('\n📋 ÉTAPES DE DIAGNOSTIC\n')
  
  // 1. Vérifier la connexion à Supabase
  console.log('1️⃣  Vérification de la connexion à Supabase...')
  try {
    const { data, error } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      console.log('   ❌ Erreur de connexion:', error.message)
      return
    }
    console.log('   ✅ Connexion établie avec succès')
    console.log(`   📊 Utilisateurs dans la base: ${data.users?.length || 0}`)
  } catch (err) {
    console.log('   ❌ Erreur inattendue:', err.message)
    return
  }

  // 2. Vérifier les utilisateurs récents non confirmés
  console.log('\n2️⃣  Recherche d\'utilisateurs en attente de confirmation...')
  try {
    const { data: allUsers, error } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 100 })
    if (error) {
      console.log('   ❌ Erreur:', error.message)
    } else {
      const unconfirmedUsers = allUsers.users?.filter(u => !u.email_confirmed_at) || []
      if (unconfirmedUsers.length > 0) {
        console.log(`   ⚠️  ${unconfirmedUsers.length} utilisateur(s) en attente de confirmation:`)
        unconfirmedUsers.forEach(u => {
          console.log(`      - ${u.email} (inscrit le ${new Date(u.created_at).toLocaleString('fr-FR')})`)
        })
      } else {
        console.log('   ✅ Aucun utilisateur en attente de confirmation')
      }
    }
  } catch (err) {
    console.log('   ❌ Erreur inattendue:', err.message)
  }

  // 3. Instructions pour vérifier la configuration SMTP
  console.log('\n3️⃣  Configuration SMTP dans Supabase Dashboard')
  console.log('   📍 Allez sur: https://supabase.com/dashboard/project/_/settings/auth')
  console.log('   🔧 Vérifiez dans "SMTP Settings":')
  console.log('      ✓ Serveur SMTP configuré (ex: smtp.gmail.com)')
  console.log('      ✓ Port SMTP (587 pour TLS ou 465 pour SSL)')
  console.log('      ✓ Nom d\'utilisateur / Email d\'expéditeur')
  console.log('      ✓ Mot de passe / Clé d\'application')
  console.log('      ✓ "Enable Custom SMTP" activé')

  // 4. Vérifier les templates d'email
  console.log('\n4️⃣  Templates d\'email')
  console.log('   📍 Allez sur: https://supabase.com/dashboard/project/_/auth/templates')
  console.log('   📧 Vérifiez le template "Confirm signup":')
  console.log('      ✓ Sujet défini')
  console.log('      ✓ Contenu avec le lien {{ .ConfirmationURL }}')
  console.log('      ✓ Pas d\'erreur de syntaxe')

  // 5. Vérifier les URLs de redirection
  console.log('\n5️⃣  URLs de redirection')
  console.log('   📍 Allez sur: https://supabase.com/dashboard/project/_/auth/url-configuration')
  console.log('   🔧 Vérifiez:')
  console.log('      ✓ Site URL: votre domaine de production ou localhost:3000')
  console.log('      ✓ Redirect URLs: incluent toutes vos URLs de callback')

  // 6. Vérifier la configuration Auth
  console.log('\n6️⃣  Configuration Auth')
  console.log('   📍 Allez sur: https://supabase.com/dashboard/project/_/settings/auth')
  console.log('   🔧 Vérifiez:')
  console.log('      ✓ "Enable Email Confirmations" est ACTIVÉ')
  console.log('      ✓ "Enable Email Autoconfirm" est DÉSACTIVÉ')
  console.log('      ✓ "Mailer autoconfirm" est DÉSACTIVÉ')

  // 7. Test d'inscription
  console.log('\n7️⃣  Test d\'inscription')
  console.log('   🧪 Pour tester l\'envoi d\'email:')
  console.log('      1. Allez sur votre page /auth')
  console.log('      2. Créez un compte avec un email RÉEL')
  console.log('      3. Vérifiez les logs dans Supabase Dashboard > Logs > Auth Logs')
  console.log('      4. Cherchez les événements "user.signup" et "email_confirmation_sent"')
  console.log('      5. Si vous voyez des erreurs, notez le message')

  // 8. Vérification des logs
  console.log('\n8️⃣  Logs Supabase')
  console.log('   📍 Allez sur: https://supabase.com/dashboard/project/_/logs/auth-logs')
  console.log('   🔍 Recherchez:')
  console.log('      - Événements "user.signup"')
  console.log('      - Erreurs d\'envoi SMTP')
  console.log('      - Messages "email_confirmation_sent"')

  // 9. Solutions communes
  console.log('\n9️⃣  SOLUTIONS COURANTES AUX PROBLÈMES D\'EMAIL\n')
  console.log('   ❓ L\'email n\'arrive pas:')
  console.log('      → Vérifiez vos spams/courrier indésirable')
  console.log('      → Vérifiez que le SMTP est activé dans Supabase')
  console.log('      → Vérifiez les identifiants SMTP')
  console.log('      → Vérifiez que l\'email d\'expéditeur est vérifié')
  console.log('')
  console.log('   ❓ Erreur SMTP:')
  console.log('      → Gmail: utilisez un "App Password" au lieu du mot de passe')
  console.log('      → Outlook: activez "SMTP Auth" dans les paramètres')
  console.log('      → Vérifiez que le port est correct (587 ou 465)')
  console.log('')
  console.log('   ❓ Email confirmé automatiquement:')
  console.log('      → Désactivez "Enable Email Autoconfirm" dans Supabase')
  console.log('      → Désactivez "Mailer autoconfirm"')
  console.log('')

  console.log('\n' + '='.repeat(60))
  console.log('✅ DIAGNOSTIC TERMINÉ\n')
  console.log('💡 PROCHAINES ÉTAPES:')
  console.log('   1. Suivez les vérifications ci-dessus dans votre Dashboard Supabase')
  console.log('   2. Vérifiez les logs Auth après une tentative d\'inscription')
  console.log('   3. Si le problème persiste, contactez le support Supabase\n')
}

// Exécuter le diagnostic
diagnoseSuapbaseEmailConfig()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Erreur fatale:', err)
    process.exit(1)
  })




