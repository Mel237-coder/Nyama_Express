'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-menu';

interface Category {
  id: string | null;
  name: string;
  description: string | null;
  items: any[];
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createCategory.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
    setShowCreateDialog(false);
    setName('');
    setDescription('');
  };

  const handleEdit = async () => {
    if (!editingCategory || !name.trim()) return;
    await updateCategory.mutateAsync({
      id: editingCategory.id!,
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setEditingCategory(null);
    setName('');
    setDescription('');
  };

  const handleDelete = async (id: string) => {
    await deleteCategory.mutateAsync(id);
    setDeleteConfirmId(null);
    if (activeCategory === id) {
      onSelectCategory(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {/* All items tab */}
        <button
          className={cn(
            'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            activeCategory === null
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
          onClick={() => onSelectCategory(null)}
        >
          Tous
        </button>

        {categories.map((cat) => (
          <div key={cat.id ?? 'uncategorized'} className="relative flex-shrink-0">
            <button
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name} ({cat.items.length})
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute -right-1 -top-1 rounded-full bg-card p-0.5 shadow-sm hover:bg-muted">
                  <MoreVertical className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingCategory(cat);
                    setName(cat.name);
                    setDescription(cat.description ?? '');
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => cat.id && setDeleteConfirmId(cat.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {/* Add category button */}
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 rounded-full"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Categorie
        </Button>
      </div>

      {/* Create category dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle categorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de la categorie"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (optionnel)</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la categorie"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createCategory.isPending}>
              Creer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit category dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la categorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cat-name">Nom</Label>
              <Input
                id="edit-cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-desc">Description</Label>
              <Textarea
                id="edit-cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={!name.trim() || updateCategory.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la categorie ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action supprimera la categorie et tous ses articles. Cette action est irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteCategory.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}