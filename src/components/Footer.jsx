import { Github, Twitter, Heart, Activity } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo y copyright */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-gray-400">
              PulseGuard © {currentYear}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/marchanero/PulseGuard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            
            <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-gray-400">
              Hecho con <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> por Roberto
            </span>
          </div>

          {/* Versión */}
          <div className="text-xs text-slate-400 dark:text-gray-500">
            v1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
