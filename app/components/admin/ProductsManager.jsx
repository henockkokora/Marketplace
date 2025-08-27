'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Filter, Star } from 'lucide-react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getApiUrl, API_ENDPOINTS } from '@/app/lib/config'
import { getMediaUrl, getFallbackImage } from '@/app/lib/media'

export default function ProductsManager() {
  // --- STATES ---
  const [products, setProducts] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // --- FORM STATE ---
  const initialForm = {
    name: '',
    subcategory: '',
    description: '',
    price: '',
    promoPrice: '',
    stock: '',
    condition: 'new',
    status: 'active',
    videoUrl: '',
    images: null,
    isSpecialOffer: false,
    specialOfferPrice: ''
  }
  const [form, setForm] = useState(initialForm)

  // --- LOAD DATA ---
  useEffect(() => {
    fetchProducts()
    fetchSubcategories()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    try {
      console.log('Tentative de chargement des produits depuis:', getApiUrl(`${API_ENDPOINTS.PRODUCTS}/admin/all`))
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/admin/all`))
      console.log('Réponse du serveur:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Erreur de réponse:', errorText)
        throw new Error(`Erreur ${res.status}: ${res.statusText} - ${errorText}`)
      }
      
      const data = await res.json()
      console.log('Produits chargés:', data)
      
      // Mettre à jour l'état avec les données brutes (subcategory est maintenant une chaîne)
      setProducts(data)
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err)
      setError(`Erreur lors du chargement des produits: ${err.message}`)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubcategories() {
    try {
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.SUBCATEGORIES}/all`))
      if (!res.ok) {
        console.error('Erreur de réponse du serveur:', res.status, res.statusText)
        return
      }
      const data = await res.json()
      setSubcategories(data)
    } catch (err) {
      console.error('Erreur lors du chargement des sous-catégories:', err)
    }
  }

  // --- OUVERTURE FORMULAIRE VIA EVENT ---
  useEffect(() => {
    function handleOpenProductForm() {
      setShowForm(true)
      setEditingProduct(null)
      setForm(initialForm)
    }
    window.addEventListener('openProductForm', handleOpenProductForm)
    return () => window.removeEventListener('openProductForm', handleOpenProductForm)
  }, [])

  // --- FORM MANAGEMENT ---
  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name || '',
        subcategory: editingProduct.subcategory?._id || editingProduct.subcategory || '',
        description: editingProduct.description || '',
        price: editingProduct.price || '',
        promoPrice: editingProduct.promoPrice || '',
        stock: editingProduct.stock || '',
        condition: editingProduct.condition || 'new',
        status: editingProduct.status || 'active',
        videoUrl: editingProduct.videoUrl || '',
        images: null,
        isSpecialOffer: editingProduct.isSpecialOffer || false,
        specialOfferPrice: editingProduct.specialOfferPrice || ''
      })
    } else {
      setForm(initialForm)
    }
  }, [editingProduct, showForm])

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'images') {
      if (files && files.length > 0) {
        // Vérifier les types de fichiers
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const invalidFiles = Array.from(files).filter(
          file => !allowedTypes.includes(file.type)
        );
        
        if (invalidFiles.length > 0) {
          toast.error('Seuls les fichiers JPEG, PNG et WebP sont acceptés');
          e.target.value = null; // Réinitialiser l'input fichier
          return;
        }
        
        // Vérifier la taille des fichiers (max 5MB par fichier)
        const oversizedFiles = Array.from(files).filter(
          file => file.size > 5 * 1024 * 1024
        );
        
        if (oversizedFiles.length > 0) {
          toast.error('La taille maximale autorisée est de 5MB par fichier');
          e.target.value = null; // Réinitialiser l'input fichier
          return;
        }
        
        setForm(f => ({ ...f, images: files }));
      }
    } else {
      // Gestion du toggle offre spéciale (checkbox)
      if (name === 'isSpecialOffer') {
        setForm(f => ({ ...f, isSpecialOffer: !f.isSpecialOffer }));
      } else {
        setForm(f => ({ ...f, [name]: value }));
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Vérifier les champs requis
      if (!form.name || !form.price || !form.subcategory) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      const fd = new FormData()
      
      // Ajouter les champs au FormData
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'images' && val) {
          for (const file of val) fd.append('images', file)
        } else if (val !== null && val !== undefined) {
          // Convertir les champs numériques
          if (['price', 'promoPrice', 'stock', 'specialOfferPrice'].includes(key)) {
            fd.append(key, Number(val))
          } else if (key === 'isSpecialOffer') {
            fd.append('isSpecialOffer', val ? 'true' : 'false')
          } else if (key === 'subcategory' && Array.isArray(val)) {
            // Ne prendre que la première valeur si jamais c'est un array
            fd.append('subcategory', val[0])
          } else if (key === 'subcategory') {
            fd.append('subcategory', val)
          } else {
            fd.append(key, val)
          }
        }
      })

      const url = editingProduct && editingProduct._id 
        ? getApiUrl(`${API_ENDPOINTS.PRODUCTS}/${editingProduct._id}`)
        : getApiUrl(API_ENDPOINTS.PRODUCTS)
      
      const method = editingProduct && editingProduct._id ? 'PUT' : 'POST'
      
      console.log('Envoi de la requête:', { 
        method, 
        url,
        body: Object.fromEntries(fd.entries())
      })

const res = await fetch(getApiUrl(url), { 
        method, 
        body: fd,
        // Ne pas définir le Content-Type, il sera défini automatiquement avec la boundary
      })

      const responseData = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        console.error('Erreur du serveur:', responseData)
        throw new Error(
          responseData.details 
            ? `Erreur de validation: ${responseData.details.join(', ')}`
            : responseData.error || 'Erreur lors de la sauvegarde du produit'
        )
      }

      await fetchProducts()
      setShowForm(false)
      setEditingProduct(null)
      setForm(initialForm)
      toast.success(editingProduct ? 'Produit mis à jour avec succès' : 'Produit ajouté avec succès')
    } catch (err) {
      console.error('Erreur lors de la soumission du formulaire:', err)
      toast.error(err.message || 'Une erreur est survenue lors de la sauvegarde')
    }
  }

  // --- CRUD & TOGGLE ---
  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleToggleStatus = async (id) => {
    try {
      const product = products.find(p => p._id === id);
      if (!product) {
        throw new Error('Produit non trouvé');
      }
      
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        const errorRes = await res.json().catch(() => ({}));
        throw new Error(errorRes.error || 'Erreur lors du changement de statut');
      }
      
      const updatedProduct = await res.json();
      
      // Mettre à jour l'état local avec le produit retourné par l'API
      setProducts(prev => prev.map(p => 
        p._id === id ? updatedProduct : p
      ));
      
      toast.success(`Produit marqué comme ${newStatus === 'active' ? 'actif' : 'inactif'}`);
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      toast.error(err.message || 'Une erreur est survenue lors du changement de statut');
    }
  }

  const handleToggleSpecialOffer = async (id) => {
    try {
      const product = products.find(p => p._id === id);
      if (!product) {
        throw new Error('Produit non trouvé');
      }
      
      const newSpecialOffer = !product.isSpecialOffer;
      
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}/special-offer`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSpecialOffer: newSpecialOffer })
      });
      
      if (!res.ok) {
        const errorRes = await res.json().catch(() => ({}));
        throw new Error(errorRes.error || 'Erreur lors du changement de l\'offre spéciale');
      }
      
      const updatedProduct = await res.json();
      
      // Mettre à jour l'état local avec le produit retourné par l'API
      setProducts(prev => prev.map(p => 
        p._id === id ? updatedProduct : p
      ));
      
      toast.success(`Offre spéciale ${newSpecialOffer ? 'activée' : 'désactivée'}`);
    } catch (err) {
      console.error('Erreur lors du changement de l\'offre spéciale:', err);
      toast.error(err.message || 'Une erreur est survenue lors du changement de l\'offre spéciale');
    }
  }

  const handleDelete = (id) => {
    const confirmDelete = () => {
      const toastId = toast.warning(
        <div className="flex flex-col gap-2 p-2">
          <div className="font-medium">Êtes-vous sûr de vouloir supprimer ce produit ?</div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(toastId);
                toast.info('Suppression annulée');
              }}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                toast.dismiss(toastId);
                try {
                  const res = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}`), { method: 'DELETE' });
                  if (!res.ok) {
                    const errorRes = await res.json().catch(() => ({}));
                    throw new Error(errorRes.error || 'Erreur lors de la suppression');
                  }
                  setProducts(prev => prev.filter(product => product._id !== id));
                  toast.success('Produit supprimé avec succès');
                } catch (err) {
                  toast.error(err.message || 'Une erreur est survenue lors de la suppression');
                }
              }}
              className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>,
        {
          closeButton: false,
          closeOnClick: false,
          autoClose: false,
          draggable: false,
        }
      );
    };
    
    confirmDelete();
    // La suppression est maintenant gérée dans la boîte de dialogue de confirmation
  }

  // --- FILTERS ---
  const filteredProducts = products.filter(product => {
    const categoryName = (product.category && product.category.name) ? product.category.name : ''
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // --- UTILS ---
  const getSubcategoryName = (subcategoryId) => {
    if (!subcategoryId) return '';
    const subcategory = subcategories.find(sub => sub._id === subcategoryId);
    return subcategory ? subcategory.name : '';
  };

  // --- BADGES & UTILS ---
  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Actif</span>
    ) : (
      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Inactif</span>
    )
  }

  const getConditionBadge = (condition) => {
    const badges = {
      new: <span className="bg-[#DDD8B8] text-white px-2 py-1 rounded-full text-xs">Neuf</span>,
      used: <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Occasion</span>,
      refurbished: <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Reconditionné</span>
    }
    return badges[condition] || badges.new
  }

  const getSpecialOfferBadge = (isSpecialOffer, specialOfferPrice) => {
    if (!isSpecialOffer) return (
      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Non</span>
    )
    return (
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{specialOfferPrice} FCFA</span>
    )
  }


  // --- RENDER ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des produits</h2>
        <button
          onClick={() => {
            setEditingProduct(null)
            setShowForm(true)
          }}
          className="flex items-center space-x-2 bg-[#F2994A] text-white px-4 py-2 rounded-lg hover:bg-[#F2994A]1A transition-colors"
        >
          <Plus size={16} />
          <span>Nouveau produit</span>
        </button>
      </div>

      {!showForm ? (
        <div className="bg-white rounded-lg shadow-md">
          {/* Filters */}
          <div className="p-6 border-b border-[#DDD8B8]">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            {loading && <p className="px-6 py-4">Chargement...</p>}
            {error && <p className="px-6 py-2 text-red-600">{error}</p>}
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sous-catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    État
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offre spéciale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <img
                            src={product.images?.[0] ? getMediaUrl(`uploads/${product.images[0]}`) : getFallbackImage()}
                            alt={product.name}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              console.error('Erreur de chargement de l\'image:', e.target.src);
                              e.target.src = 'https://placehold.co/48x48?text=Erreur';
                              e.target.className = 'w-full h-full object-contain bg-gray-100 rounded';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {product._id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {getSubcategoryName(product.subcategory) || 'Non spécifiée'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.promoPrice ? (
                          <>
                            <span className="font-medium">{product.promoPrice.toLocaleString()} FCFA</span>
                            <span className="ml-2 text-gray-500 line-through">{product.price.toLocaleString()} FCFA</span>
                          </>
                        ) : (
                          <span className="font-medium">{product.price.toLocaleString()} FCFA</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        product.stock === 0 ? 'text-red-600' :
                        product.stock < 10 ? 'text-[#F2994A]' : 'text-green-600'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getConditionBadge(product.condition)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSpecialOfferBadge(product.isSpecialOffer, product.specialOfferPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(product._id)}
                          className={`p-2 rounded ${
                            product.status === 'active'
                              ? 'text-red-600 hover:text-[#F2994A]'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                          title={product.status === 'active' ? 'Désactiver' : 'Activer'}
                        >
                          {product.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleToggleSpecialOffer(product._id)}
                          className={`p-2 rounded ${
                            product.isSpecialOffer
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title={product.isSpecialOffer ? 'Désactiver l\'offre spéciale' : 'Activer l\'offre spéciale'}
                        >
                          <Star size={16} fill={product.isSpecialOffer ? '#22c55e' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-[#F2994A] hover:text-[#F2994A]1A p-2"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-[#F2994A] p-2"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun produit trouvé</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-6">
            {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>

          <form className="space-y-6" onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                  placeholder="Nom du produit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-catégorie *
                </label>
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionnez une sous-catégorie</option>
                  {subcategories.map(subcat => (
                    <option key={subcat._id} value={subcat._id}>{subcat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                rows={4}
                name="description"
                value={form.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                placeholder="Description détaillée du produit"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (jusqu'à 10) *
              </label>
              <input
                type="file"
                name="images"
                multiple
                accept="image/*"
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
              />
              <p className="text-sm text-gray-500 mt-1">
                Formats acceptés: JPG, PNG, WebP. Taille max: 5MB par image.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vidéo de présentation (optionnel)
              </label>
              <input
                type="url"
                name="videoUrl"
                value={form.videoUrl}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                placeholder="URL de la vidéo (YouTube, Vimeo...)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isSpecialOffer"
                  checked={!!form.isSpecialOffer}
                  onChange={handleFormChange}
                  id="isSpecialOffer"
                  className="mr-2"
                />
                <label htmlFor="isSpecialOffer" className="text-sm font-medium text-gray-700">
                  Offre spéciale ?
                </label>
              </div>
              {form.isSpecialOffer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix spécial (FCFA)
                  </label>
                  <input
                    type="number"
                    name="specialOfferPrice"
                    step="0.01"
                    value={form.specialOfferPrice}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix normal (FCFA) *
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  value={form.price}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix promo (FCFA)
                </label>
                <input
                  type="number"
                  name="promoPrice"
                  step="0.01"
                  value={form.promoPrice}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité en stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  État du produit *
                </label>
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                  required
                >
                  <option value="new">Neuf</option>
                  <option value="used">Occasion</option>
                  <option value="refurbished">Reconditionné</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A]"
                  required
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                className="bg-[#F2994A] text-white px-6 py-2 rounded-lg hover:bg-[#F2994A]1A transition-colors"
              >
                {editingProduct ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingProduct(null); setForm(initialForm) }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}