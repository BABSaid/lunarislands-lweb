import { useState, useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle, Package, User, Calendar, MessageSquare } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Commande {
  id: string;
  entrepriseId: string;
  clientPseudo: string;
  clientDiscord: string | null;
  typeCommande: 'particulier' | 'entreprise';
  disponibilites: string;
  produits: Array<{
    productId: string;
    nom: string;
    quantite: number;
    prixUnitaire: number | null;
  }>;
  statut: 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'annulee';
  dateCommande: string;
  dateTraitement: string | null;
  notes: string;
}

interface OrderManagerProps {
  entrepriseId: string;
}

const STATUT_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  acceptee: { label: 'Acceptée', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle },
  en_cours: { label: 'En cours', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Package },
  terminee: { label: 'Terminée', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  annulee: { label: 'Annulée', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
};

export function OrderManager({ entrepriseId }: OrderManagerProps) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadCommandes();
  }, [entrepriseId]);

  const loadCommandes = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/commandes/${entrepriseId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCommandes(data.commandes || []);
      } else {
        console.error('❌ Failed to load commandes:', await response.text());
      }
    } catch (error) {
      console.error('Load commandes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (commandeId: string, newStatut: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/commandes/${commandeId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ statut: newStatut, notes }),
        }
      );

      if (response.ok) {
        setSuccess(`Commande ${STATUT_LABELS[newStatut].label.toLowerCase()} avec succès !`);
        loadCommandes();
        setSelectedCommande(null);
        setNotes('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        console.error('❌ Erreur lors de la mise à jour:', data);
        alert(`Erreur: ${data.error || 'Échec de la mise à jour'}`);
      }
    } catch (error) {
      console.error('Update statut error:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const filteredCommandes = commandes.filter((cmd) => {
    if (filter === 'all') return true;
    return cmd.statut === filter;
  });

  const pendingCount = commandes.filter((cmd) => cmd.statut === 'en_attente').length;

  if (loading) {
    return (
      <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-8 text-center">
        <p className="text-slate-400">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-amber-500" />
          Gestion des Commandes
          {pendingCount > 0 && (
            <span className="ml-2 px-3 py-1 bg-amber-600 text-white text-sm rounded-full">
              {pendingCount} nouvelle{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <p className="text-slate-400 mt-1">
          Gérez les commandes reçues via le site web
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Toutes ({commandes.length})
        </button>
        <button
          onClick={() => setFilter('en_attente')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'en_attente'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          En attente ({commandes.filter((c) => c.statut === 'en_attente').length})
        </button>
        <button
          onClick={() => setFilter('acceptee')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'acceptee'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Acceptées ({commandes.filter((c) => c.statut === 'acceptee').length})
        </button>
        <button
          onClick={() => setFilter('terminee')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'terminee'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Terminées ({commandes.filter((c) => c.statut === 'terminee').length})
        </button>
      </div>

      {/* Commandes List */}
      {filteredCommandes.length === 0 ? (
        <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Aucune commande {filter !== 'all' && STATUT_LABELS[filter]?.label.toLowerCase()}
          </h3>
          <p className="text-slate-400">
            Les commandes apparaîtront ici quand des clients passeront commande
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommandes.map((commande) => {
            const statutInfo = STATUT_LABELS[commande.statut];
            const StatusIcon = statutInfo.icon;

            return (
              <div
                key={commande.id}
                className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 hover:border-amber-600/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-500" />
                        {commande.clientPseudo}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs border ${statutInfo.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statutInfo.label}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs bg-slate-700 text-slate-300">
                        {commande.typeCommande === 'particulier' ? 'Particulier' : 'Entreprise'}
                      </span>
                    </div>

                    <div className="text-sm text-slate-400 space-y-1">
                      {commande.clientDiscord && (
                        <p>💬 Discord: {commande.clientDiscord}</p>
                      )}
                      <p className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Commandé le {new Date(commande.dateCommande).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Produits commandés
                  </h4>
                  <ul className="space-y-1">
                    {commande.produits.map((produit, index) => (
                      <li key={index} className="text-slate-300">
                        • {produit.nom} <span className="text-amber-400">x{produit.quantite}</span>
                        {produit.prixUnitaire && (
                          <span className="text-slate-500 ml-2">({produit.prixUnitaire} 💰/u)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disponibilités */}
                {commande.disponibilites && (
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    <h4 className="text-white font-semibold mb-2">📅 Disponibilités RP</h4>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{commande.disponibilites}</p>
                  </div>
                )}

                {/* Notes */}
                {commande.notes && (
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Notes internes
                    </h4>
                    <p className="text-slate-300 text-sm">{commande.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {commande.statut === 'en_attente' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedCommande(commande);
                          setNotes('');
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => updateStatut(commande.id, 'annulee')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  {commande.statut === 'acceptee' && (
                    <button
                      onClick={() => updateStatut(commande.id, 'en_cours')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Marquer en cours
                    </button>
                  )}
                  {commande.statut === 'en_cours' && (
                    <button
                      onClick={() => updateStatut(commande.id, 'terminee')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Marquer comme terminée
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accept Modal */}
      {selectedCommande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Accepter la commande
            </h3>
            <p className="text-slate-400 mb-4">
              Le stock sera automatiquement débité. Vous pouvez ajouter des notes internes (optionnel).
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 resize-none mb-4"
              rows={3}
              placeholder="Notes internes (optionnel)..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => updateStatut(selectedCommande.id, 'acceptee')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={() => {
                  setSelectedCommande(null);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">💡 Workflow de commande</h4>
        <ul className="text-slate-400 text-sm space-y-1">
          <li>• <strong>En attente</strong> : Nouvelle commande à valider</li>
          <li>• <strong>Acceptée</strong> : Commande validée, stock débité automatiquement</li>
          <li>• <strong>En cours</strong> : Commande en préparation</li>
          <li>• <strong>Terminée</strong> : Commande livrée au client</li>
          <li>• <strong>Annulée</strong> : Commande refusée ou annulée</li>
        </ul>
      </div>
    </div>
  );
}