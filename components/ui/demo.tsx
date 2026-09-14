import CloudLoader from "@/components/ui/quantum-cloud-loader";

export default function Page() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-black transition-colors duration-300">
      <div className="w-full max-w-xl px-4">
        <CloudLoader />
      </div>
    </div>
  );
}
