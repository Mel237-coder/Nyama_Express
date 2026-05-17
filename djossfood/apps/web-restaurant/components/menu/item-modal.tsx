'use client';

import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/use-menu';
import type { MenuItem } from '@djossfood/database';

interface Category {
  id: string | null;
  name: string;
  items: MenuItem[];
}

interface ItemModalProps {
  categories: Category[];
  item: MenuItem | null; // null = create mode, non-null = edit mode
  open: boolean;
  onClose: () => void;
}

export function ItemModal({ categories, item, open, onClose }: ItemModalProps) {
  const isEditing = !!item;
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Populate form when editing
  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description ?? '');
      setPrice(item.price.toString());
      setImageUrl(item.image_url ?? '');
      setCategoryId(item.category_id ?? '');
      setTags(item.tags?.join(', ') ?? '');
      setIsAvailable(item.is_available);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setCategoryId('');
      setTags('');
      setIsAvailable(true);
    }
  }, [item, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !price) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price),
      category_id: categoryId || undefined,
      image_url: imageUrl.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      is_available: isAvailable,
    };

    if (isEditing && item) {
      await updateMenuItem.mutateAsync({ id: item.id, ...data });
    } else {
      await createMenuItem.mutateAsync(data);
    }
    onClose();
  };

  const isPending = createMenuItem.isPending || updateMenuItem.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'article" : 'Nouvel article'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Nom *</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'article"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'article"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-price">Prix (FCFA) *</Label>
            <Input
              id="item-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-image">URL de l&apos;image</Label>
            <Input
              id="item-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-category">Categorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => cat.id !== null)
                  .map((cat) => (
                    <SelectItem key={cat.id!} value={cat.id!}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-tags">Tags (separes par des virgules)</Label>
            <Input
              id="item-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="populaire, epice, rapide"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="item-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="item-available">Disponible</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !price || isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}