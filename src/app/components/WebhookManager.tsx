import { useState, useEffect } from 'react';
import { Webhook, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface WebhookManagerProps {
  entreprises: any[];
}

export function WebhookManager({ entreprises }: WebhookManagerProps) {
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (selectedEntreprise) {
      loadWebhook(selectedEntreprise);
    }
  }, [selectedEntreprise]);

  const loadWebhook = async (entrepriseId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/webhook/${entrepriseId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWebhookUrl(data.webhook?.webhookUrl || '');
      }
    } catch (error) {
      console.error('Load webhook error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedEntreprise) {
      setError('Veuillez sélectionner une entreprise');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/webhook/${selectedEntreprise}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ webhookUrl: webhookUrl || null }),
        }
      );

      if (response.ok) {
        setSuccess('Webhook Discord configuré avec succès !');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la configuration');
      }
    } catch (error) {
      console.error('Save webhook error:', error);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Webhook className="w-6 h-6 text-amber-500" />
          Configuration Webhooks Discord
        </h2>
        <p className="text-slate-400 mt-1">
          Configurez les webhooks Discord pour recevoir des notifications lors de nouvelles commandes
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-2">📚 Comment créer un webhook Discord ?</h4>
        <ol className="text-slate-300 text-sm space-y-1 ml-4 list-decimal">
          <li>Allez dans les paramètres du salon Discord où vous voulez recevoir les notifications</li>
          <li>Cliquez sur "Intégrations" puis "Webhooks"</li>
          <li>Cliquez sur "Nouveau Webhook" et configurez le nom et l'avatar</li>
          <li>Cliquez sur "Copier l'URL du Webhook" et collez-la ci-dessous</li>
        </ol>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sélectionner une entreprise *
          </label>
          <select
            value={selectedEntreprise}
            onChange={(e) => setSelectedEntreprise(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            required
          >
            <option value="">-- Choisir une entreprise --</option>
            {entreprises.map((entreprise) => (
              <option key={entreprise.id} value={entreprise.id}>
                {entreprise.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            URL du Webhook Discord
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            placeholder="https://discord.com/api/webhooks/..."
          />
          <p className="text-slate-500 text-sm mt-2">
            Laissez vide pour désactiver les notifications Discord pour cette entreprise
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </button>
      </form>

      {/* Warning Box */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">⚠️ Important</h4>
        <ul className="text-slate-400 text-sm space-y-1">
          <li>• Seul le staff peut configurer les webhooks Discord</li>
          <li>• Les notifications sont envoyées automatiquement lors de nouvelles commandes</li>
          <li>• Assurez-vous que le webhook a les permissions d'écrire dans le salon</li>
          <li>• Ne partagez jamais l'URL du webhook publiquement</li>
        </ul>
      </div>
    </div>
  );
}
