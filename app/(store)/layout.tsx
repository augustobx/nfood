import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

async function getConfig() {
  const config = await prisma.systemConfig.findFirst();
  return config || null;
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfig();
  
  const primary = config?.primaryColor || '#f97316';
  const secondary = config?.secondaryColor || '#9333ea';

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 relative">
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --brand-primary: ${primary};
          --brand-secondary: ${secondary};
        }
        
        /* Overrides for orange (Primary) */
        .bg-orange-50 { background-color: color-mix(in srgb, var(--brand-primary) 10%, white) !important; }
        .bg-orange-100 { background-color: color-mix(in srgb, var(--brand-primary) 20%, white) !important; }
        .bg-orange-500, .bg-orange-600, .hover\\:bg-orange-600:hover { background-color: var(--brand-primary) !important; }
        .text-orange-500, .text-orange-600 { color: var(--brand-primary) !important; }
        .border-orange-200, .border-orange-300, .border-orange-500 { border-color: var(--brand-primary) !important; }
        .ring-orange-500 { --tw-ring-color: var(--brand-primary) !important; }
        .shadow-orange-500\\/20, .shadow-orange-500\\/30, .shadow-[0_0_100px_rgba(249,115,22,0.4)] { 
            box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; 
        }

        /* Overrides for purple (Secondary) */
        .bg-purple-50 { background-color: color-mix(in srgb, var(--brand-secondary) 10%, white) !important; }
        .bg-purple-100 { background-color: color-mix(in srgb, var(--brand-secondary) 20%, white) !important; }
        .bg-purple-600, .bg-purple-700, .hover\\:bg-purple-700:hover { background-color: var(--brand-secondary) !important; }
        .text-purple-600, .text-purple-700, .text-purple-800 { color: var(--brand-secondary) !important; }
        .border-purple-200, .border-purple-400 { border-color: var(--brand-secondary) !important; }
        .ring-purple-600 { --tw-ring-color: var(--brand-secondary) !important; }
        
        .bg-brand-primary { background-color: var(--brand-primary) !important; }
      `}} />
      
      {/* Background with optional blur */}
      {config?.backgroundUrl && (
         <div className="fixed inset-0 z-[-1] pointer-events-none">
            <img src={config.backgroundUrl} alt="bg" className={`w-full h-full object-cover ${config.backgroundBlur ? 'blur-md backdrop-blur-md opacity-80' : 'opacity-100'}`} />
         </div>
      )}
      
      <Navbar config={config} />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
      <footer className="w-full bg-white border-t py-6 mt-12">
        <div className="container max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {config?.appName || 'nfood'} Online. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
