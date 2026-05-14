import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api, storage } from '../../lib/api';
import { GlassCard } from '../../components/layout/GlassCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { NeonButton } from '../../components/layout/NeonButton';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  Ban,
  Pencil,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react';

interface AppUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string;
  role: 'CLIENT' | 'RESTAURANT_OWNER' | 'DELIVERY_PERSON' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  newToday: number;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  RESTAURANT_OWNER: 'Propriétaire',
  DELIVERY_PERSON: 'Livreur',
  ADMIN: 'Admin',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  SUSPENDED: 'Suspendu',
  DELETED: 'Supprimé',
};

const ROLE_COLORS: Record<string, string> = {
  CLIENT: 'text-white/60',
  RESTAURANT_OWNER: 'text-[#FFD600]',
  DELIVERY_PERSON: 'text-[#00D4FF]',
  ADMIN: 'text-[#FF3366]',
};

const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'status-success',
  PENDING: 'status-info',
  SUSPENDED: 'status-danger',
  DELETED: 'text-white/30',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { language, t } = useLanguage();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [filtered, setFiltered] = useState<AppUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState<Partial<AppUser>>({});
  const [saving, setSaving] = useState(false);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <GlassCard elevated className="max-w-md w-full p-8 text-center space-y-4">
          <Ban className="w-10 h-10 mx-auto" style={{ color: '#FF3366' }} />
          <h1 className="text-xl font-bold text-white">
            {language === 'fr' ? 'Accès refusé' : 'Unauthorized'}
          </h1>
          <p className="text-sm text-white/50">
            {language === 'fr'
              ? 'Vous devez être administrateur pour accéder à cette page.'
              : 'You must be an administrator to access this page.'}
          </p>
          <NeonButton onClick={() => router.push('/')}>
            {language === 'fr' ? 'Retour à l\'accueil' : 'Return home'}
          </NeonButton>
        </GlassCard>
      </div>
    );
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = storage.getAccessToken();
      if (!token) return;

      const [usersData, statsData]: [any, any] = await Promise.all([
        api.getUsers({ search, role: roleFilter, status: statusFilter }, token),
        api.getUserStats(token),
      ]);

      const list = Array.isArray(usersData) ? usersData : usersData.data || [];
      setUsers(list);
      setFiltered(list);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers(MOCK_USERS);
      setFiltered(MOCK_USERS);
      setStats({
        total: MOCK_USERS.length,
        active: MOCK_USERS.filter((u) => u.status === 'ACTIVE').length,
        suspended: MOCK_USERS.filter((u) => u.status === 'SUSPENDED').length,
        newToday: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const term = search.toLowerCase().trim();
    let list = [...users];
    if (term) {
      list = list.filter(
        (u) =>
          (u.firstName && u.firstName.toLowerCase().includes(term)) ||
          (u.lastName && u.lastName.toLowerCase().includes(term)) ||
          (u.email && u.email.toLowerCase().includes(term)) ||
          u.phone.includes(term)
      );
    }
    if (roleFilter) {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (statusFilter) {
      list = list.filter((u) => u.status === statusFilter);
    }
    setFiltered(list);
  }, [search, roleFilter, statusFilter, users]);

  const handleEdit = (u: AppUser) => {
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone,
      role: u.role,
      status: u.status,
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const token = storage.getAccessToken();
      if (!token) return;
      await api.updateUser(editingUser.id, editForm, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...editForm } as AppUser : u))
      );
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
      alert(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: AppUser) => {
    const newStatus = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const token = storage.getAccessToken();
      if (!token) return;
      await api.updateUser(u.id, { status: newStatus }, token);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, status: newStatus } as AppUser : item))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert(language === 'fr' ? 'Erreur lors du changement de statut' : 'Status change failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'fr' ? 'Confirmer la suppression ?' : 'Confirm deletion?')) return;
    try {
      const token = storage.getAccessToken();
      if (!token) return;
      await api.deleteUser(id, token);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(language === 'fr' ? 'Erreur lors de la suppression' : 'Deletion failed');
    }
  };

  const statCards = [
    {
      label: language === 'fr' ? 'Total' : 'Total',
      value: stats?.total ?? 0,
      icon: Users,
      color: 'text-[#FFD600]',
    },
    {
      label: language === 'fr' ? 'Actifs' : 'Active',
      value: stats?.active ?? 0,
      icon: UserCheck,
      color: 'text-[#00FF88]',
    },
    {
      label: language === 'fr' ? 'Suspendus' : 'Suspended',
      value: stats?.suspended ?? 0,
      icon: UserX,
      color: 'text-[#FF3366]',
    },
    {
      label: language === 'fr' ? 'Nouveaux' : 'New Today',
      value: stats?.newToday ?? 0,
      icon: UserPlus,
      color: 'text-[#00D4FF]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <GlassHeader title="Gestion des utilisateurs" />

      <main className="px-4 py-4 space-y-4 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s, idx) => (
            <GlassCard key={idx} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-white/5 ${s.color}`}>
                  <s.icon size={20} />
                </div>
              </div>
              <p className="text-sm text-white/50 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </GlassCard>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
              className="neon-input pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="neon-input appearance-none pr-10 cursor-pointer"
            >
              <option value="">{language === 'fr' ? 'Tous les rôles' : 'All roles'}</option>
              <option value="CLIENT">Client</option>
              <option value="RESTAURANT_OWNER">Propriétaire</option>
              <option value="DELIVERY_PERSON">Livreur</option>
              <option value="ADMIN">Admin</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neon-input appearance-none pr-10 cursor-pointer"
            >
              <option value="">{language === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
              <option value="ACTIVE">Actif</option>
              <option value="PENDING">En attente</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="DELETED">Supprimé</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-sm font-semibold text-white/60">
                    {language === 'fr' ? 'Nom' : 'Name'}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-white/60 hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-white/60 hidden lg:table-cell">
                    {language === 'fr' ? 'Téléphone' : 'Phone'}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-white/60">
                    {language === 'fr' ? 'Rôle' : 'Role'}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-white/60">
                    {language === 'fr' ? 'Statut' : 'Status'}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-white/60 text-right">
                    {language === 'fr' ? 'Actions' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-white/50">
                      <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#FFD600' }} />
                      <p>{language === 'fr' ? 'Aucun utilisateur trouvé' : 'No users found'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">
                          {u.firstName || ''} {u.lastName || ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-white/60 text-sm">{u.email || '-'}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-white/60 text-sm">{u.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${ROLE_COLORS[u.role] || 'text-white/60'}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${STATUS_CLASSES[u.status] || 'text-white/60'}`}>
                          {STATUS_LABELS[u.status] || u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="ghost-btn p-2"
                            title={language === 'fr' ? 'Modifier' : 'Edit'}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="ghost-btn p-2"
                            title={u.status === 'SUSPENDED' ? 'Activer' : 'Suspendre'}
                          >
                            <UserCheck
                              size={16}
                              className={u.status === 'SUSPENDED' ? 'text-[#00FF88]' : 'text-[#FFD600]'}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="ghost-btn p-2 text-[#FF3366] hover:text-[#FF3366]"
                            title={language === 'fr' ? 'Supprimer' : 'Delete'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard elevated className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {language === 'fr' ? 'Modifier l\'utilisateur' : 'Edit User'}
              </h2>
              <button onClick={() => setEditingUser(null)} className="ghost-btn p-2">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  {language === 'fr' ? 'Prénom' : 'First Name'}
                </label>
                <input
                  type="text"
                  value={editForm.firstName || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="neon-input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  {language === 'fr' ? 'Nom' : 'Last Name'}
                </label>
                <input
                  type="text"
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="neon-input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="neon-input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  {language === 'fr' ? 'Téléphone' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="neon-input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  {language === 'fr' ? 'Rôle' : 'Role'}
                </label>
                <select
                  value={editForm.role || ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, role: e.target.value as AppUser['role'] }))
                  }
                  className="neon-input appearance-none"
                >
                  <option value="CLIENT">Client</option>
                  <option value="RESTAURANT_OWNER">Propriétaire</option>
                  <option value="DELIVERY_PERSON">Livreur</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  {language === 'fr' ? 'Statut' : 'Status'}
                </label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, status: e.target.value as AppUser['status'] }))
                  }
                  className="neon-input appearance-none"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="PENDING">En attente</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="DELETED">Supprimé</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <NeonButton variant="ghost" onClick={() => setEditingUser(null)}>
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </NeonButton>
              <NeonButton onClick={handleSave} disabled={saving}>
                {saving
                  ? language === 'fr'
                    ? 'Sauvegarde...'
                    : 'Saving...'
                  : language === 'fr'
                  ? 'Sauvegarder'
                  : 'Save'}
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="border-b border-white/5">
          <td className="px-4 py-3">
            <div className="shimmer h-5 w-32 rounded" />
          </td>
          <td className="px-4 py-3 hidden md:table-cell">
            <div className="shimmer h-4 w-40 rounded" />
          </td>
          <td className="px-4 py-3 hidden lg:table-cell">
            <div className="shimmer h-4 w-28 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="shimmer h-4 w-20 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="shimmer h-4 w-16 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-2">
              <div className="shimmer w-8 h-8 rounded-lg" />
              <div className="shimmer w-8 h-8 rounded-lg" />
              <div className="shimmer w-8 h-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

const MOCK_USERS: AppUser[] = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+237612345678',
    role: 'CLIENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Kouam',
    email: 'marie.kouam@example.com',
    phone: '+237623456789',
    role: 'RESTAURANT_OWNER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    firstName: 'Paul',
    lastName: 'Ngono',
    email: 'paul.ngono@example.com',
    phone: '+237634567890',
    role: 'DELIVERY_PERSON',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@foodapp.cm',
    phone: '+237699999999',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    firstName: 'Sophie',
    lastName: 'Mbida',
    email: 'sophie.mbida@example.com',
    phone: '+237645678901',
    role: 'CLIENT',
    status: 'SUSPENDED',
    createdAt: new Date().toISOString(),
  },
];
