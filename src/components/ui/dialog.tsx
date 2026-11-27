'use client';
import * as Primitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
export function Dialog({title, children, onClose, description='Eingaben bearbeiten und speichern.'}:{title:string; children:ReactNode; onClose:()=>void; description?:string}) {
  return <Primitive.Root open onOpenChange={open=>{if(!open) onClose();}}><Primitive.Portal><Primitive.Overlay className="dialog-overlay"/><Primitive.Content className="dialog-content"><div className="dialog-heading"><Primitive.Title>{title}</Primitive.Title><Primitive.Close aria-label="Schließen" className="icon-button"><X size={20}/></Primitive.Close></div><Primitive.Description className="sr-only">{description}</Primitive.Description>{children}</Primitive.Content></Primitive.Portal></Primitive.Root>;
}
