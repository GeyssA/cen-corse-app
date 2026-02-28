import PresentationClient from './PresentationClient'
import { employeesData } from './employeesData'

export async function generateStaticParams() {
  return employeesData.map(({ id }) => ({ id }))
}

interface PresentationPageProps {
  params: { id: string }
}

export default function PresentationPage({ params }: PresentationPageProps) {
  return <PresentationClient id={params.id} />
}

