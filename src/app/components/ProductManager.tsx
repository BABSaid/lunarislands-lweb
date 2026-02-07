import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Product {
  id: string;
  entrepriseId: string;
  nom: string;
  stock: number;
  prix: number | null;
  active: boolean;
  createdAt: string;
}

interface ProductManagerProps {
  entrepriseId: string;
}

export function ProductManager({ entrepriseId }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ nom: '', stock: 0, prix: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('🔄 Token utilisé:', token);
    console.log('🔄 Entreprise ID:', entrepriseId);

    try {
      if (editingProduct) {
        // Update existing product
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/products/${editingProduct.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              nom: formData.nom,
              stock: Number(formData.stock),
              prix: formData.prix ? Number(formData.prix) : null,
            }),
          }
        );

        if (response.ok) {
          setSuccess('Produit modifié avec succès !');
          setEditingProduct(null);
          setFormData({ nom: '', stock: 0, prix: '' });
          loadProducts();
        } else {
          const data = await response.json();
          setError(data.error || 'Erreur lors de la modification');
        }
      } else {
        // Create new product
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/products`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              nom: formData.nom,
              stock: Number(formData.stock),
              prix: formData.prix ? Number(formData.prix) : null,
            }),
          }
        );

        if (response.ok) {
          setSuccess('Produit ajouté avec succès !');
          setShowAddForm(false);
          setFormData({ nom: '', stock: 0, prix: '' });
          loadProducts();
        } else {
          const data = await response.json();
          setError(data.error || 'Erreur lors de l\'ajout');
          console.error('❌ Erreur lors de l\'ajout de produit:', data);
        }
      }

      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    } catch (error) {
      console.error('Submit error:', error);
      setError('Une erreur est survenue');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/products/${productId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setSuccess('Produit supprimé avec succès !');
        loadProducts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nom: product.nom,
      stock: product.stock,
      prix: product.prix?.toString() || '',
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingProduct(null);
    setFormData({ nom: '', stock: 0, prix: '' });
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-8 text-center">
        <p className="text-slate-400">Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Gestion du Catalogue
          </h2>
          <p className="text-slate-400 mt-1">
            Gérez vos produits et votre stock pour les commandes
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                placeholder="Ex: Lingot de Fer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stock disponible *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="64"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prix unitaire (optionnel)
                </label>
                <input
                  type="number"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                {editingProduct ? 'Modifier' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-12 text-center">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Aucun produit dans votre catalogue
          </h3>
          <p className="text-slate-400 mb-6">
            Commencez par ajouter des produits pour recevoir des commandes
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Ajouter votre premier produit
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-amber-900/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-amber-500 mr-3" />
                        <span className="text-white font-medium">{product.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        product.stock > 64
                          ? 'bg-green-500/20 text-green-400'
                          : product.stock > 0
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.stock} unité{product.stock > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {product.prix ? `${product.prix} 💰` : 'Non défini'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">💡 Conseils</h4>
        <ul className="text-slate-400 text-sm space-y-1">
          <li>• Le stock est automatiquement débité lors de l'acceptation d'une commande</li>
          <li>• Les clients ne pourront commander que si le stock est suffisant</li>
          <li>• Le prix est optionnel et affiché à titre informatif pour les clients</li>
        </ul>
      </div>
    </div>
  );
}