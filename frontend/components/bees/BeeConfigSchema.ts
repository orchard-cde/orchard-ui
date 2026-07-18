import type { BeeType } from '@/types/orchard';

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'number';
  options?: string[];
  defaultValue?: string;
  required?: boolean;
}

export interface BeeTypeConfig {
  label: string;
  icon: string;
  versionPlaceholder?: string;
  fields: ConfigField[];
}

export const BEE_TYPE_SCHEMAS: Record<BeeType, BeeTypeConfig> = {
  CLAUDE_CODE: {
    label: 'Claude Code',
    icon: 'Bot',
    fields: [
      { key: 'model', label: 'Model', type: 'select', options: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'], defaultValue: 'claude-sonnet-4-20250514' },
      { key: 'allowedTools', label: 'Allowed Tools', type: 'text' },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number' },
      { key: 'claudeMdContent', label: 'CLAUDE.md Content', type: 'textarea' },
      { key: 'agentsMdContent', label: 'AGENTS.md Content', type: 'textarea' },
    ],
  },
  GEMINI: {
    label: 'Gemini CLI',
    icon: 'Sparkles',
    fields: [
      { key: 'model', label: 'Model', type: 'select', options: ['gemini-2.5-pro', 'gemini-2.5-flash'], defaultValue: 'gemini-2.5-pro' },
    ],
  },
  CODEX: {
    label: 'Codex',
    icon: 'Terminal',
    fields: [
      { key: 'model', label: 'Model', type: 'select', options: ['o4-mini', 'o3'], defaultValue: 'o4-mini' },
    ],
  },
  KIRO: {
    label: 'Kiro CLI',
    icon: 'Code',
    fields: [
      { key: 'model', label: 'Model', type: 'text' },
    ],
  },
  OPENCODE: {
    label: 'OpenCode',
    icon: 'Terminal',
    fields: [
      { key: 'model', label: 'Model', type: 'text' },
    ],
  },
  CUSTOM: {
    label: 'Custom',
    icon: 'Settings',
    fields: [],
  },
};
