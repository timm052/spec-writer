'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { Section } from '@spec-writer/db';

interface SectionTreeProps {
  sections: Section[];
  selectedSectionId?: string;
  onSelectSection: (sectionId: string | undefined) => void;
}

export function SectionTree({ sections, selectedSectionId, onSelectSection }: SectionTreeProps) {
  return (
    <nav aria-label="Clause sections">
      <ul className="space-y-0.5">
        <li>
          <button
            className={cn(
              'w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors',
              !selectedSectionId
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            )}
            onClick={() => onSelectSection(undefined)}
            aria-pressed={!selectedSectionId}
          >
            All sections
          </button>
        </li>
        {sections.map((section) => (
          <li key={section.id}>
            <button
              className={cn(
                'w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors',
                selectedSectionId === section.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
              onClick={() => onSelectSection(section.id)}
              aria-pressed={selectedSectionId === section.id}
            >
              <span className="font-mono text-xs text-gray-400 mr-1.5">{section.code}</span>
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
