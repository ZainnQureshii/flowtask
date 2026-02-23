import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useTaskStore } from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import type { ExportData } from '@flowtask/shared';

export function ImportExport() {
  const { fetchTasks, fetchTags } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleExport() {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `flowtask-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Data exported successfully' });
    } catch {
      setStatus({ type: 'error', message: 'Failed to export data' });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ExportData;
        setImportData(data);
        setImportDialogOpen(true);
      } catch {
        setStatus({ type: 'error', message: 'Invalid JSON file' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleImport() {
    if (!importData) return;
    try {
      await api.importData(importData);
      await fetchTasks();
      await fetchTags();
      setStatus({ type: 'success', message: 'Data imported successfully' });
    } catch {
      setStatus({ type: 'error', message: 'Failed to import data' });
    }
    setImportDialogOpen(false);
    setImportData(null);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Import / Export</h3>

      {status && (
        <div className={`flex items-center gap-2 rounded-md border p-2 text-sm ${status.type === 'success' ? 'border-green-500/30 text-green-600' : 'border-red-500/30 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {status.message}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" /> Export Data
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
          <Upload className="h-4 w-4" /> Import Data
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>Review the data before importing.</DialogDescription>
          </DialogHeader>
          {importData && (
            <div className="space-y-2 text-sm">
              <p>Tasks to import: <strong>{importData.tasks?.length ?? 0}</strong></p>
              <p>Tags to import: <strong>{importData.tags?.length ?? 0}</strong></p>
              {importData.version && <p className="text-xs text-muted-foreground">Version: {importData.version}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
