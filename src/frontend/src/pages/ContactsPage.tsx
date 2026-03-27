import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { EmergencyContact } from "../types";

const RELATIONSHIPS = [
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Husband",
  "Friend",
  "Other",
];

interface Props {
  contacts: EmergencyContact[];
  onAdd: (c: EmergencyContact) => void;
  onUpdate: (c: EmergencyContact) => void;
  onDelete: (id: string) => void;
}

const emptyForm = { name: "", phone: "", relationship: "Friend" };

export default function ContactsPage({
  contacts,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };
  const openEdit = (c: EmergencyContact) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, relationship: c.relationship });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    if (editing) {
      onUpdate({ ...editing, ...form });
      toast.success("Contact updated");
    } else {
      if (contacts.length >= 5) {
        toast.error("Maximum 5 contacts allowed");
        return;
      }
      onAdd({ id: Date.now().toString(), ...form });
      toast.success("Contact added");
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">Emergency Contacts</h2>
          <p className="text-xs text-muted-foreground">
            {contacts.length}/5 contacts saved
          </p>
        </div>
        {contacts.length < 5 && (
          <Button
            size="sm"
            data-ocid="contacts.add.button"
            onClick={openAdd}
            className="bg-primary text-primary-foreground rounded-xl gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        )}
      </div>

      {contacts.length === 0 ? (
        <div
          className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-3"
          data-ocid="contacts.empty_state"
        >
          <div className="text-4xl">👥</div>
          <p className="font-semibold">No emergency contacts yet</p>
          <p className="text-sm text-muted-foreground">
            Add up to 5 trusted contacts who will be notified during
            emergencies.
          </p>
          <Button
            onClick={openAdd}
            className="bg-primary text-primary-foreground"
            data-ocid="contacts.empty.add.button"
          >
            <Plus className="w-4 h-4 mr-1" /> Add First Contact
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          {contacts.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4"
              data-ocid={`contacts.item.${i + 1}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{c.name}</p>
                    {i === 0 && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 h-4">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {c.relationship}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {c.phone}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={`tel:${c.phone}`}
                    className="w-9 h-9 rounded-xl bg-safe/15 flex items-center justify-center"
                    aria-label={`Call ${c.name}`}
                  >
                    <Phone className="w-4 h-4 text-safe" />
                  </a>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center"
                    aria-label="Edit"
                    data-ocid={`contacts.edit_button.${i + 1}`}
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(c.id)}
                    className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"
                    aria-label="Delete"
                    data-ocid={`contacts.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <div className="bg-safe/10 border border-safe/20 rounded-xl px-4 py-3">
        <p className="text-xs text-safe/80">
          💚 The first contact is your primary emergency contact and will be
          called directly during SOS.
        </p>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent
          data-ocid="contacts.dialog"
          className="max-w-sm rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Contact" : "Add Emergency Contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="c-name">Full Name *</Label>
              <Input
                id="c-name"
                data-ocid="contacts.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Priya Sharma"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="c-phone">Phone Number *</Label>
              <Input
                id="c-phone"
                data-ocid="contacts.phone.input"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="e.g. +91 98765 43210"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="c-rel">Relationship *</Label>
              <Select
                value={form.relationship}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, relationship: v }))
                }
              >
                <SelectTrigger
                  id="c-rel"
                  data-ocid="contacts.relationship.select"
                  className="mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="contacts.cancel_button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="contacts.save_button"
              onClick={handleSave}
              className="bg-primary text-primary-foreground"
            >
              {editing ? "Update" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="contacts.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="contacts.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="contacts.delete.confirm_button"
              className="bg-primary text-primary-foreground"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  toast.success("Contact deleted");
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
