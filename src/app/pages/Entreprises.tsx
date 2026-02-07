import { Building2, ShoppingBag, Hammer, Wheat, Gem, Sword, Landmark } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function Entreprises() {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      // Load from backend (public route)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprises`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.entreprises && data.entreprises.length > 0) {
          setEntreprises(data.entreprises);
        } else {
          // Use static fallback data if no entreprises in database
          setEntreprises(fallbackEntreprises);
        }
      } else {
        // Use static fallback data
        setEntreprises(fallbackEntreprises);
      }
    } catch (error) {
      console.log('Using fallback data, error:', error);
      // Use static fallback data
      setEntreprises(fallbackEntreprises);
    } finally {
      setLoading(false);
    }
  };

  const fallbackEntreprises = [
    {
      name: 'La Banque Lunaris',
      category: 'Commerce',
      owner: 'Canrz (Ekow)',
      description: 'Banquier qui fournit des prêts, vend et loue des terrains pour développer votre entreprise.',
      specialty: 'Banque & Immobilier',
    },
    {
      name: 'Les Récolte Généreuse',
      category: 'Commerce',
      owner: 'InconnueOP',
      description: 'Vente de meubles, tapis et services de construction pour embellir vos bâtiments.',
      specialty: 'Meubles & Décoration',
    },
    {
      name: 'Germany BTP',
      category: 'Construction',
      owner: 'B4N',
      description: 'Entreprise de construction spécialisée dans les grands projets architecturaux.',
      specialty: 'Construction',
    },
    {
      name: 'Tresor Mining',
      category: 'Minage & Ressources',
      owner: 'Nakilox',
      description: 'Mineur officiel du village, fournisseur de minerais et ressources rares.',
      specialty: 'Extraction Minière',
    },
    {
      name: 'Ferme Claire-De-Lune',
      category: 'Agriculture',
      owner: 'Wesley',
      description: 'Fermier du village, production de ressources agricoles de qualité.',
      specialty: 'Agriculture & Élevage',
    },
  ];

  const categories = [
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: 'Commerce',
      description: 'Magasins, boutiques et stands de marché',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: <Hammer className="w-8 h-8" />,
      title: 'Artisanat',
      description: 'Forgerons, charpentiers et artisans',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
    {
      icon: <Wheat className="w-8 h-8" />,
      title: 'Agriculture',
      description: 'Fermes, élevages et productions agricoles',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      icon: <Gem className="w-8 h-8" />,
      title: 'Minage & Ressources',
      description: 'Extraction de minerais et ressources rares',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: <Sword className="w-8 h-8" />,
      title: 'Sécurité',
      description: 'Gardes, mercenaires et protection',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: 'Construction',
      description: 'Architectes et bâtisseurs',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://i.imgur.com/1H1HYR8.png"
            alt="LunarisLands Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/80"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Building2 className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Entreprises de LunarisLands
          </h1>
          <p className="text-lg text-slate-300">
            Créez et développez votre entreprise dans notre économie médiévale
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Catégories d'Entreprises
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            Choisissez votre domaine et bâtissez votre empire commercial
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className={`bg-slate-900 border ${category.borderColor} rounded-lg p-6 hover:transform hover:scale-105 transition-all`}
              >
                <div className={`${category.bgColor} w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${category.color}`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-slate-400">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Create Section */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Comment Créer Votre Entreprise ?
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800 border border-amber-900/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Rejoignez le serveur
                  </h3>
                  <p className="text-slate-400">
                    Connectez-vous sur LunarisLands et explorez l'univers pour trouver l'emplacement idéal.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-amber-900/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Préparez votre projet
                  </h3>
                  <p className="text-slate-400">
                    Définissez votre activité, votre nom d'entreprise et votre concept commercial.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-amber-900/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Demandez l'autorisation
                  </h3>
                  <p className="text-slate-400">
                    Contactez le staff sur Discord pour valider votre projet d'entreprise.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-amber-900/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Lancez votre activité
                  </h3>
                  <p className="text-slate-400">
                    Construisez vos locaux, recrutez vos employés et commencez à commercer !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Enterprises Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Entreprises Établies
          </h2>
          <p className="text-center text-slate-400 mb-12">
            Exemples d'entreprises prospères sur LunarisLands
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 hover:border-amber-600/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-amber-600/20 text-amber-500 text-sm px-3 py-1 rounded-full">
                    Chargement...
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Veuillez patienter
                </h3>
                <p className="text-slate-400 mb-3 text-sm">
                  Nous récupérons les données des entreprises...
                </p>
              </div>
            ) : (
              entreprises.map((entreprise, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 hover:border-amber-600/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-amber-600/20 text-amber-500 text-sm px-3 py-1 rounded-full">
                      {entreprise.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {entreprise.name}
                  </h3>
                  <p className="text-slate-400 mb-3 text-sm">
                    {entreprise.description}
                  </p>
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <p className="text-sm text-slate-500">
                      Propriétaire: <span className="text-amber-500">{entreprise.owner}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Spécialité: <span className="text-white">{entreprise.specialty}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">
              Votre entreprise pourrait être affichée ici !
            </p>
            <a
              href="#"
              className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
            >
              Créer Mon Entreprise
            </a>
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