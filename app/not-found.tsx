import Link from "next/link";
import { NotFoundTracker } from "@/components/not-found-tracker";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <NotFoundTracker />
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Página não encontrada
        </h2>
        <p className="text-gray-500 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary transition-colors font-medium"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
