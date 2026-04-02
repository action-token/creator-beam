
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { PostcardDisplay } from "~/components/beam/postcard-display"
import { api } from "~/utils/api"



function BeamPage() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const router = useRouter()
    const id = router.query as { id: string }

    const { data } = api.beam.getBeamWithToken.useQuery({ id: id.id, token })
    console.log("BeamPage data:", data)
    if (data?.error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Beam Not Found</h1>
                    <p className="text-white/70 mb-8">This beam may have expired or been deleted.</p>
                    <Link href="/" className="text-white hover:underline">
                        Return Home
                    </Link>
                </div>
            </div>
        )
    }
    if (data?.beam) {
        return <PostcardDisplay beam={data.beam} token={token ?? ""} />
    }
}

export default BeamPage
