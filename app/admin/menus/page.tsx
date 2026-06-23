'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface MenuItem {
  _id: string;
  label: string;
  slug: string;
  type: 'category' | 'custom';
  position: 'header' | 'footer' | 'sidebar';
  url?: string;
  sortOrder: number;
  isActive: boolean;
  categoryRef?: { name: string; slug: string };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
}

interface FormState {
  label: string;
  slug: string;
  type: 'category' | 'custom';
  position: 'header' | 'footer' | 'sidebar';
  url: string;
  categoryRef: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: FormState = {
  label: '', slug: '', type: 'custom', position: 'header',
  url: '', categoryRef: '', sortOrder: 0, isActive: true,
};

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'sidebar'>('header');

  const load = async () => {
    setLoading(true);
    try {
      const [menusRes, catsRes] = await Promise.all([
        fetch('/api/menus'),
        fetch('/api/categories'),
      ]);
      const [menusData, catsData] = await Promise.all([menusRes.json(), catsRes.json()]);
      if (menusData.success) setMenus(menusData.data);
      if (catsData.success) setCategories(catsData.data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (form.type === 'category' && form.categoryRef) {
        payload.categoryRef = form.categoryRef;
        const cat = categories.find(c => c._id === form.categoryRef);
        if (cat && !form.slug) payload.slug = cat.slug;
      }
      if (!payload.slug) payload.slug = form.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const url = editingId ? `/api/menus/${editingId}` : '/api/menus';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Menu updated!' : 'Menu created!');
        setShowForm(false);
        setEditingId(null);
        setForm(defaultForm);
        load();
      } else toast.error(data.error || 'Failed to save');
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete menu item "${label}"?`)) return;
    try {
      const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Deleted'); load(); }
      else toast.error(data.error);
    } catch { toast.error('Failed'); }
  };

  const filtered = menus.filter(m => m.position === activeTab).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: '4px' }}>
            ☰ Menus
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage header, footer, and sidebar navigation
          </p>
        </div>
        <button className="btn btn-primary" id="add-menu-btn"
          onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}>
          + New Menu Item
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--gradient-card)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--border-radius)',
          padding: '28px',
          marginBottom: '24px',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', marginBottom: '24px' }}>
            {editingId ? '✏️ Edit Menu Item' : '➕ New Menu Item'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Label *</label>
                <input className="form-control" value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Action Games" required id="menu-label" />
              </div>
              <div className="form-group">
                <label className="form-label">Position</label>
                <select className="form-control" value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value as any }))}
                  id="menu-position">
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  id="menu-type">
                  <option value="custom">Custom URL</option>
                  <option value="category">Category Link</option>
                </select>
              </div>
              {form.type === 'category' ? (
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={form.categoryRef}
                    onChange={e => setForm(f => ({ ...f, categoryRef: e.target.value }))}
                    id="menu-category" required>
                    <option value="">— Select Category —</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">URL *</label>
                  <input className="form-control" value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="e.g. /about" required={form.type === 'custom'} id="menu-url" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input type="number" className="form-control" value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))}
                  id="menu-sort" />
              </div>
              <div className="form-group">
                <label className="form-label">Active</label>
                <label className="toggle-switch">
                  <div className={`toggle-track ${form.isActive ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} id="menu-active">
                    <div className="toggle-thumb" />
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} id="save-menu-btn">
                {saving ? 'Saving...' : (editingId ? '✓ Save' : '+ Create')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {(['header', 'footer', 'sidebar'] as const).map(pos => (
          <button key={pos} onClick={() => setActiveTab(pos)}
            className={`btn ${activeTab === pos ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            id={`tab-${pos}`}>
            {pos.charAt(0).toUpperCase() + pos.slice(1)}
            {' '}({menus.filter(m => m.position === pos).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>☰</div>
            <p style={{ color: 'var(--text-secondary)' }}>No {activeTab} menu items yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Label</th>
                <th>Type</th>
                <th>Target</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(menu => (
                <tr key={menu._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{menu.sortOrder}</td>
                  <td style={{ fontWeight: 600 }}>{menu.label}</td>
                  <td>
                    <span className={`badge ${menu.type === 'category' ? 'badge-cyan' : 'badge-purple'}`}>
                      {menu.type}
                    </span>
                  </td>
                  <td>
                    <code style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {menu.type === 'category' && menu.categoryRef
                        ? `/${menu.categoryRef.slug}`
                        : menu.url}
                    </code>
                  </td>
                  <td>
                    <span className={`badge ${menu.isActive ? 'badge-green' : ''}`}
                      style={!menu.isActive ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' } : {}}>
                      {menu.isActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" id={`edit-menu-${menu._id}`}
                        onClick={() => {
                          setForm({
                            label: menu.label, slug: menu.slug, type: menu.type,
                            position: menu.position, url: menu.url || '',
                            categoryRef: typeof menu.categoryRef === 'object' ? (menu.categoryRef as any)?._id || '' : '',
                            sortOrder: menu.sortOrder, isActive: menu.isActive,
                          });
                          setEditingId(menu._id);
                          setShowForm(true);
                        }}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger btn-sm" id={`delete-menu-${menu._id}`}
                        onClick={() => handleDelete(menu._id, menu.label)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
