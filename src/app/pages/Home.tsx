import { Moon, Users, Sword, Heart, Mic } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Home() {
  const features = [
    {
      icon: <Sword className="w-8 h-8 text-amber-500" />,
      title: 'Semi-RP Médiéval',
      description: 'Plongez dans un univers médiéval immersif avec un système de roleplay équilibré.',
    },
    {
      icon: <Users className="w-8 h-8 text-amber-500" />,
      title: 'Communauté Active',
      description: 'Rejoignez une communauté passionnée et bienveillante de joueurs.',
    },
    {
      icon: <Heart className="w-8 h-8 text-amber-500" />,
      title: 'Économie Dynamique',
      description: 'Créez votre entreprise, commercez et développez votre empire.',
    },
    {
      icon: <Mic className="w-8 h-8 text-amber-500" />,
      title: 'Chat Vocal',
      description: 'Communiquez en temps réel avec le chat vocal intégré au serveur.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://i.imgur.com/1H1HYR8.png"
            alt="LunarisLands Banner"
            className="w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <ImageWithFallback 
              src="https://i.imgur.com/Oo1ELPJ.png" 
              alt="LunarisLands Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            LunarisLands
          </h1>
          <p className="text-xl md:text-2xl text-amber-500 mb-8">
            Serveur Minecraft Semi-RP Médiéval
          </p>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Explorez un monde médiéval où le roleplay et l'aventure se rencontrent. 
            Construisez votre légende dans les terres de Lunaris.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://discord.gg/sa6PyYcMqh"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-lg font-semibold"
            >
              Rejoindre Discord
            </a>
            <a
              href="#features"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-lg font-semibold border border-amber-900/30"
            >
              En savoir plus
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            Pourquoi Rejoindre LunarisLands ?
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            Découvrez ce qui fait de notre serveur une expérience unique
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 hover:border-amber-600/50 transition-all hover:transform hover:scale-105"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Server Info Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800/80 backdrop-blur-md border border-amber-900/30 rounded-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Informations du Serveur
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <h3 className="text-amber-500 font-semibold mb-2">Version</h3>
                <p className="text-white text-lg">Minecraft 1.21.4 NeoForge</p>
              </div>
              <div className="text-center">
                <h3 className="text-amber-500 font-semibold mb-2">Type de Serveur</h3>
                <p className="text-white text-lg">Semi-RP Médiéval</p>
              </div>
              <div className="text-center">
                <h3 className="text-amber-500 font-semibold mb-2">Adresse IP</h3>
                <p className="text-white text-lg">Disponible sur Discord</p>
              </div>
              <div className="text-center">
                <h3 className="text-amber-500 font-semibold mb-2">Communauté</h3>
                <p className="text-white text-lg">Active et Bienveillante</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <a
                href="https://discord.gg/sa6PyYcMqh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
              >
                Obtenir l'IP sur Discord
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-amber-900/30">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>&copy; 2026 LunarisLands - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}