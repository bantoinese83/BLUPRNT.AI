import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center page-fade-in">
      <Helmet>
        <title>Page Not Found — BLUPRNT.AI</title>
      </Helmet>

      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-slate-200 overflow-hidden">
            <img src="/bluprnt_logo.svg" alt="BLUPRNT.AI logo" className="h-full w-full object-contain" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mx-auto max-w-[12ch]">
            Lost your way?
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved or the link is broken.
          </p>
        </div>

        <div className="pt-4">
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto font-medium px-8 h-12">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
