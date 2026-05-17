'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/use-menu';
import type { MenuItem } from '@djossfood/database';

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

interface ItemTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
}

export function ItemTable({ items, onEdit }: ItemTableProps) {
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  const toggleAvailability = (item: MenuItem) => {
    updateMenuItem.mutate({
      id: item.id,
      is_available: !item.is_available,
    });
  };

  const handleDelete = (item: MenuItem) => {
    if (confirm(`Supprimer "${item.name}" ?`)) {
      deleteMenuItem.mutate(item.id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">Aucun article dans cette categorie</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Image</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Prix</TableHead>
          <TableHead>Disponible</TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onEdit(item)}
          >
            <TableCell>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  N/A
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="hidden max-w-[200px] truncate md:table-cell">
              {item.description}
            </TableCell>
            <TableCell className="font-semibold text-primary">
              {formatAmount(item.price)}
            </TableCell>
            <TableCell>
              <Switch
                checked={item.is_available}
                onCheckedChange={() => toggleAvailability(item)}
                onClick={(e) => e.stopPropagation()}
              />
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}