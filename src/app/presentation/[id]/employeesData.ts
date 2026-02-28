export interface Employee {
  id: string
  name: string
  position: string
  description: string
  photo: string
  bureau: string
  detailedDescription?: string
  formation?: string
  specialites?: string[]
  missions?: string[]
  email?: string
  phone?: string
}

export const employeesData: Employee[] = [
  {
    id: "1",
    name: "Arnaud Geyssels",
    position: "Chargé de projet biodiversité",
    description: "Herpétologue et écologue impliqué dans les suivis faunistiques et projets de recherche en herpétologie.",
    photo: "/photos_personnel/Arnaud Geyssels.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en herpétologie et écologie, je participe à l'élaboration et la réalisation des projets de recherche et de conservation des amphibiens et reptiles de Corse au sein de la structure. Je suis également impliqué dans les projets de conservation et de protection d'espèces menacées de la flore insulaire. Je m'intéresse particulièrement à la génétique, aux travaux en écophysiologie, à la science du rewilding, à la modélisation, aux SIG ainsi qu'aux technologies web/IA (dev. React (Cursor), LLMs…). Avec parcimonie, je suis convaincu que certaines innovations numériques et technologiques peuvent servir des projets à forte valeur ajoutée, notamment en biologie de la conservation.",
    formation: "Master en Biologie des organismes et écologie - Université catholique de Louvain-la-Neuve",
    specialites: [
      "Herpétologie (amphibiens et reptiles)",
      "Écologie terrestre",
      "Biostatistiques",
      "Cartographie (SIG)",
    ],
    email: "arnaud.geyssels@cen-corse.org",
    phone: "07 86 83 55 46"
  },
  {
    id: "2",
    name: "Thomas Muller",
    position: "Chargé d'étude herpétologue et animateur EEDD",
    description: "Spécialiste en écologie et conservation, impliqué dans les projets de protection de la biodiversité insulaire.",
    photo: "/photos_personnel/Thomas Muller.jpg",
    bureau: "Borgo",
    detailedDescription: "Passionné par la biodiversité insulaire, je travaille sur la conservation et la protection des espèces endémiques de Corse. Mon expertise couvre l'écologie des écosystèmes méditerranéens, la gestion des espaces naturels et la mise en œuvre de programmes de conservation. Je m'intéresse particulièrement à la flore insulaire, aux habitats naturels et aux interactions entre les espèces. Mon approche combine les connaissances scientifiques traditionnelles avec les nouvelles technologies de suivi et de cartographie pour optimiser les stratégies de conservation.",
    formation: "Master en Écologie et Gestion de la Biodiversité - Université de Montpellier",
    specialites: [
      "Écologie végétale",
      "Conservation des espèces",
      "Gestion d'espaces naturels",
      "Cartographie des habitats",
    ],
    missions: [
      "Suivi et protection des espèces végétales endémiques",
      "Gestion des espaces naturels protégés",
      "Coordination des programmes de conservation",
      "Formation et sensibilisation à la biodiversité"
    ],
    email: "thomas.muller@cen-corse.org",
    phone: "07 88 30 03 46"
  },
  {
    id: "10",
    name: "Ludovic Lepori",
    position: "Chargé de projets Ornithologie",
    description: "Spécialiste en ornithologie, impliqué dans les projets de suivi et de protection des oiseaux de Corse.",
    photo: "/photos_personnel/Ludovic Lepori.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en ornithologie, je coordonne les projets de suivi et de conservation des oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    email: "ludovic.lepori@cen-corse.org",
    phone: "06.73.06.31.71"
  },
  {
    id: "11",
    name: "Marie-Paule Savelli",
    position: "Chargée de projets Faune",
    description: "Spécialiste en faune terrestre et marine, impliquée dans les projets de suivi et de protection des espèces animales.",
    photo: "/photos_personnel/Marie-Paule Savelli.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en faune terrestre et marine, je coordonne les projets de suivi et de conservation des espèces animales de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, les mammifères marins et les espèces endémiques insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Faune terrestre",
      "Faune marine",
      "Suivi des populations",
      "Protection des habitats",
    ],
    email: "mariepaule.savelli@cen-corse.org",
    phone: "06.70.14.00.40"
  },
  {
    id: "12",
    name: "Sarah Ferjani",
    position: "Chargée de projets Gestion de Site",
    description: "Spécialiste en gestion de sites naturels, impliquée dans la gestion et la protection des espaces naturels.",
    photo: "/photos_personnel/Sarah Ferjani.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en gestion de sites naturels, je coordonne les projets de gestion et de protection des espaces naturels de Corse. Mon expertise couvre la planification de la gestion, le suivi écologique, la restauration d'habitats et la coordination des actions de conservation sur le terrain. Je travaille en étroite collaboration avec les gestionnaires de sites, les partenaires locaux et les équipes techniques pour assurer une gestion efficace et durable des espaces naturels.",
    formation: "Master en Gestion des Espaces Naturels - Université de Corse",
    specialites: [
      "Gestion de sites naturels",
      "Planification de la gestion",
      "Suivi écologique",
      "Restauration d'habitats",
    ],
    email: "sarah.ferjani@cen-corse.org",
    phone: "06.73.06.10.39"
  },
  {
    id: "3",
    name: "Audrey Favale",
    position: "Directrice",
    description: "Directrice du CEN Corse, responsable de la gestion globale de l'association et de la coordination des projets.",
    photo: "/photos_personnel/Audrey Favale.jpg",
    bureau: "Borgo",
    detailedDescription: "En tant que Directrice du CEN Corse, je pilote la stratégie globale de l'association et coordonne l'ensemble des actions de conservation et de protection de la biodiversité insulaire. Mon rôle consiste à assurer la cohérence des projets, la gestion des équipes et le développement des partenariats institutionnels. Je m'efforce de maintenir l'excellence scientifique tout en favorisant l'innovation dans nos approches de conservation.",
    formation: "Formation en gestion et direction d'association environnementale",
    specialites: [
      "Direction d'association",
      "Gestion de projet",
      "Partenariats institutionnels",
      "Stratégie de conservation",
    ],
    missions: [
      "Pilotage stratégique de l'association",
      "Coordination des équipes et projets",
      "Développement des partenariats",
      "Représentation institutionnelle"
    ],
    email: "audrey.favale@cen-corse.org",
    phone: "07.88.30.03.46"
  },
  {
    id: "4",
    name: "Laetitia Antonelli",
    position: "Responsable d'antenne et pôle foncier",
    description: "Responsable de l'antenne d'Ajaccio et du pôle foncier, spécialisée dans la gestion des espaces naturels.",
    photo: "/photos_personnel/Laetitia Antonelli.jpg",
    bureau: "Ajaccio",
    detailedDescription: "Responsable de l'antenne d'Ajaccio et du pôle foncier, je coordonne les actions de gestion et de protection des espaces naturels en Corse. Mon expertise couvre l'acquisition foncière, la gestion des terrains protégés et la coordination des actions de conservation sur le territoire. Je travaille en étroite collaboration avec les propriétaires, les collectivités et les partenaires pour assurer la préservation de notre patrimoine naturel.",
    formation: "Formation en gestion foncière et environnementale",
    specialites: [
      "Gestion foncière",
      "Coordination d'antenne",
      "Protection des espaces naturels",
      "Partenariats territoriaux",
    ],
    missions: [
      "Gestion du pôle foncier",
      "Coordination de l'antenne d'Ajaccio",
      "Acquisition et gestion de terrains",
      "Développement de partenariats locaux"
    ],
    email: "laetitia.antonelli@cen-corse.org",
    phone: "07.88.02.53.26"
  },
  {
    id: "5",
    name: "Maud Marsicano",
    position: "Assistante administrative et comptable",
    description: "Assistante administrative et comptable, responsable de la gestion administrative et financière de l'association.",
    photo: "/photos_personnel/Maud Marsicano.jpg",
    bureau: "Borgo",
    detailedDescription: "En tant qu'assistante administrative et comptable, je gère l'ensemble des aspects administratifs et financiers du CEN Corse. Mon rôle consiste à assurer le bon fonctionnement administratif de l'association, la gestion comptable, la préparation des dossiers administratifs et le suivi des procédures. Je contribue à la transparence et à la rigueur de la gestion de l'association.",
    formation: "Formation en administration et comptabilité associative",
    specialites: [
      "Administration associative",
      "Comptabilité",
      "Gestion administrative",
      "Procédures administratives",
    ],
    missions: [
      "Gestion administrative de l'association",
      "Comptabilité et suivi financier",
      "Préparation des dossiers administratifs",
      "Support administratif aux équipes"
    ]
  },
  {
    id: "6",
    name: "Margaux Bourot",
    position: "Chargée de communication",
    description: "Chargée de communication, responsable de la communication interne et externe de l'association.",
    photo: "/photos_personnel/Margaux Bourot.jpg",
    bureau: "Borgo",
    detailedDescription: "En tant que chargée de communication, je développe et coordonne la stratégie de communication du CEN Corse. Mon rôle consiste à valoriser nos actions de conservation, sensibiliser le public à la biodiversité insulaire et maintenir une image positive de l'association. Je travaille sur la communication digitale, les relations presse et l'organisation d'événements de sensibilisation.",
    formation: "Formation en communication et marketing",
    specialites: [
      "Communication digitale",
      "Relations presse",
      "Événementiel",
      "Sensibilisation environnementale",
    ],
    missions: [
      "Développement de la stratégie de communication",
      "Gestion des réseaux sociaux et du site web",
      "Relations presse et médias",
      "Organisation d'événements de sensibilisation"
    ]
  },
  {
    id: "7",
    name: "Carole Attie",
    position: "Chargée de mission Ornithologie",
    description: "Spécialiste en ornithologie et suivi des populations d'oiseaux de Corse.",
    photo: "/photos_personnel/Carole Attie.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en ornithologie, je coordonne les programmes de suivi et de conservation des oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    missions: [
      "Suivi des populations d'oiseaux de Corse",
      "Protection des espèces menacées",
      "Coordination des programmes de conservation",
      "Formation et sensibilisation"
    ],
    email: "carole.attie@cen-corse.org",
    phone: "04 95 32 71 63"
  },
  {
    id: "8",
    name: "Nicolas Pailhes",
    position: "Chargé de mission Flore/hydrologie",
    description: "Expert en flore insulaire et hydrologie, spécialisé dans la gestion des écosystèmes aquatiques.",
    photo: "/photos_personnel/Nicolas Pailhes.jpg",
    bureau: "Borgo",
    detailedDescription: "Expert en flore insulaire et hydrologie, je travaille sur la connaissance et la protection de la flore endémique de Corse ainsi que sur la gestion des écosystèmes aquatiques. Mon expertise couvre l'identification des espèces végétales, l'étude des habitats humides, la gestion des cours d'eau et la restauration écologique. Je m'intéresse particulièrement aux espèces rares et menacées, aux zones humides et aux interactions entre la flore et les milieux aquatiques.",
    formation: "Master en Biologie Végétale et Écologie - Université de Corse",
    specialites: [
      "Flore insulaire",
      "Hydrologie",
      "Gestion des écosystèmes aquatiques",
      "Restauration écologique",
    ],
    missions: [
      "Inventaire et suivi de la flore endémique",
      "Gestion des écosystèmes aquatiques",
      "Protection des zones humides",
      "Restauration des habitats"
    ],
    email: "nicolas.pailhes@cen-corse.org",
    phone: "04 95 32 71 63"
  },
  {
    id: "9",
    name: "Delphine Triponel",
    position: "Chargée de mission Mesures Compensatoires",
    description: "Spécialiste en mesures compensatoires et gestion des impacts environnementaux.",
    photo: "/photos_personnel/Delphine Triponel.jpg",
    bureau: "Ajaccio",
    detailedDescription: "Spécialiste en mesures compensatoires, je coordonne la mise en œuvre des actions de compensation environnementale pour les projets d'aménagement en Corse. Mon expertise couvre l'évaluation des impacts environnementaux, la conception de mesures compensatoires adaptées et le suivi de leur efficacité. Je travaille en étroite collaboration avec les maîtres d'ouvrage, les bureaux d'études et les services de l'État pour assurer une compensation environnementale efficace et durable.",
    formation: "Master en Droit de l'Environnement - Université de Corse",
    specialites: [
      "Mesures compensatoires",
      "Évaluation d'impacts environnementaux",
      "Droit de l'environnement",
      "Gestion de projets d'aménagement",
    ],
    missions: [
      "Coordination des mesures compensatoires",
      "Évaluation des impacts environnementaux",
      "Accompagnement des maîtres d'ouvrage",
      "Suivi de l'efficacité des compensations"
    ],
    email: "delphine.triponel@cen-corse.org",
    phone: "04 95 32 71 63"
  },
  {
    id: "13",
    name: "Sébastien Cart",
    position: "Chargé d'étude Ornithologie",
    description: "Spécialiste en ornithologie, impliqué dans les études et le suivi des populations d'oiseaux de Corse.",
    photo: "/photos_personnel/Sébastien Cart.jpg",
    bureau: "Ajaccio",
    detailedDescription: "Spécialiste en ornithologie, je réalise des études et des suivis des populations d'oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    email: "sebastien.cart@cen-corse.org",
    phone: "06.78.61.25.21"
  },
  {
    id: "14",
    name: "Gabin Tijou",
    position: "Chargé d'étude Ornithologie",
    description: "Spécialiste en ornithologie, impliqué dans les études et le suivi des populations d'oiseaux de Corse.",
    photo: "/photos_personnel/Gabin Tijou.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en ornithologie, je réalise des études et des suivis des populations d'oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    email: "gabin.tijou@cen-corse.org",
    phone: "07.55.59.16.80"
  },
  {
    id: "15",
    name: "Fabien Valles",
    position: "Chargé d'étude Ornithologie & mesures compensatoires",
    description: "Spécialiste en ornithologie et mesures compensatoires, impliqué dans les études et la gestion des impacts environnementaux.",
    photo: "/photos_personnel/Fabien Valles.jpg",
    bureau: "Ajaccio",
    detailedDescription: "Spécialiste en ornithologie et mesures compensatoires, je réalise des études sur les populations d'oiseaux et coordonne la mise en œuvre des actions de compensation environnementale. Mon expertise couvre l'identification des espèces, le suivi des populations, l'évaluation des impacts environnementaux et la conception de mesures compensatoires adaptées. Je travaille en étroite collaboration avec les équipes techniques et les partenaires pour assurer une conservation efficace des avifaunes et une compensation environnementale durable.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Mesures compensatoires",
      "Suivi des populations d'oiseaux",
      "Évaluation d'impacts environnementaux",
    ],
    email: "fabien.valles@cen-corse.org",
    phone: "06.73.06.48.52"
  },
  {
    id: "16",
    name: "Clément Thomas",
    position: "Chargé de projet",
    description: "Chargé de projet dans le développement de la prise en compte des enjeux ornithologiques dans l'agriculture.",
    photo: "/photos_personnel/Clément Thomas.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialisé dans l'intégration des enjeux ornithologiques dans les pratiques agricoles, je développe des projets innovants pour concilier agriculture et biodiversité. Mon travail consiste à créer des ponts entre les agriculteurs et les enjeux de conservation des oiseaux, en proposant des solutions pratiques et durables.",
    formation: "Master en Agronomie et Environnement - École Supérieure d'Agriculture d'Angers",
    specialites: [
      "Agroécologie",
      "Conservation des oiseaux",
      "Gestion des espaces agricoles",
      "Concertation territoriale"
    ],
    missions: [
      "Développement de projets agricoles respectueux de la biodiversité",
      "Accompagnement des agriculteurs dans la prise en compte des enjeux ornithologiques",
      "Mise en place de mesures agro-environnementales",
      "Animation de réseaux d'acteurs agricoles et environnementaux"
    ],
    email: "clement.thomas@cen-corse.org",
    phone: "06.XX.XX.XX.XX"
  }
]

