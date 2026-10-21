'use client';

import { useState } from 'react';
import { NEWSLETTER_PRESETS } from '@/lib/newsletter-presets';

export default function NewsletterPresetPicker({ activePresetId, onSelectPreset }) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(NEWSLETTER_PRESETS.map((p) => p.category))];
  const filtered = selectedCategory === 'All'
    ? NEWSLETTER_PRESETS
    : NEWSLETTER_PRESETS.filter((p) => p.category === selectedCategory);

  const activePreset = NEWSLETTER_PRESETS.find((p) => p.id === activePresetId) || NEWSLETTER_PRESETS[0];

  const handleApply = (preset) => {
    if (window.confirm(`Load the "${preset.name}" preset? This will update your email subject, heading, and rich text content.`)) {
      onSelectPreset(preset);
      setOpen(false);
    }
  };

  return (
    <div className="admin-newsletter-presets">
      <div className="admin-preset-bar">
        <div className="admin-preset-bar__info">
          <strong>Current Preset: {activePreset?.name || 'Custom'}</strong>
          <span>{activePreset?.description || 'Select a curated template to start or switch styles.'}</span>
        </div>
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? 'Hide Presets' : 'Browse Presets & Templates ▾'}
        </button>
      </div>

      {open ? (
        <div className="admin-card" style={{ marginTop: 12, marginBottom: 16 }}>
          <div className="admin-card__heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 16, margin: 0 }}>Preset Email Templates</h2>
              <p className="admin-field-help" style={{ margin: 0 }}>
                Choose a bespoke template tailored for fine jewellery announcements, private viewings, or storytelling.
              </p>
            </div>
            <div className="admin-view-tabs" style={{ margin: 0 }}>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`admin-text-button ${selectedCategory === cat ? 'is-active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: 12, fontWeight: selectedCategory === cat ? 600 : 400 }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-preset-grid">
            {filtered.map((preset) => (
              <div
                key={preset.id}
                className={`admin-preset-card ${activePresetId === preset.id ? 'is-active' : ''}`}
                onClick={() => handleApply(preset)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleApply(preset); }}
              >
                <div className="admin-preset-card__head">
                  <span className="admin-preset-card__badge">{preset.badge}</span>
                  <span style={{ fontSize: 11, color: '#8a857b' }}>{preset.category}</span>
                </div>
                <div>
                  <h3 className="admin-preset-card__title">{preset.name}</h3>
                  <p className="admin-preset-card__desc">{preset.description}</p>
                </div>
                <button
                  type="button"
                  className="admin-preset-card__button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(preset);
                  }}
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
