import { Shield, AlertTriangle, Users, MessageCircle, Ban, CheckCircle } from 'lucide-react';

export function Reglement() {
  const mainRules = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Respect de la Communauté',
      description: 'Respectez tous les joueurs. Le harcèlement, les insultes, et tout comportement toxique sont strictement interdits.',
      severity: 'Élevée',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Roleplay Approprié',
      description: 'Restez dans votre rôle RP. Évitez le métagaming et respectez les actions RP des autres joueurs.',
      severity: 'Moyenne',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
    {
      icon: <Ban className="w-8 h-8" />,
      title: 'Aucune Triche',
      description: 'Les mods, hacks, et exploits de bugs sont strictement interdits. Jouez de manière loyale.',
      severity: 'Critique',
      color: 'text-red-600',
      bgColor: 'bg-red-600/10',
      borderColor: 'border-red-600/30',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Protection des Constructions',
      description: 'Ne griefez pas les constructions des autres. Respectez les zones protégées et les propriétés privées.',
      severity: 'Élevée',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
  ];

  const rpRules = [
    'Restez cohérent avec votre personnage et son histoire',
    'Évitez le power-gaming (rendre son personnage invincible)',
    'Respectez le /rp et le /hrp dans les conversations',
    'Les actions RP doivent être réalistes dans le contexte médiéval',
    'Demandez le consentement pour les RP violents ou majeurs',
    'Utilisez /me pour décrire vos actions',
  ];

  const commerceRules = [
    'Les prix doivent rester raisonnables et équitables',
    'Respectez vos contrats et accords commerciaux',
    'Ne créez pas de monopole abusif',
    'Déclarez votre entreprise auprès du staff',
    'Payez vos taxes et contributions à la communauté',
  ];

  const sanctions = [
    {
      level: 'Avertissement',
      description: 'Pour une première infraction mineure',
      color: 'text-yellow-500',
    },
    {
      level: 'Mute Temporaire',
      description: 'Pour spam ou non-respect du chat',
      color: 'text-orange-500',
    },
    {
      level: 'Kick',
      description: 'Pour infractions répétées',
      color: 'text-red-500',
    },
    {
      level: 'Ban Temporaire',
      description: 'Pour infractions graves ou répétées',
      color: 'text-red-600',
    },
    {
      level: 'Ban Permanent',
      description: 'Pour triche, toxicité grave ou multiples bans',
      color: 'text-red-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Règlement du Serveur
          </h1>
          <p className="text-lg text-slate-300">
            Pour une expérience agréable et respectueuse pour tous
          </p>
        </div>
      </section>

      {/* Main Rules Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Règles Principales
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            Ces règles sont fondamentales et doivent être respectées par tous les joueurs
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mainRules.map((rule, index) => (
              <div
                key={index}
                className={`bg-slate-900 border ${rule.borderColor} rounded-lg p-6`}
              >
                <div className={`${rule.bgColor} w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${rule.color}`}>
                  {rule.icon}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-white">
                    {rule.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${rule.bgColor} ${rule.color}`}>
                    {rule.severity}
                  </span>
                </div>
                <p className="text-slate-400">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RP Rules Section */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Règles de Roleplay
          </h2>
          
          <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-8">
            <div className="space-y-4">
              {rpRules.map((rule, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-400 font-semibold mb-1">Important</h4>
                <p className="text-slate-300 text-sm">
                  Le Semi-RP signifie que vous devez respecter les règles RP dans les zones désignées 
                  et lors d'interactions importantes, mais vous pouvez être plus décontracté en dehors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commerce Rules Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Règles Commerciales
          </h2>
          
          <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-8">
            <div className="space-y-4">
              {commerceRules.map((rule, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sanctions Section */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Système de Sanctions
          </h2>
          <p className="text-center text-slate-400 mb-12">
            Les sanctions sont appliquées en fonction de la gravité et de la récurrence des infractions
          </p>
          
          <div className="space-y-4">
            {sanctions.map((sanction, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-amber-900/30 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-xl font-semibold ${sanction.color} mb-1`}>
                      {sanction.level}
                    </h3>
                    <p className="text-slate-400">
                      {sanction.description}
                    </p>
                  </div>
                  <div className={`text-3xl font-bold ${sanction.color} opacity-20`}>
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
            <h4 className="text-amber-500 font-semibold mb-2">Note Importante</h4>
            <p className="text-slate-300 text-sm">
              Le staff se réserve le droit d'appliquer des sanctions adaptées selon le contexte. 
              En cas de litige, vous pouvez faire appel sur Discord dans le salon dédié.
            </p>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-amber-900/20 to-amber-700/20 border border-amber-600/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Besoin d'Aide ?
            </h2>
            <p className="text-slate-300 text-center mb-6">
              Si vous avez des questions concernant le règlement ou si vous souhaitez signaler un comportement, 
              contactez un membre du staff sur Discord.
            </p>
            <div className="text-center">
              <a
                href="https://discord.gg/sa6PyYcMqh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
              >
                Rejoindre Discord
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-amber-900/30">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>&copy; 2026 LunarisLands - Tous droits réservés</p>
          <p className="text-sm mt-2">Le règlement peut être modifié à tout moment. Dernière mise à jour: Février 2026</p>
        </div>
      </footer>
    </div>
  );
}