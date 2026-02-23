import { ThemeToggle } from './ThemeToggle';
import { ImportExport } from './ImportExport';
import { TagManager } from '@/components/tags/TagManager';
import { StatsPanel } from '@/components/productivity/StatsPanel';
import { motion } from 'motion/react';
import { Settings2, Tag, Database, BarChart2, Keyboard } from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  index: number;
}

function SettingsSection({ icon, title, description, children, index }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div
          className="flex items-center justify-center rounded-[var(--radius-sm)] shrink-0"
          style={{
            width: 32, height: 32,
            background: 'var(--color-primary-muted)',
            color: 'var(--color-primary)',
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </p>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Section body */}
      <div className="px-5 py-4">
        {children}
      </div>
    </motion.div>
  );
}

export function SettingsPanel() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <h1
          className="font-display font-bold"
          style={{ fontSize: 'var(--text-h1)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Customize your FlowTask experience
        </p>
      </motion.div>

      <div className="space-y-4">
        <SettingsSection
          index={0}
          icon={<Settings2 style={{ width: 16, height: 16 }} />}
          title="Appearance"
          description="Choose your preferred color theme"
        >
          <ThemeToggle />
        </SettingsSection>

        <SettingsSection
          index={1}
          icon={<Tag style={{ width: 16, height: 16 }} />}
          title="Tags"
          description="Organize tasks with color-coded labels"
        >
          <TagManager />
        </SettingsSection>

        <SettingsSection
          index={2}
          icon={<Database style={{ width: 16, height: 16 }} />}
          title="Data"
          description="Export or import your tasks and settings"
        >
          <ImportExport />
        </SettingsSection>

        <SettingsSection
          index={3}
          icon={<BarChart2 style={{ width: 16, height: 16 }} />}
          title="Productivity Stats"
          description="Your activity summary and progress"
        >
          <StatsPanel />
        </SettingsSection>

        {/* Keyboard shortcuts */}
        <SettingsSection
          index={4}
          icon={<Keyboard style={{ width: 16, height: 16 }} />}
          title="Keyboard Shortcuts"
          description="Speed up your workflow"
        >
          <div className="space-y-1.5">
            {[
              { keys: ['Ctrl', 'K'], label: 'Quick Capture' },
              { keys: ['Ctrl', 'N'], label: 'New Task' },
              { keys: ['1'], label: 'Switch to List view' },
              { keys: ['2'], label: 'Switch to Board view' },
              { keys: ['3'], label: 'Switch to Calendar view' },
            ].map(({ keys, label }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <div className="flex items-center gap-1">
                  {keys.map((key, i) => (
                    <span key={i}>
                      <kbd
                        className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-xs font-mono font-medium"
                        style={{
                          background: 'var(--color-surface-raised)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {key}
                      </kbd>
                      {i < keys.length - 1 && (
                        <span className="mx-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* App info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs pb-4"
          style={{ color: 'var(--color-text-disabled)' }}
        >
          FlowTask — Focus. Flow. Finish.
        </motion.p>
      </div>
    </div>
  );
}
