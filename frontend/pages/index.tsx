import Head from "next/head";
import SalesForm from "@/components/SalesForm";

export default function Home() {
  return (
    <>
      <Head>
        <title>Sales Insight Automator</title>
        <meta
          name="description"
          content="AI-powered sales analytics and executive summary generator"
        />
      </Head>
      <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#f8fafc]">
        {/* Subtle gradient blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-100/60 to-violet-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-emerald-100/50 to-sky-100/30 blur-3xl" />
        <SalesForm />
      </main>
    </>
  );
}
