import { useState, useEffect } from 'react';
import { Star, MessageSquare, User as UserIcon } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface ReviewSectionProps {
  entrepriseId: string;
}

export function ReviewSection({ entrepriseId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReviews();
  }, [entrepriseId]);

  const loadReviews = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/reviews/${entrepriseId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (error) {
      console.error('Load reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour laisser un avis');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ entrepriseId, note, commentaire }),
        }
      );

      if (response.ok) {
        setSuccess('Avis ajouté avec succès !');
        setNote(5);
        setCommentaire('');
        setShowForm(false);
        loadReviews();
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de l\'ajout de l\'avis');
      }
    } catch (error) {
      setError('Une erreur est survenue');
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-amber-500 text-amber-500'
                : 'text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-slate-400 text-center py-4">
        Chargement des avis...
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Avis clients</h3>
          <div className="flex items-center gap-4">
            {renderStars(avgRating, 'lg')}
            <span className="text-2xl font-bold text-amber-500">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-slate-400">
              ({totalReviews} avis)
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
        >
          {showForm ? 'Annuler' : 'Laisser un avis'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Note *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNote(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= note
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-600 hover:text-slate-500'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-slate-300">{note}/5</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                placeholder="Partagez votre expérience..."
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
            >
              Publier l'avis
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aucun avis pour le moment</p>
            <p className="text-slate-500 text-sm mt-1">
              Soyez le premier à laisser un avis !
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-600/20 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{review.userName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {renderStars(review.note)}
              </div>
              {review.commentaire && (
                <p className="text-slate-300 mt-3">{review.commentaire}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
