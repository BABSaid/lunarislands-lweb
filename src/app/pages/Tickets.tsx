import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Plus, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function Tickets() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [titre, setTitre] = useState('');
  const [categorie, setCategorie] = useState('technique');
  const [priorite, setPriorite] = useState('normale');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      setLoading(false);
      return;
    }

    const currentUser = JSON.parse(userStr);
    
    try {
      // Staff sees all tickets, users see only their tickets
      const endpoint = currentUser.grade === 'staff' 
        ? 'tickets' 
        : 'my-tickets';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/${endpoint}`,
        {
          headers: { 
            'X-Auth-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Load tickets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      navigate('/login');
      return;
    }

    console.log('📤 Creating ticket with data:', { titre, categorie, priorite, message });
    console.log('📤 Using token:', token);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/tickets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ titre, categorie, priorite, message }),
        }
      );

      const data = await response.json();
      console.log('📥 Server response status:', response.status);
      console.log('📥 Server response data:', data);

      if (response.ok) {
        setSuccess('Ticket créé avec succès !');
        setTitre('');
        setCategorie('technique');
        setPriorite('normale');
        setMessage('');
        setShowCreateForm(false);
        loadTickets();
      } else {
        const errorMsg = data.error || `Erreur ${response.status}: ${JSON.stringify(data)}`;
        setError(errorMsg);
        console.error('❌ Create ticket error:', errorMsg, data);
      }
    } catch (error) {
      console.error('❌ Create ticket exception:', error);
      setError(`Exception: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleUpdateTicket = async (ticketId: string, statut: string, reponse?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/tickets/${ticketId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ statut, reponse }),
        }
      );

      if (response.ok) {
        setSuccess('Ticket mis à jour !');
        loadTickets();
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      setError('Une erreur est survenue');
    }
  };

  const getStatutBadge = (statut: string) => {
    const badges: any = {
      ouvert: { label: 'Ouvert', color: 'bg-blue-500/20 text-blue-400' },
      'en-cours': { label: 'En cours', color: 'bg-yellow-500/20 text-yellow-400' },
      resolu: { label: 'Résolu', color: 'bg-green-500/20 text-green-400' },
      ferme: { label: 'Fermé', color: 'bg-slate-500/20 text-slate-400' },
    };
    return badges[statut] || badges.ouvert;
  };

  const getPrioriteBadge = (priorite: string) => {
    const badges: any = {
      basse: { label: 'Basse', color: 'bg-gray-500/20 text-gray-400' },
      normale: { label: 'Normale', color: 'bg-blue-500/20 text-blue-400' },
      haute: { label: 'Haute', color: 'bg-orange-500/20 text-orange-400' },
      urgente: { label: 'Urgente', color: 'bg-red-500/20 text-red-400' },
    };
    return badges[priorite] || badges.normale;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-20">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          </div>
          {user && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouveau Ticket
            </button>
          )}
        </div>

        {!user && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
            <p className="text-blue-400 text-center">
              Vous devez être connecté pour créer un ticket de support.
            </p>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && user && (
          <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Créer un nouveau ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="Résumé du problème"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="technique">Technique</option>
                    <option value="gameplay">Gameplay</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priorité
                  </label>
                  <select
                    value={priorite}
                    onChange={(e) => setPriorite(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="Décrivez votre problème en détail..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Créer le ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="grid gap-6">
          {tickets.length === 0 ? (
            <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-12 text-center">
              <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Aucun ticket pour le moment</p>
              <p className="text-slate-500 text-sm mt-2">Créez un ticket pour contacter le support</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const statutBadge = getStatutBadge(ticket.statut);
              const prioriteBadge = getPrioriteBadge(ticket.priorite);

              return (
                <div key={ticket.id} className="bg-slate-900 border border-amber-900/30 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{ticket.titre}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statutBadge.color}`}>
                          {statutBadge.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${prioriteBadge.color}`}>
                          {prioriteBadge.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                        <span>Catégorie: {ticket.categorie}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        <span>•</span>
                        <span>Par {ticket.userName}</span>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-500 mt-1" />
                          <p className="text-slate-300">{ticket.message}</p>
                        </div>
                      </div>

                      {ticket.reponse && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-green-400 mb-2">Réponse du staff :</p>
                          <p className="text-slate-300">{ticket.reponse}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff Actions */}
                  {user?.grade === 'staff' && ticket.statut !== 'ferme' && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex gap-2">
                        {ticket.statut === 'ouvert' && (
                          <button
                            onClick={() => handleUpdateTicket(ticket.id, 'en-cours')}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                          >
                            Prendre en charge
                          </button>
                        )}
                        {ticket.statut === 'en-cours' && (
                          <button
                            onClick={() => {
                              const reponse = prompt('Entrez votre réponse :');
                              if (reponse) handleUpdateTicket(ticket.id, 'resolu', reponse);
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                          >
                            Marquer comme résolu
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateTicket(ticket.id, 'ferme')}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}