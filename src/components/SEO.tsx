import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

export default function SEO({
  title = 'CEN Corse - Plateforme de collaboration',
  description = 'Application de gestion des projets et activités communautaires du CEN Corse. Découvrez nos projets de conservation de la biodiversité en Corse.',
  keywords = ['CEN Corse', 'biodiversité', 'conservation', 'nature', 'Corse', 'environnement'],
  image = '/logo_pwa_format.png',
  url = 'https://your-domain.com',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = []
}: SEOProps) {
  const fullTitle = title.includes('CEN Corse') ? title : `${title} - CEN Corse`
  const fullImage = image.startsWith('http') ? image : `${url}${image}`

  return (
    <Head>
      {/* Métadonnées de base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author || 'CEN Corse'} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="fr" />
      <meta name="revisit-after" content="7 days" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="CEN Corse" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Article spécifique */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Hreflang pour le multilinguisme */}
      <link rel="alternate" hrefLang="fr" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Métadonnées PWA */}
      <meta name="application-name" content="CEN Corse" />
      <meta name="apple-mobile-web-app-title" content="CEN Corse" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="theme-color" content="#3b82f6" />

      {/* Métadonnées de performance */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

      {/* Preconnect pour les domaines externes */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://your-supabase-domain.supabase.co" />

      {/* DNS prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />

      {/* Manifest PWA */}
      <link rel="manifest" href="/manifest.json" />

      {/* Icônes */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/logo_pwa_format.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/logo_pwa_format.png" />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': type === 'article' ? 'Article' : 'Organization',
            name: 'CEN Corse',
            description: description,
            url: url,
            logo: fullImage,
            ...(type === 'article' && {
              headline: title,
              author: {
                '@type': 'Organization',
                name: author || 'CEN Corse'
              },
              publisher: {
                '@type': 'Organization',
                name: 'CEN Corse',
                logo: {
                  '@type': 'ImageObject',
                  url: fullImage
                }
              },
              datePublished: publishedTime,
              dateModified: modifiedTime,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': url
              }
            })
          })
        }}
      />
    </Head>
  )
}













