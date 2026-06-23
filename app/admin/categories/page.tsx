'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './categories.module.css';

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const ICON_OPTIONS = ['🎮', '🏎️', '⚽', '🧩', '🎯', '🏆', '🚀', '⚔️', '🎲', '🃏', '🐾', '🌍', '💥', '🎵', '🧠', '👾', '🦸', '🏄', '🎳', '🎪'];

const defaultForm = { 
  name: '', slug: '', icon: '🎮', description: '', isActive: true, sortOrder: 0,
  seoTitle: '', seoDescription: '', seoKeywords: ''
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch { toast.error('Failed to load categories'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Category updated!' : 'Category created!');
        setShowForm(false);
        setEditingId(null);
        setForm(defaultForm);
        load();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  const handleEdit = (cat: any) => {
    setForm({ 
      name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, 
      isActive: cat.isActive, sortOrder: cat.sortOrder,
      seoTitle: cat.seoTitle || '', seoDescription: cat.seoDescription || '', seoKeywords: cat.seoKeywords || ''
    });
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleGenerateSeo = async () => {
    if (!form.name) {
      toast.error('Name is required to generate SEO metadata');
      return;
    }
    setGeneratingSeo(true);
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.name,
          description: form.description,
          tags: [], // Categories don't have tags natively yet
          type: 'category'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setForm(f => ({
          ...f,
          seoTitle: data.data.seoTitle || f.seoTitle,
          seoDescription: data.data.seoDescription || f.seoDescription,
          seoKeywords: data.data.seoKeywords || f.seoKeywords,
        }));
        toast.success('SEO metadata generated with AI!');
      } else {
        toast.error(data.error || 'Failed to generate SEO');
      }
    } catch (err) {
      toast.error('Failed to call AI SEO generator');
    }
    setGeneratingSeo(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Category deleted'); load(); }
      else toast.error(data.error);
    } catch { toast.error('Failed to delete'); }
  };

  const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: '4px' }}>
            📂 Categories
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Organize your games by category
          </p>
        </div>
        <button
          className="btn btn-primary"
          id="add-category-btn"
          onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}
        >
          + New Category
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className={styles.formCard}>
          <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', marginBottom: '24px' }}>
            {editingId ? '✏️ Edit Category' : '➕ New Category'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={e => setForm(f => ({
                    ...f,
                    name: e.target.value,
                    slug: editingId ? f.slug : slugify(e.target.value)
                  }))}
                  placeholder="e.g. Action Games"
                  required
                  id="category-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input
                  className="form-control"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="e.g. action-games"
                  required
                  id="category-slug"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <div className={styles.iconPicker}>
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`${styles.iconBtn} ${form.icon === icon ? styles.iconBtnActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, icon }))}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this category"
                id="category-desc"
              />
            </div>

            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))}
                  id="category-sort"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <label className="toggle-switch">
                  <div
                    className={`toggle-track ${form.isActive ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    id="category-active-toggle"
                  >
                    <div className="toggle-thumb" />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
            
            {/* SEO Settings */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', margin: 0, color: 'var(--accent-cyan)' }}>
                  🔍 SEO Settings
                </h3>
                <button 
                  type="button" 
                  className="btn btn-sm" 
                  style={{ background: 'linear-gradient(45deg, #FF007A, #7928CA)', color: 'white', border: 'none' }}
                  onClick={handleGenerateSeo}
                  disabled={generatingSeo || !form.name}
                >
                  {generatingSeo ? '✨ Generating...' : '✨ AI Magic'}
                </button>
              </div>
              <div className="form-group">
                <label className="form-label">SEO Title</label>
                <input className="form-control" value={form.seoTitle}
                  onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                  placeholder="Optimized Title" maxLength={60} />
              </div>
              <div className="form-group">
                <label className="form-label">SEO Description</label>
                <textarea className="form-control" value={form.seoDescription}
                  onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))}
                  placeholder="Engaging meta description..." maxLength={160} />
              </div>
              <div className="form-group">
                <label className="form-label">SEO Keywords</label>
                <input className="form-control" value={form.seoKeywords}
                  onChange={e => setForm(f => ({ ...f, seoKeywords: e.target.value }))}
                  placeholder="action, multiplayer, free games" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} id="save-category-btn">
                {saving ? 'Saving...' : (editingId ? '✓ Save Changes' : '+ Create Category')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📂</div>
            <p style={{ color: 'var(--text-secondary)' }}>No categories yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat._id}>
                    <td style={{ fontSize: '1.5rem' }}>{cat.icon}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cat.name}</div>
                      {cat.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {cat.description.slice(0, 50)}{cat.description.length > 50 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td><code style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>{cat.slug}</code></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{cat.sortOrder}</td>
                    <td>
                      <span className={`badge ${cat.isActive ? 'badge-green' : ''}`}
                        style={!cat.isActive ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' } : {}}>
                        {cat.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleEdit(cat)}
                          id={`edit-cat-${cat._id}`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(cat._id, cat.name)}
                          id={`delete-cat-${cat._id}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
