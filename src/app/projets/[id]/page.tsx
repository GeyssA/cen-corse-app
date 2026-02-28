import ProjectDetailsClient from './ProjectDetailsClient'
import { defaultProjects } from './projectsData'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  return defaultProjects.map(({ id }) => ({ id: id.toString() }))
}

interface ProjectDetailsPageProps {
  params: { id: string }
}

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const projectId = Number(params.id)
  return <ProjectDetailsClient projectId={projectId} initialProjects={defaultProjects} />
}

