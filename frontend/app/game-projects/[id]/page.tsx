import { GameProjectDetailClient } from "./game-project-detail-client"

export function generateStaticParams() {
  return [{ id: "static-export-placeholder" }]
}

export const dynamicParams = false

export default function GameProjectDetailPage({ params }: { params: { id: string } }) {
  return <GameProjectDetailClient params={params} />
}
