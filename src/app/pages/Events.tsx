import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, MapPin, Clock, Users, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function Events() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('20:00');
  const [type, setType] = useState('general');
  const [lieu, setLieu] = useState('Spawn');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/events`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Load events error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté');
      navigate('/login');
      return;
    }

    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    console.log('🔍 Current user:', currentUser);
    console.log('🔍 User grade:', currentUser?.grade);
    
    if (!currentUser || currentUser.grade !== 'staff') {
      setError('Vous devez être membre du staff pour créer un événement');
      return;
    }

    console.log('📤 Creating event with data:', { titre, description, date, heure, type, lieu });
    console.log('📤 Using token:', token);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ titre, description, date, heure, type, lieu }),
        }
      );

      const data = await response.json();
      console.log('📥 Server response status:', response.status);
      console.log('📥 Server response data:', data);

      if (response.ok) {
        setSuccess('Événement créé avec succès !');
        setTitre('');
        setDescription('');
        setDate('');
        setHeure('20:00');
        setType('general');
        setLieu('Spawn');
        setShowCreateForm(false);
        loadEvents();
      } else {
        const errorMsg = data.error || `Erreur ${response.status}: ${JSON.stringify(data)}`;
        setError(errorMsg);
        console.error('❌ Create event error:', errorMsg, data);
      }
    } catch (error) {
      console.error('❌ Create event exception:', error);
      setError(`Exception: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/events/${eventId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        setSuccess('Vous avez rejoint l\'événement !');
        loadEvents();
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur');
      }
    } catch (error) {
      setError('Une erreur est survenue');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { 
            'X-Auth-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        setSuccess('Événement supprimé !');
        loadEvents();
      }
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: any = {
      general: { label: 'Général', color: 'bg-blue-500/20 text-blue-400' },
      pvp: { label: 'PvP', color: 'bg-red-500/20 text-red-400' },
      construction: { label: 'Construction', color: 'bg-green-500/20 text-green-400' },
      commerce: { label: 'Commerce', color: 'bg-amber-500/20 text-amber-400' },
      rp: { label: 'RP', color: 'bg-purple-500/20 text-purple-400' },
    };
    return badges[type] || badges.general;
  };

  const isUserJoined = (event: any) => {
    return event.participants?.some((p: any) => p.userId === user?.id);
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
            <Calendar className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-white">Calendrier des Événements</h1>
          </div>
          {user?.grade === 'staff' ? (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouvel Événement
            </button>
          ) : user ? (
            <div className="text-sm text-slate-400 bg-slate-800 px-4 py-2 rounded-lg">
              Seuls les membres du staff peuvent créer des événements
            </div>
          ) : null}
        </div>

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
        {showCreateForm && user?.grade === 'staff' && (
          <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Créer un nouvel événement</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={heure}
                    onChange={(e) => setHeure(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="general">Général</option>
                    <option value="pvp">PvP</option>
                    <option value="construction">Construction</option>
                    <option value="commerce">Commerce</option>
                    <option value="rp">RP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={lieu}
                    onChange={(e) => setLieu(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Créer l'événement
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

        {/* Events List */}
        <div className="grid gap-6">
          {events.length === 0 ? (
            <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Aucun événement planifié</p>
              <p className="text-slate-500 text-sm mt-2">Les événements apparaîtront ici</p>
            </div>
          ) : (
            events.map((event) => {
              const typeBadge = getTypeBadge(event.type);
              const joined = isUserJoined(event);

              return (
                <div key={event.id} className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 hover:border-amber-600/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{event.titre}</h3>
                      <p className="text-slate-300 mb-4">{event.description}</p>
                      
                      <div className="flex items-center gap-4 flex-wrap text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          {new Date(event.date).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-amber-500" />
                          {event.heure}
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          {event.lieu}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-4 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          {event.participants?.length || 0} participant(s)
                        </span>
                        {joined && (
                          <span className="text-xs text-green-400 ml-2">✓ Inscrit</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {user && !joined && (
                        <button
                          onClick={() => handleJoinEvent(event.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          Participer
                        </button>
                      )}
                      {user?.grade === 'staff' && (
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mt-4">
                    Créé par {event.createdBy}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}