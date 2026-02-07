import { useState, useEffect } from 'react';
import { X, ShoppingCart, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Product {
  id: string;
  nom: string;
  stock: number;
  prix: number | null;
}

interface OrderFormProps {
  entrepriseId: string;
  entrepriseName: string;
  onClose: () => void;
}

export function OrderForm({ entrepriseId, entrepriseName, onClose }: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    clientPseudo: '',
    clientDiscord: '',
    typeCommande: 'particulier',
    disponibilites: '',
  });

  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    loadProducts();
  }, [entrepriseId]);

  const loadProducts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/products/${entrepriseId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Load products error:', error);
      setError('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [productId]: quantity });
    }
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validate cart
    if (Object.keys(cart).length === 0) {
      setError('Veuillez sélectionner au moins un produit');
      setSubmitting(false);
      return;
    }

    // Check stock availability
    for (const [productId, quantity] of Object.entries(cart)) {
      const product = products.find((p) => p.id === productId);
      if (product && product.stock < quantity) {
        setError(`Stock insuffisant pour ${product.nom}. Disponible: ${product.stock}`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const produits = Object.entries(cart).map(([productId, quantite]) => ({
        productId,
        quantite,
      }));

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/commandes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            entrepriseId,
            clientPseudo: formData.clientPseudo,
            clientDiscord: formData.clientDiscord || null,
            typeCommande: formData.typeCommande,
            disponibilites: formData.disponibilites,
            produits,
          }),
        }
      );

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la commande');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError('Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-green-500/30 rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Commande envoyée !</h2>
          <p className="text-slate-400">
            Votre commande a été transmise à <strong className="text-amber-500">{entrepriseName}</strong>.
            Ils vous contacteront bientôt pour finaliser la livraison.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-900/30 rounded-lg max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-amber-500" />
              Commander chez {entrepriseName}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Remplissez le formulaire pour passer commande
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Vos informations</h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pseudo Minecraft *
              </label>
              <input
                type="text"
                value={formData.clientPseudo}
                onChange={(e) => setFormData({ ...formData, clientPseudo: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                placeholder="VotrePseudo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discord <span className="text-slate-500">(optionnel mais recommandé)</span>
              </label>
              <input
                type="text"
                value={formData.clientDiscord}
                onChange={(e) => setFormData({ ...formData, clientDiscord: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                placeholder="votre_pseudo#0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type de commande *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="particulier"
                    checked={formData.typeCommande === 'particulier'}
                    onChange={(e) => setFormData({ ...formData, typeCommande: e.target.value })}
                    className="w-4 h-4 text-amber-600"
                  />
                  <span className="text-white">Particulier</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="entreprise"
                    checked={formData.typeCommande === 'entreprise'}
                    onChange={(e) => setFormData({ ...formData, typeCommande: e.target.value })}
                    className="w-4 h-4 text-amber-600"
                  />
                  <span className="text-white">Entreprise</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Disponibilités RP
              </label>
              <textarea
                value={formData.disponibilites}
                onChange={(e) => setFormData({ ...formData, disponibilites: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 resize-none"
                rows={3}
                placeholder="Ex: Disponible tous les soirs après 20h, ou weekends..."
              />
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Sélectionnez vos produits</h3>

            {loading ? (
              <div className="bg-slate-800 rounded-lg p-8 text-center">
                <p className="text-slate-400">Chargement des produits...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-8 text-center">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  Aucun produit disponible pour le moment
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{product.nom}</h4>
                        <p className="text-sm text-slate-400">
                          Stock: <span className={product.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                            {product.stock} disponible{product.stock > 1 ? 's' : ''}
                          </span>
                        </p>
                        {product.prix && (
                          <p className="text-sm text-amber-500">{product.prix} 💰 / unité</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) - 1)}
                        disabled={!cart[product.id] || cart[product.id] <= 0}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={cart[product.id] || 0}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                        min="0"
                        max={product.stock}
                        className="w-20 px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) + 1)}
                        disabled={cart[product.id] >= product.stock}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        +
                      </button>
                      {cart[product.id] > 0 && (
                        <span className="ml-auto text-amber-500 font-semibold">
                          {product.prix ? `${(product.prix * cart[product.id]).toFixed(2)} 💰` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {getTotalItems() > 0 && (
            <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">📦 Résumé de la commande</h4>
              <ul className="space-y-1 text-slate-300 text-sm">
                {Object.entries(cart).map(([productId, quantity]) => {
                  const product = products.find((p) => p.id === productId);
                  if (!product) return null;
                  return (
                    <li key={productId}>
                      • {product.nom} <span className="text-amber-400">x{quantity}</span>
                      {product.prix && (
                        <span className="text-slate-500 ml-2">
                          ({product.prix} 💰/u = {(product.prix * quantity).toFixed(2)} 💰)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-amber-600/30 mt-3 pt-3">
                <p className="text-white font-semibold">
                  Total: {getTotalItems()} article{getTotalItems() > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || getTotalItems() === 0}
              className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
            >
              {submitting ? 'Envoi en cours...' : 'Passer la commande'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>

          {/* Info */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">ℹ️ Informations</h4>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Votre commande sera envoyée à l'entreprise pour validation</li>
              <li>• Vous serez contacté via Minecraft ou Discord pour finaliser</li>
              <li>• Le stock affiché est mis à jour en temps réel</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
