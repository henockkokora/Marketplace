'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Folder, FolderOpen } from 'lucide-react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getApiUrl, API_ENDPOINTS } from '@/app/lib/config'

export default function CategoriesManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('category') // category | subcategory | subsubcategory
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState({})

  const [formData, setFormData] = useState({ name: '', image: null })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.CATEGORIES))
      if (!res.ok) throw new Error('Erreur lors du chargement des catégories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (id) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const openForm = (type, cat = null, subcat = null, existing = null) => {
    setFormType(type)
    setSelectedCategory(cat)
    setSelectedSubcategory(subcat)
    if (existing) {
      setFormData({
        name: existing.name || '',
        image: null,
        productCount: existing.productCount || 0,
        _id: existing._id || null,
      })
    } else {
      setFormData({ name: '', image: null, productCount: 0, _id: null })
    }
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setFormData({ name: '', image: null, productCount: 0, _id: null })
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'image') {
      setFormData(prev => ({ ...prev, image: files[0] }))
    } else if (name === 'productCount') {
      setFormData(prev => ({ ...prev, productCount: Number(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    try {
      let url = `${API_BASE}/categories`
      let method = formData._id ? 'PUT' : 'POST'
      let headers = {}
      let body

      if (formType === 'category') {
        if (formData._id) url += `/${formData._id}`
      } else if (formType === 'subcategory') {
        url = formData._id
          ? getApiUrl(`${API_ENDPOINTS.CATEGORIES}/${selectedCategory._id}/subcategories/${formData._id}`)
          : getApiUrl(`${API_ENDPOINTS.CATEGORIES}/${selectedCategory._id}/subcategories`)
      } else if (formType === 'subsubcategory') {
        url = formData._id
          ? getApiUrl(`${API_ENDPOINTS.CATEGORIES}/${selectedCategory._id}/subcategories/${selectedSubcategory._id}/subsubcategories/${formData._id}`)
          : getApiUrl(`${API_ENDPOINTS.CATEGORIES}/${selectedCategory._id}/subcategories/${selectedSubcategory._id}/subsubcategories`)
      }

      if (formData.image) {
        const form = new FormData()
        form.append('name', formData.name)
        if (formType === 'subsubcategory') {
          form.append('productCount', formData.productCount)
        }
        form.append('image', formData.image)
        body = form
      } else {
        const jsonBody = {
          name: formData.name,
        }
        if (formType === 'subsubcategory') {
          jsonBody.productCount = formData.productCount
        }
        body = JSON.stringify(jsonBody)
        headers['Content-Type'] = 'application/json'
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      })

      if (!res.ok) {
        const errorRes = await res.json()
        throw new Error(errorRes.error || 'Erreur lors de la sauvegarde')
      }

      const saved = await res.json()

      if (formType === 'category') {
        if (method === 'POST') {
          setCategories(prev => [...prev, saved])
        } else {
          setCategories(prev => prev.map(c => (c._id === saved._id ? saved : c)))
        }
      } else if (formType === 'subcategory') {
        setCategories(prev =>
          prev.map(cat => {
            if (cat._id === selectedCategory._id) {
              let newSubcats
              if (method === 'POST') {
                newSubcats = [...cat.subcategories, saved]
              } else {
                newSubcats = cat.subcategories.map(sc =>
                  sc._id === saved._id ? saved : sc
                )
              }
              return { ...cat, subcategories: newSubcats }
            }
            return cat
          })
        )
      } else if (formType === 'subsubcategory') {
        setCategories(prev =>
          prev.map(cat => {
            if (cat._id === selectedCategory._id) {
              return {
                ...cat,
                subcategories: cat.subcategories.map(subcat => {
                  if (subcat._id === selectedSubcategory._id) {
                    let newSubSubs
                    if (method === 'POST') {
                      newSubSubs = [...subcat.subsubcategories, saved]
                    } else {
                      newSubSubs = subcat.subsubcategories.map(ssc =>
                        ssc._id === saved._id ? saved : ssc
                      )
                    }
                    return { ...subcat, subsubcategories: newSubSubs }
                  }
                  return subcat
                }),
              }
            }
            return cat
          })
        )
      }

      closeForm()
      const action = formData._id ? 'mis(e) à jour' : 'ajouté(e)'
      const elementType = 
        formType === 'category' ? 'Catégorie' : 
        formType === 'subcategory' ? 'Sous-catégorie' : 'Sous-sous-catégorie'
      toast.success(`${elementType} ${action} avec succès`)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = (type, catId, subId = null, subsubId = null) => {

    const confirmDelete = () => {
      const toastId = toast.warning(
        <div className="flex flex-col gap-2 p-2">
          <div className="font-medium">Voulez-vous vraiment supprimer cet élément ?</div>
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
                  let url = getApiUrl(API_ENDPOINTS.CATEGORIES);
                  
                  if (type === 'category') {
                    url += `/${catId}`;
                  } else if (type === 'subcategory') {
                    url += `/${catId}/subcategories/${subId}`;
                  } else if (type === 'subsubcategory') {
                    url += `/${catId}/subcategories/${subId}/subsubcategories/${subsubId}`;
                  }
                  
                  const res = await fetch(getApiUrl(url), { method: 'DELETE' });
                  if (!res.ok) {
                    const errorRes = await res.json().catch(() => ({}));
                    throw new Error(errorRes.error || 'Erreur lors de la suppression');
                  }
                  
                  if (type === 'category') {
                    setCategories(prev => prev.filter(c => c._id !== catId));
                    toast.success('Catégorie supprimée avec succès');
                  } else if (type === 'subcategory') {
                    setCategories(prev =>
                      prev.map(cat => {
                        if (cat._id === catId) {
                          return {
                            ...cat,
                            subcategories: cat.subcategories.filter(sc => sc._id !== subId)
                          };
                        }
                        return cat;
                      })
                    );
                    toast.success('Sous-catégorie supprimée avec succès');
                  } else if (type === 'subsubcategory') {
                    setCategories(prev =>
                      prev.map(cat => {
                        if (cat._id === catId) {
                          return {
                            ...cat,
                            subcategories: cat.subcategories.map(sc => {
                              if (sc._id === subId) {
                                return {
                                  ...sc,
                                  subsubcategories: sc.subsubcategories.filter(
                                    ssc => ssc._id !== subsubId
                                  )
                                };
                              }
                              return sc;
                            })
                          };
                        }
                        return cat;
                      })
                    );
                    toast.success('Sous-sous-catégorie supprimée avec succès');
                  }
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

  function resolveImageUrl(imagePath) {
    try {
      // Image par défaut si pas de chemin fourni
      if (!imagePath) {
        return 'https://placehold.co/48x48?text=No+Image';
      }

      // Si c'est déjà une URL complète, la retourner
      if (imagePath.startsWith('http')) {
        return imagePath;
      }

      // Nettoyer le chemin pour s'assurer qu'il n'y a pas de double /uploads/
      let cleanPath = imagePath.replace(/^[\\/]+/, '');
      
      // Si le chemin commence déjà par uploads/, on le supprime pour éviter la duplication
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.substring(8); // Enlève 'uploads/'
      }

      // Utiliser getApiUrl pour construire l'URL complète
      return getApiUrl(`/uploads/${cleanPath}`);
    } catch (error) {
      console.error('Erreur dans resolveImageUrl:', error);
      return 'https://placehold.co/48x48?text=Error';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des catégories</h2>
        <button
          onClick={() => openForm('category')}
          className="flex items-center space-x-2 bg-[#404E7C] text-white px-4 py-2 rounded-lg hover:bg-[#2e3c63] transition-colors"
        >
          <Plus size={16} />
          <span>Nouvelle catégorie</span>
        </button>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!showForm ? (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 space-y-4">
            {categories.map(category => (
              <div key={category._id} className="border border-[#404E7C] rounded-lg">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleCategory(category._id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedCategories[category._id] ? (
                        <FolderOpen size={20} />
                      ) : (
                        <Folder size={20} />
                      )}
                    </button> 
                    <img
                      src={resolveImageUrl(category.image)}
                      alt={category.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        console.error('Erreur de chargement de l\'image:', e.target.src);
                        e.target.src = 'https://placehold.co/48x48?text=No+Image';
                        e.target.className = 'w-12 h-12 object-contain bg-gray-100 rounded';
                      }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {category.subcategories?.length || 0} sous-catégories
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openForm('subcategory', category)}
                      className="text-[#404E7C] hover:text-[#6A7BA2] p-2"
                      title="Ajouter une sous-catégorie"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => openForm('category', null, null, category)}
                      className="text-blue-600 hover:text-blue-700 p-2"
                      title="Modifier la catégorie"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete('category', category._id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Supprimer la catégorie"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {expandedCategories[category._id] && category.subcategories && (
                  <div className="border-t border-[#404E7C] bg-gray-50">
                    {category.subcategories.map(subcategory => (
                      <div
                        key={subcategory._id}
                        className="p-4 ml-8 border-b border-[#404E7C] last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <img
                              src={resolveImageUrl(subcategory.image)}
                              alt={subcategory.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                console.error('Erreur de chargement de l\'image:', e.target.src);
                                e.target.src = 'https://placehold.co/40x40?text=No+Img';
                                e.target.className = 'w-10 h-10 object-contain bg-gray-100 rounded';
                              }}
                            />
                            <div>
                              <h4 className="font-medium">{subcategory.name}</h4>
                              
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            
                            <button
                              onClick={() => openForm('subcategory', category, null, subcategory)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Modifier la sous-catégorie"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete('subcategory', category._id, subcategory._id)
                              }
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Supprimer la sous-catégorie"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="ml-4 space-y-1">
                          {subcategory.subsubcategories &&
                            subcategory.subsubcategories.map(subsubcategory => (
                              <div
                                key={subsubcategory._id}
                                className="flex items-center justify-between py-1"
                              >
                                <span className="text-sm">{subsubcategory.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {subsubcategory.productCount} produits
                                  </span>
                                  <button
                                    onClick={() =>
                                      openForm(
                                        'subsubcategory',
                                        category,
                                        subcategory,
                                        subsubcategory
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-700 p-1"
                                    title="Modifier la sous-sous-catégorie"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDelete(
                                        'subsubcategory',
                                        category._id,
                                        subcategory._id,
                                        subsubcategory._id
                                      )
                                    }
                                    className="text-red-600 hover:text-red-700 p-1"
                                    title="Supprimer la sous-sous-catégorie"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            {formData._id
              ? `Modifier ${
                  formType === 'category'
                    ? 'catégorie'
                    : formType === 'subcategory'
                    ? 'sous-catégorie'
                    : 'sous-sous-catégorie'
                }`
              : formType === 'category'
              ? 'Nouvelle catégorie'
              : formType === 'subcategory'
              ? `Nouvelle sous-catégorie pour "${selectedCategory?.name}"`
              : `Nouvelle sous-sous-catégorie pour "${selectedSubcategory?.name}"`}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(formType === 'subcategory' || formType === 'subsubcategory') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie parente
                </label>
                <input
                  type="text"
                  value={selectedCategory?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
            )}

            {formType === 'subsubcategory' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-catégorie parente
                </label>
                <input
                  type="text"
                  value={selectedSubcategory?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                name="name"
                type="text"
                placeholder={`Nom de la ${
                  formType === 'category'
                    ? 'catégorie'
                    : formType === 'subcategory'
                    ? 'sous-catégorie'
                    : 'sous-sous-catégorie'
                }`}
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {formType !== 'subsubcategory' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {formType === 'subsubcategory' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de produits
                </label>
                <input
                  name="productCount"
                  type="number"
                  min={0}
                  value={formData.productCount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="bg-[#404E7C] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {formData._id ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={closeForm}
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
