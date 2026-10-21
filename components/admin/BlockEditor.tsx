// @ts-nocheck
'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import ImagePicker, { VideoPicker } from './ImagePicker';
import LinkPicker from './LinkPicker';
import RichTextEditor from './RichTextEditor';
import SectionDesign from './SectionDesign';
import { HTML_TEMPLATES } from '@/lib/html-templates';
import SortableList, { moveItem } from './SortableList';
import { BLOCK_TYPES, FIELD_DEFS, FOCUS_OPTIONS, HERO_CONTENT_BLOCK_SCHEMA_VERSION, NOT_FOUND_CHILD_TYPES, PRODUCT_INFORMATION_CHILD_TYPES, PRODUCT_INFORMATION_DEFAULT_BLOCKS, SEARCH_HEADER_CHILD_TYPES, SEARCH_HEADER_DEFAULT_BLOCKS, SEARCH_RESULTS_CHILD_TYPES, SEARCH_RESULTS_DEFAULT_BLOCKS, TIMELINE_ICONS, TONES, VIDEO_STEP_ICONS, blockSummary, createBlock, createSectionCard, getHeroMediaConfiguration, getHeroSectionDefaults, getPath, mediaGuide, newId, setPath, updateHeroMediaConfiguration } from '@/lib/blocks';
import { COLOR_SCHEME_NUMBERS, DEFAULT_THEME, getThemeColorScheme } from '@/lib/theme';
import { isColorSchemeSelection, resolveColorSchemeSelection } from '@/lib/header-settings';
import { docToText, sanitizeRichDoc } from '@/lib/rich-text';

const MAX_NESTED_BLOCK_DEPTH = 5;
const MAX_CHILD_BLOCKS = 24;

// A plain code box: monospace, Tab indents instead of leaving the field.
function CodeField({ title, value, onChange, language, readOnly, lightSurface = false, maxLength }) {
  const text = value || '';
  const rows = Math.min(24, Math.max(language === 'css' ? 6 : 10, text.split('\n').length + 2));
  const onKeyDown = (event) => {
    if (event.key !== 'Tab' || event.shiftKey || readOnly) return;
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = el;
    const next = `${text.slice(0, start)}  ${text.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
  };
  return (
    <label className="admin-field">
      <span>{title}</span>
      <textarea className={`admin-code admin-code--${language}${lightSurface ? ' admin-code--light-surface' : ''}`} rows={rows} value={text} maxLength={maxLength ?? (language === 'liquid' ? 12000 : undefined)} spellCheck={false} autoCapitalize="off" autoComplete="off" readOnly={readOnly} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} />
    </label>
  );
}

function FieldControl({ name, label, value, onChange, iconOptions, guide, compactMedia = false, readOnly = false, validationPath = name, sourcePicker = null }) {
  const def = FIELD_DEFS[name] || { kind: 'text' };
  const title = label || def.label;
  const controlId = `dynamic-field-${useId()}`;
  const validationAttribute = validationPath ? { 'data-validation-path': validationPath } : {};
  if (def.kind === 'code') return <CodeField title={title} value={value} onChange={onChange} language={def.language} readOnly={readOnly} />;
  const help = def.help ? <span className="admin-field-help">{def.help}</span> : null;
  if (def.kind === 'image') {
    return <div className="admin-field" {...validationAttribute}>{sourcePicker ? <div className="admin-field__label-row"><span>{title}</span>{sourcePicker}</div> : <span>{title}</span>}<ImagePicker value={value || ''} onChange={onChange} guide={guide} compact={compactMedia} showGuide={!compactMedia} />{help}</div>;
  }
  if (def.kind === 'checkbox') {
    return <label className="admin-check"><input {...validationAttribute} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /><span>{title}</span></label>;
  }
  if (def.kind === 'video') {
    return <div className="admin-field" {...validationAttribute}><span>{title}</span><VideoPicker value={value || ''} onChange={onChange} guide={guide} compact={compactMedia} showGuide={!compactMedia} />{help}</div>;
  }
  if (def.kind === 'link') {
    return <div className="admin-field" {...validationAttribute}>{sourcePicker ? <div className="admin-field__label-row"><span>{title}</span>{sourcePicker}</div> : <span>{title}</span>}<LinkPicker value={value || ''} onChange={onChange} /></div>;
  }
  if (def.kind === 'focus' || def.kind === 'select' || def.kind === 'icon') {
    const options = def.kind === 'focus' ? FOCUS_OPTIONS : def.kind === 'icon' ? iconOptions || TIMELINE_ICONS : def.options;
    const known = options.some(([option]) => option === value);
    return (
      <label className="admin-field">
        <span>{title}</span>
        <select {...validationAttribute} value={value || ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">{def.kind === 'focus' ? 'Default' : 'Choose…'}</option>
          {!known && value ? <option value={value}>Custom ({value})</option> : null}
          {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
        </select>
      </label>
    );
  }
  if (def.kind === 'number') {
    return <label className="admin-field"><span>{title}</span><input {...validationAttribute} type="number" min={def.min} max={def.max} value={value || ''} onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))} /></label>;
  }
  if (def.kind === 'textarea') {
    const text = value || '';
    const rows = Math.min(14, Math.max(def.rows || 3, text.split('\n').length + 1));
    if (sourcePicker) return <div className="admin-field" {...validationAttribute}><div className="admin-field__label-row"><label htmlFor={controlId}>{title}</label>{sourcePicker}</div><textarea id={controlId} rows={rows} value={text} onChange={(event) => onChange(event.target.value)} /></div>;
    return <label className="admin-field"><span>{title}</span><textarea {...validationAttribute} rows={rows} value={text} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (sourcePicker) return <div className="admin-field" {...validationAttribute}><div className="admin-field__label-row"><label htmlFor={controlId}>{title}</label>{sourcePicker}</div><input id={controlId} value={value || ''} placeholder={def.placeholder} onChange={(event) => onChange(event.target.value)} /></div>;
  return <label className="admin-field"><span>{title}</span><input {...validationAttribute} value={value || ''} placeholder={def.placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function CardsEditor({ block, config, onChange, selectedCardId = null }) {
  const items = block.cards || [];
  const update = (next) => onChange({ ...block, cards: next });
  const iconOptions = block.type === 'processVideos' ? VIDEO_STEP_ICONS : TIMELINE_ICONS;
  const canAdd = items.length < (config.max || 12);
  useEffect(() => {
    if (!selectedCardId) return;
    document.querySelector(`[data-card-editor-id="${CSS.escape(selectedCardId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedCardId]);
  const addCard = () => update([...items, createSectionCard(block)]);
  return (
    <div className="admin-cards-editor">
      <div className="admin-cards-editor__head"><strong>{config.label}s</strong><span>{items.length} of up to {config.max}</span></div>
      <SortableList
        items={items}
        onReorder={(from, to) => update(moveItem(items, from, to))}
        renderItem={(card, index, handle) => (
          <div className={`admin-card-item${selectedCardId === card.id ? ' is-focused' : ''}`} data-card-editor-id={card.id}>
            <div className="admin-card-item__head">
              <span {...handle}>⋮⋮</span>
              <strong>{config.label} {index + 1}{card.heading ? ` · ${String(card.heading).split('\n')[0].slice(0, 40)}` : ''}</strong>
              <div className="admin-block__tools">
                <button type="button" onClick={() => update(moveItem(items, index, index - 1))} disabled={index === 0} aria-label="Move up">↑</button>
                <button type="button" onClick={() => update(moveItem(items, index, index + 1))} disabled={index === items.length - 1} aria-label="Move down">↓</button>
                <button type="button" onClick={() => update(items.filter((_, i) => i !== index))} aria-label={`Remove ${config.label.toLowerCase()}`}>Remove</button>
              </div>
            </div>
            <div className="admin-card-item__fields">
              {config.fields.map((field) => (
                <FieldControl key={field} name={field} label={config.labels?.[field]} value={card[field]} iconOptions={iconOptions} guide={mediaGuide(block.type, field, card)} validationPath={`cards.${index}.${field}`} onChange={(value, altText) => update(items.map((item, itemIndex) => {
                  if (itemIndex !== index) return item;
                  const updatedItem = { ...item, [field]: value };
                  if (field === 'image' && config.fields.includes('imageAlt')) updatedItem.imageAlt = altText ?? '';
                  return updatedItem;
                }))} />
              ))}
            </div>
          </div>
        )}
      />
      {canAdd ? <button type="button" className="admin-button admin-button--ghost" onClick={addCard}>+ Add {config.label.toLowerCase()}</button> : null}
    </div>
  );
}

function ProductInformationBlocksEditor({ block, onChange }) {
  const blocks = Array.isArray(block.cards) ? block.cards : PRODUCT_INFORMATION_DEFAULT_BLOCKS;
  const update = (next) => onChange({ ...block, cards: next });
  const addBlock = (type) => {
    const definition = PRODUCT_INFORMATION_CHILD_TYPES[type];
    if (!definition) return;
    update([...blocks, {
      id: newId(`product-info-${type}`),
      type,
      label: definition.label,
      enabled: true,
      ...(type === 'quantitySelector' ? { count: 1 } : {}),
    }]);
  };

  return (
    <div className="admin-cards-editor">
      <div className="admin-cards-editor__head"><strong>Product information blocks</strong><span>{blocks.length} of up to 16</span></div>
      <SortableList
        items={blocks}
        onReorder={(from, to) => {
          const reordered = [...blocks];
          const [movedBlock] = reordered.splice(from, 1);
          reordered.splice(to, 0, movedBlock);
          update(reordered);
        }}
        renderItem={(childBlock, index, handle) => {
          const definition = PRODUCT_INFORMATION_CHILD_TYPES[childBlock.type];
          const childFields = definition?.fields || [];
          return (
            <div className={`admin-card-item${childBlock.enabled === false ? ' is-disabled' : ''}`} data-product-information-block-id={childBlock.id}>
              <div className="admin-card-item__head">
                <span {...handle}>⋮⋮</span>
                <strong>{definition?.label || childBlock.label || childBlock.type || 'Block'}</strong>
                <div className="admin-block__tools">
                  <button type="button" onClick={() => {
                    if (index === 0) return;
                    const reordered = [...blocks];
                    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
                    update(reordered);
                  }} disabled={index === 0} aria-label="Move block up">↑</button>
                  <button type="button" onClick={() => {
                    if (index >= blocks.length - 1) return;
                    const reordered = [...blocks];
                    [reordered[index + 1], reordered[index]] = [reordered[index], reordered[index + 1]];
                    update(reordered);
                  }} disabled={index === blocks.length - 1} aria-label="Move block down">↓</button>
                  <button type="button" aria-pressed={childBlock.enabled !== false} onClick={() => update(blocks.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: item.enabled === false } : item))}>{childBlock.enabled === false ? 'Show' : 'Hide'}</button>
                  <button type="button" onClick={() => update(blocks.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${definition?.label || 'block'}`}>Remove</button>
                </div>
              </div>
              {childFields.length ? (
                <div className="admin-card-item__fields">
                  {childFields.map((field) => (
                    <FieldControl
                      key={field}
                      name={field}
                      label={definition?.labels?.[field]}
                      value={childBlock[field]}
                      validationPath={`cards.${index}.${field}`}
                      onChange={(value) => update(blocks.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))}
                    />
                  ))}
                </div>
              ) : <p className="admin-field-help">This block uses product data and has no additional settings.</p>}
            </div>
          );
        }}
      />
      <label className="admin-field">
        <span>Add product information block</span>
        <select value="" onChange={(event) => { if (event.target.value && blocks.length < 16) addBlock(event.target.value); }}>
          <option value="">Choose a block…</option>
          {Object.entries(PRODUCT_INFORMATION_CHILD_TYPES).map(([type, definition]) => <option key={type} value={type}>{definition.label}</option>)}
        </select>
      </label>
      {blocks.length >= 16 ? <p className="admin-field-help">This section has the maximum number of blocks.</p> : null}
    </div>
  );
}

function SearchNestedBlocksEditor({ block, onChange, group }) {
  const isSearchHeader = group === 'header';
  const childTypes = isSearchHeader ? SEARCH_HEADER_CHILD_TYPES : SEARCH_RESULTS_CHILD_TYPES;
  const defaultBlocks = isSearchHeader ? SEARCH_HEADER_DEFAULT_BLOCKS : SEARCH_RESULTS_DEFAULT_BLOCKS;
  const blocks = Array.isArray(block.cards) ? block.cards : defaultBlocks;
  const update = (next) => onChange({ ...block, cards: next });
  const addBlock = (type) => {
    if (!Object.hasOwn(childTypes, type) || blocks.some((item) => item.type === type)) return;
    const defaultBlock = defaultBlocks.find((item) => item.type === type);
    if (defaultBlock) update([...blocks, { ...defaultBlock, id: newId(type) }]);
  };

  return (
    <div className="admin-cards-editor">
      <div className="admin-cards-editor__head"><strong>{isSearchHeader ? 'Search page blocks' : 'Search results blocks'}</strong><span>{blocks.length} block{blocks.length === 1 ? '' : 's'}</span></div>
      <SortableList
        items={blocks}
        onReorder={(from, to) => update(moveItem(blocks, from, to))}
        renderItem={(childBlock, index, handle) => {
          const definition = childTypes[childBlock.type];
          if (!definition) return null;
          return (
            <div className={`admin-card-item${childBlock.enabled === false ? ' is-disabled' : ''}`} key={childBlock.id}>
              <div className="admin-card-item__head">
                <span {...handle}>⋮⋮</span>
                <strong>{definition.label}</strong>
                <div className="admin-block__tools">
                  <button type="button" onClick={() => update(moveItem(blocks, index, index - 1))} disabled={index === 0} aria-label={`Move ${definition.label.toLowerCase()} up`}>↑</button>
                  <button type="button" onClick={() => update(moveItem(blocks, index, index + 1))} disabled={index === blocks.length - 1} aria-label={`Move ${definition.label.toLowerCase()} down`}>↓</button>
                  <button type="button" aria-pressed={childBlock.enabled !== false} onClick={() => update(blocks.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: item.enabled === false } : item))}>{childBlock.enabled === false ? 'Show' : 'Hide'}</button>
                  <button type="button" onClick={() => update(blocks.filter((item) => item.id !== childBlock.id))} aria-label={`Remove ${definition.label.toLowerCase()}`}>Remove</button>
                </div>
              </div>
              <div className="admin-card-item__fields">
                {definition.fields.map((field) => (
                  <FieldControl
                    key={field}
                    name={field}
                    label={definition.labels?.[field]}
                    value={childBlock[field]}
                    onChange={(value) => update(blocks.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))}
                  />
                ))}
              </div>
            </div>
          );
        }}
      />
      <label className="admin-field">
        <span>Add block</span>
        <select value="" onChange={(event) => { if (event.target.value) addBlock(event.target.value); }}>
          <option value="">Choose a block…</option>
          {Object.entries(childTypes).filter(([type]) => !blocks.some((item) => item.type === type)).map(([type, definition]) => <option key={type} value={type}>{definition.label}</option>)}
        </select>
      </label>
    </div>
  );
}

function duplicateBlockTree(block) {
  const copy = JSON.parse(JSON.stringify(block));
  copy.id = newId(copy.type || 'block');
  if (Array.isArray(copy.blocks)) copy.blocks = copy.blocks.map(duplicateBlockTree);
  if (Array.isArray(copy.cards)) {
    copy.cards = copy.cards.map((card) => ({
      ...card,
      id: newId('card'),
      ...(Array.isArray(card.blocks) ? { blocks: card.blocks.map(duplicateBlockTree) } : {}),
    }));
  }
  return copy;
}

function containsNestedBlock(block, selectedBlockId) {
  return Boolean(selectedBlockId && (block.id === selectedBlockId || block.blocks?.some((child) => containsNestedBlock(child, selectedBlockId))));
}

function BlockSettingsJson({ settings, onChange }) {
  const serializedSettings = JSON.stringify(settings || {}, null, 2);
  const [text, setText] = useState(serializedSettings);
  const [error, setError] = useState('');

  useEffect(() => {
    setText(serializedSettings);
    setError('');
  }, [serializedSettings]);

  const saveSettings = () => {
    try {
      const parsedSettings = JSON.parse(text || '{}');
      if (!parsedSettings || typeof parsedSettings !== 'object' || Array.isArray(parsedSettings)) {
        setError('Settings must be a JSON object.');
        return;
      }
      onChange(parsedSettings);
      setError('');
    } catch {
      setError('Enter valid JSON before leaving this field.');
    }
  };

  return (
    <details className="shopify-editor-settings__group">
      <summary>Advanced settings</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field">
          <span>Settings (JSON)</span>
          <textarea className="admin-code admin-code--json" rows={Math.min(16, Math.max(5, text.split('\n').length + 1))} value={text} spellCheck={false} onChange={(event) => setText(event.target.value)} onBlur={saveSettings} aria-invalid={Boolean(error)} />
          <span className="admin-field-help">Use a JSON object. Nested values are bounded when the page is saved.</span>
          {error ? <span className="admin-form-message" role="alert">{error}</span> : null}
        </label>
      </div>
    </details>
  );
}

function NestedBlockItem({ block, index, total, handle, onChange, onMove, onDuplicate, onDelete, canEditCode, depth, selectedCardId, collectionOptions, themeColors, onOpenThemeSettings, resourceTitle, resourceType }) {
  const isSelected = containsNestedBlock(block, selectedCardId);
  const [expanded, setExpanded] = useState(isSelected);
  const config = BLOCK_TYPES[block.type];
  const label = config?.label || block.label || block.type || 'Block';
  const summary = blockSummary(block);
  const isStaticBlogBlock = Boolean(block.static && typeof block.type === 'string' && block.type.startsWith('blogPost'));
  const isBlogTemplateBlock = block.type === 'blogTitle' || isStaticBlogBlock;

  useEffect(() => {
    if (!isSelected) return;
    setExpanded(true);
    document.querySelector(`[data-nested-block-id="${CSS.escape(block.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [block.id, isSelected]);

  return (
    <div className={`admin-card-item${expanded ? ' is-focused' : ''}${block.id === selectedCardId ? ' is-selected' : ''}${block.enabled === false ? ' is-disabled' : ''}`} data-nested-block-id={block.id}>
      <div className="admin-card-item__head">
        {block.static ? <span aria-hidden="true" /> : <span {...handle}>⋮⋮</span>}
        <button type="button" className="admin-block__title" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          <span className="admin-block__type">{label}</span>
          <span className="admin-block__summary">{summary || config?.description || 'Block settings'}</span>
        </button>
        {isStaticBlogBlock ? <div className="admin-block__tools">
          <button type="button" aria-pressed={block.enabled !== false} onClick={() => onChange({ ...block, enabled: block.enabled === false })}>{block.enabled === false ? 'Show' : 'Hide'}</button>
        </div> : !block.static ? <div className="admin-block__tools">
          <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} aria-label={`Move ${label.toLowerCase()} up`}>↑</button>
          <button type="button" onClick={() => onMove(index + 1)} disabled={index === total - 1} aria-label={`Move ${label.toLowerCase()} down`}>↓</button>
          <button type="button" onClick={onDuplicate}>Duplicate</button>
          {isBlogTemplateBlock ? <button type="button" aria-pressed={block.enabled !== false} onClick={() => onChange({ ...block, enabled: block.enabled === false })}>{block.enabled === false ? 'Show' : 'Hide'}</button> : null}
          <button type="button" onClick={onDelete}>Delete</button>
        </div> : null}
      </div>
      {expanded ? config ? (
        <BlockSettingsPanel block={block} onChange={onChange} canEditCode={canEditCode} depth={depth} selectedCardId={selectedCardId} showNestedBlocks={Boolean(config?.nestedBlocks)} nestedBlockTypes={config?.nestedBlockTypes || null} collectionOptions={collectionOptions} themeColors={themeColors} onOpenThemeSettings={onOpenThemeSettings} resourceTitle={resourceTitle} resourceType={resourceType} />
      ) : (
        <p className="admin-field-help" style={{ padding: '0 12px 12px' }}>This block type is not available in the editor. Its saved data is preserved until you delete it.</p>
      ) : null}
    </div>
  );
}

function NestedBlocksEditor({ block, onChange, canEditCode, depth = 0, selectedCardId = null, allowedTypes = null, collectionOptions = [], themeColors = DEFAULT_THEME, onOpenThemeSettings, resourceTitle, resourceType }) {
  const blocks = Array.isArray(block.blocks) ? block.blocks : [];
  const update = (nextBlocks) => onChange({ ...block, blocks: nextBlocks });
  const canAdd = depth < MAX_NESTED_BLOCK_DEPTH && blocks.length < MAX_CHILD_BLOCKS;
  const availableTypes = allowedTypes?.filter((type) => !BLOCK_TYPES[type]?.unique || !blocks.some((nestedBlock) => nestedBlock.type === type)) || null;
  const duplicate = (index) => {
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, duplicateBlockTree(blocks[index]));
    update(nextBlocks);
  };
  const remove = (index) => {
    const child = blocks[index];
    const label = BLOCK_TYPES[child.type]?.label || child.label || 'block';
    if (!window.confirm(`Delete the “${label}” block? You can undo by not saving.`)) return;
    update(blocks.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="admin-cards-editor">
      <div className="admin-cards-editor__head"><strong>Blocks</strong><span>{blocks.length} of up to {MAX_CHILD_BLOCKS}</span></div>
      <SortableList
        items={blocks}
        onReorder={(from, to) => update(moveItem(blocks, from, to))}
        renderItem={(childBlock, index, handle) => (
          <NestedBlockItem
            block={childBlock}
            index={index}
            total={blocks.length}
            handle={handle}
            onChange={(updated) => update(blocks.map((item, itemIndex) => itemIndex === index ? updated : item))}
            onMove={(target) => update(moveItem(blocks, index, target))}
            onDuplicate={() => duplicate(index)}
            onDelete={() => remove(index)}
            canEditCode={canEditCode}
            depth={depth + 1}
            selectedCardId={selectedCardId}
            collectionOptions={collectionOptions}
            themeColors={themeColors}
            onOpenThemeSettings={onOpenThemeSettings}
            resourceTitle={resourceTitle}
            resourceType={resourceType}
          />
        )}
      />
      {canAdd && (!availableTypes || availableTypes.length) ? <AddBlockButton onAdd={(type) => update([...blocks, createBlock(type)])} label="Add block" canEditCode={canEditCode} allowedTypes={availableTypes || (block.type === 'notFound' ? Object.keys(NOT_FOUND_CHILD_TYPES) : undefined)} /> : null}
      {depth >= MAX_NESTED_BLOCK_DEPTH ? <p className="admin-field-help">Blocks can be nested up to {MAX_NESTED_BLOCK_DEPTH} levels.</p> : null}
      {blocks.length >= MAX_CHILD_BLOCKS ? <p className="admin-field-help">This section has the maximum number of blocks.</p> : null}
    </div>
  );
}

const GROUP_NUMBER_LIMITS = {
  gap: [0, 160],
  widthCustom: [1, 2400],
  mobileWidthCustom: [1, 1200],
  heightCustom: [1, 2400],
  cornerRadius: [0, 200],
  overlayOpacity: [0, 100],
  paddingTop: [0, 200],
  paddingRight: [0, 200],
  paddingBottom: [0, 200],
  paddingLeft: [0, 200],
};

function boundedGroupNumber(settingName, value) {
  const [minimum, maximum] = GROUP_NUMBER_LIMITS[settingName];
  const numericValue = Number(value);
  return Math.min(maximum, Math.max(minimum, Number.isFinite(numericValue) ? numericValue : minimum));
}

function GroupSegmentedControl({ label, value, options, onChange }) {
  return (
    <fieldset className="shopify-shared-editor__segmented-field">
      <legend>{label}</legend>
      <div role="group" aria-label={label}>
        {options.map(([optionValue, optionLabel]) => (
          <button type="button" key={optionValue} aria-pressed={value === optionValue} className={value === optionValue ? 'is-selected' : ''} onClick={() => onChange(optionValue)}>{optionLabel}</button>
        ))}
      </div>
    </fieldset>
  );
}

function GroupRangeControl({ label, value, min, max, onChange, unit = 'px' }) {
  const numericValue = Math.max(min, Math.min(max, Number(value) || 0));
  const [numericDraft, setNumericDraft] = useState(String(numericValue));

  useEffect(() => setNumericDraft(String(numericValue)), [numericValue]);

  const updateNumericDraft = (rawValue) => {
    setNumericDraft(rawValue);
    if (rawValue === '') return;
    const parsedValue = Number(rawValue);
    if (Number.isFinite(parsedValue)) onChange(Math.max(min, Math.min(max, Math.round(parsedValue))));
  };

  const normalizeNumericDraft = () => {
    const parsedValue = Number(numericDraft);
    const normalizedValue = Number.isFinite(parsedValue) ? Math.max(min, Math.min(max, Math.round(parsedValue))) : numericValue;
    setNumericDraft(String(normalizedValue));
    onChange(normalizedValue);
  };

  return (
    <label className="shopify-shared-editor__range">
      <span>{label}</span>
      <div className="shopify-shared-editor__range-controls has-number-input">
        <input type="range" min={min} max={max} value={numericValue} aria-label={`${label} in ${unit}`} onChange={(event) => onChange(Number(event.target.value))} />
        <div className="shopify-shared-editor__range-number">
          <input type="number" min={min} max={max} step="1" value={numericDraft} aria-label={`${label} in ${unit}`} onChange={(event) => updateNumericDraft(event.target.value)} onBlur={normalizeNumericDraft} />
          <span>{unit}</span>
        </div>
      </div>
    </label>
  );
}

function GroupSettingsPanel({ block, onChange, themeColors = DEFAULT_THEME, onEditScheme }) {
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const linkPickerId = `group-link-picker-${block.id || 'settings'}`;
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const legacyDirection = ['vertical', 'horizontal', 'grid'].includes(block.layout) ? block.layout : 'vertical';
  const legacyGap = block.groupGap === 'compact' ? 16 : block.groupGap === 'spacious' ? 64 : 40;
  const direction = ['vertical', 'horizontal', 'grid'].includes(settings.direction) ? settings.direction : legacyDirection;
  const directionOptions = [['vertical', 'Vertical'], ['horizontal', 'Horizontal']];
  if (direction === 'grid') directionOptions.push(['grid', 'Grid']);
  const hasSavedColorScheme = isColorSchemeSelection(settings.colorScheme);
  const inheritColorScheme = typeof settings.inheritColorScheme === 'boolean'
    ? settings.inheritColorScheme
    : !hasSavedColorScheme;
  const savedScheme = resolveColorSchemeSelection(settings.savedColorScheme, 'scheme1').value;
  const colorScheme = settings.colorScheme === 'inherit'
    ? savedScheme
    : resolveColorSchemeSelection(settings.colorScheme, savedScheme).value;
  const backgroundMedia = ['none', 'image', 'video'].includes(settings.backgroundMedia) ? settings.backgroundMedia : 'none';
  const overlayEnabled = typeof settings.overlayEnabled === 'boolean' ? settings.overlayEnabled : Number(settings.overlayOpacity) > 0;
  const overlayOpacity = boundedGroupNumber('overlayOpacity', settings.overlayOpacity ?? settings.overlayOpacitySaved ?? 50);
  const numberField = (settingName, label, value, limits = GROUP_NUMBER_LIMITS[settingName]) => (
    <label className="admin-field shopify-editor-group-control__number">
      <span>{label}</span>
      <span className="shopify-editor-group-control__number-input">
        <input type="number" min={limits[0]} max={limits[1]} step="1" value={boundedGroupNumber(settingName, value ?? limits[0])} onChange={(event) => update({ [settingName]: boundedGroupNumber(settingName, event.target.value) })} />
        <span>px</span>
      </span>
    </label>
  );
  const sizeControl = (label, modeSetting, valueSetting, fallbackMode = 'fill') => {
    const mode = ['fit', 'fill', 'custom'].includes(settings[modeSetting]) ? settings[modeSetting] : fallbackMode;
    return (
      <div className="shopify-editor-group-control__size-control">
        <GroupSegmentedControl label={label} value={mode} options={[["fit", "Fit"], ["fill", "Fill"], ["custom", "Custom"]]} onChange={(value) => update({ [modeSetting]: value })} />
        {mode === 'custom' ? numberField(valueSetting, 'Custom size', settings[valueSetting] ?? 480, GROUP_NUMBER_LIMITS[valueSetting]) : null}
      </div>
    );
  };

  return (
    <>
      <details className="shopify-editor-settings__group" open>
        <summary>Layout</summary>
        <div className="shopify-editor-settings__group-body">
          <GroupSegmentedControl label="Direction" value={direction} options={directionOptions} onChange={(value) => update({ direction: value })} />
          <GroupSegmentedControl label="Alignment" value={['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left'} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(value) => update({ alignment: value })} />
          <label className="admin-field"><span>Position</span>
            <select value={['top', 'center', 'bottom', 'space-between'].includes(settings.position) ? settings.position : 'top'} onChange={(event) => update({ position: event.target.value })}>
              <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option><option value="space-between">Space between</option>
            </select>
          </label>
          <GroupRangeControl label="Gap" value={settings.gap ?? legacyGap} min={0} max={160} onChange={(value) => update({ gap: value })} />
        </div>
      </details>
      <details className="shopify-editor-settings__group" open>
        <summary>Size</summary>
        <div className="shopify-editor-settings__group-body">
          {sizeControl('Width', 'widthMode', 'widthCustom')}
          {sizeControl('Mobile width', 'mobileWidthMode', 'mobileWidthCustom')}
          {sizeControl('Height', 'heightMode', 'heightCustom', 'fit')}
        </div>
      </details>
      <details className="shopify-editor-settings__group" open>
        <summary>Appearance</summary>
        <div className="shopify-editor-settings__group-body">
          <label className="shopify-shared-editor__toggle shopify-editor-group-control__toggle"><input type="checkbox" checked={inheritColorScheme} onChange={(event) => {
            if (event.target.checked) update({ inheritColorScheme: true, savedColorScheme: colorScheme, colorScheme: 'inherit' });
            else update({ inheritColorScheme: false, colorScheme, savedColorScheme: colorScheme });
          }} /><span>Inherit color scheme</span></label>
          {!inheritColorScheme ? <ThemeColorSchemeSwatches blockId={block.id} value={colorScheme} themeColors={themeColors} onChange={(nextScheme) => update({ colorScheme: nextScheme, savedColorScheme: nextScheme })} onEditScheme={onEditScheme} /> : null}
          <GroupSegmentedControl label="Background media" value={backgroundMedia} options={[["none", "None"], ["image", "Image"], ["video", "Video"]]} onChange={(value) => update({ backgroundMedia: value })} />
          {backgroundMedia === 'image' ? <div className="admin-field"><span>Background image</span><ImagePicker value={settings.backgroundImage || ''} onChange={(value, altText) => update({ backgroundImage: value, backgroundImageAlt: altText ?? '' })} /></div> : null}
          {backgroundMedia === 'video' ? <div className="admin-field"><span>Background video</span><VideoPicker value={settings.backgroundVideo || ''} onChange={(value) => update({ backgroundVideo: value })} /></div> : null}
          <GroupSegmentedControl label="Borders" value={settings.borderStyle === 'solid' ? 'solid' : 'none'} options={[["none", "None"], ["solid", "Solid"]]} onChange={(value) => update({ borderStyle: value })} />
          <GroupRangeControl label="Corner radius" value={settings.cornerRadius ?? 0} min={0} max={200} onChange={(value) => update({ cornerRadius: value })} />
          <label className="shopify-shared-editor__toggle shopify-editor-group-control__toggle"><input type="checkbox" checked={overlayEnabled} onChange={(event) => {
            const enabled = event.target.checked;
            if (enabled) {
              const restoredOpacity = settings.overlayOpacitySaved > 0 ? boundedGroupNumber('overlayOpacity', settings.overlayOpacitySaved) : overlayOpacity || 50;
              update({ overlayEnabled: true, overlayOpacity: restoredOpacity, overlayOpacitySaved: restoredOpacity });
            } else {
              const savedOpacity = overlayEnabled ? overlayOpacity : settings.overlayOpacitySaved || overlayOpacity;
              update({ overlayEnabled: false, overlayOpacity: 0, overlayOpacitySaved: savedOpacity });
            }
          }} /><span>Background overlay</span></label>
          {overlayEnabled ? <GroupRangeControl label="Opacity" value={overlayOpacity} min={0} max={100} unit="%" onChange={(value) => update({ overlayOpacity: value, overlayOpacitySaved: value })} /> : null}
        </div>
      </details>
      <details className="shopify-editor-settings__group" open>
        <summary>Block link</summary>
        <div className="shopify-editor-settings__group-body">
          <div className="admin-field shopify-editor-group-control__link-field">
            <span>Link</span>
            <div className="shopify-editor-group-control__link-input-shell">
              <input value={settings.link || ''} placeholder="Paste a URL or path" aria-label="Link" onChange={(event) => update({ link: event.target.value })} />
              <button type="button" aria-label="Browse internal and custom destinations" aria-expanded={linkPickerOpen} aria-controls={linkPickerOpen ? linkPickerId : undefined} title="Browse destinations" onClick={() => setLinkPickerOpen((isOpen) => !isOpen)}>
                <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="5" rx="6" ry="2.5" /><path d="M4 5v5c0 1.4 2.7 2.5 6 2.5M16 5v2" /><path d="M4 10v5c0 1.4 2.7 2.5 6 2.5" /><circle cx="15.5" cy="14.5" r="3" /><path d="M15.5 13v3M14 14.5h3" /></svg>
              </button>
            </div>
            {linkPickerOpen ? <div id={linkPickerId} className="shopify-editor-group-control__link-picker"><LinkPicker value={settings.link || ''} onChange={(value) => { update({ link: value }); setLinkPickerOpen(false); }} /></div> : null}
          </div>
          <label className="shopify-shared-editor__toggle shopify-editor-group-control__toggle"><input type="checkbox" checked={Boolean(settings.openInNewTab)} onChange={(event) => update({ openInNewTab: event.target.checked })} /><span>Open link in new tab</span></label>
        </div>
      </details>
      <details className="shopify-editor-settings__group" open>
        <summary>Padding</summary>
        <div className="shopify-editor-settings__group-body">
          <GroupRangeControl label="Top" value={settings.paddingTop ?? 0} min={0} max={200} onChange={(value) => update({ paddingTop: value })} />
          <GroupRangeControl label="Bottom" value={settings.paddingBottom ?? 0} min={0} max={200} onChange={(value) => update({ paddingBottom: value })} />
          <GroupRangeControl label="Left" value={settings.paddingLeft ?? 0} min={0} max={200} onChange={(value) => update({ paddingLeft: value })} />
          <GroupRangeControl label="Right" value={settings.paddingRight ?? 0} min={0} max={200} onChange={(value) => update({ paddingRight: value })} />
        </div>
      </details>
    </>
  );
}

function themeSchemeSwatchStyle(themeColors, number) {
  const scheme = getThemeColorScheme(themeColors || DEFAULT_THEME, number);
  return {
    '--swatch-background': `var(--color-scheme-${number}-base-background, ${scheme.base.background})`,
    '--swatch-foreground': `var(--color-scheme-${number}-base-text, ${scheme.base.text})`,
    '--swatch-accent': `var(--color-scheme-${number}-primary-button-background, ${scheme.primaryButton.background})`,
  };
}

function ThemeColorSchemeSwatches({ blockId, value, onChange, onEditScheme, themeColors = DEFAULT_THEME, label = 'Color scheme', fallback = 'scheme1', includeInherit = false, inheritLabel = 'Inherit', variant = 'default' }) {
  const selectedScheme = value === 'inherit' ? null : resolveColorSchemeSelection(value, fallback).number;
  const usesPreviewCards = variant === 'preview-cards';
  return (
    <fieldset className={`shopify-editor-color-scheme${usesPreviewCards ? ' shopify-editor-color-scheme--preview-cards' : ''}`}>
      <legend>{label}</legend>
      {onEditScheme && !usesPreviewCards && (selectedScheme || inheritLabel !== 'Original palette') ? <button type="button" className="shopify-editor-color-scheme__edit" onClick={() => onEditScheme(selectedScheme || resolveColorSchemeSelection(fallback, 'scheme1').number)}>Edit scheme</button> : null}
      <div className="shopify-editor-color-scheme__options">
        {includeInherit ? <label className="shopify-editor-color-scheme__option" title="Inherit from the parent section">
          <input type="radio" name={`color-scheme-${blockId || 'section'}`} value="inherit" checked={value === 'inherit'} onChange={() => onChange('inherit')} />
          <span className="shopify-editor-color-scheme__swatch shopify-editor-color-scheme__swatch--inherit" aria-hidden="true">↗</span>
          <span className="shopify-editor-color-scheme__label">{inheritLabel}</span>
        </label> : null}
        {COLOR_SCHEME_NUMBERS.map((number) => (
          <label className="shopify-editor-color-scheme__option" key={number} title={`Scheme ${number}`}>
            <input
              type="radio"
              name={`color-scheme-${blockId || 'section'}`}
              value={`scheme${number}`}
              checked={selectedScheme === number}
              onChange={() => onChange(`scheme${number}`)}
            />
            <span className="shopify-editor-color-scheme__swatch" style={themeSchemeSwatchStyle(themeColors, number)} aria-hidden="true">
              {usesPreviewCards ? <><span className="shopify-editor-color-scheme__sample">Aa</span><span className="shopify-editor-color-scheme__accent" /></> : null}
            </span>
            <span className={`shopify-editor-color-scheme__label${usesPreviewCards ? ' shopify-editor-color-scheme__label--visually-hidden' : ''}`}>Scheme {number}</span>
          </label>
        ))}
      </div>
      {onEditScheme && usesPreviewCards ? <button type="button" className="shopify-editor-color-scheme__edit" onClick={() => onEditScheme(selectedScheme || resolveColorSchemeSelection(fallback, 'scheme1').number)}>Edit scheme</button> : null}
      {value === 'inherit' && inheritLabel === 'Original palette' ? <p className="admin-field-help">Uses the byShreen brand colors in Theme settings.</p> : null}
    </fieldset>
  );
}

function BlogPostsSectionSettings({ block, onChange, onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Layout</span>
          <select value={['grid', 'carousel', 'editorial'].includes(settings.layout) ? settings.layout : 'grid'} onChange={(event) => update({ layout: event.target.value })}>
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
            <option value="editorial">Editorial</option>
          </select>
        </label>
        <GroupRangeControl label="Posts to show" value={settings.postCount ?? 3} min={1} max={12} onChange={(postCount) => update({ postCount })} />
        <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme || 'scheme1'} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} />
        <GroupRangeControl label="Top" value={settings.paddingTop ?? 0} min={0} max={240} onChange={(paddingTop) => update({ paddingTop })} />
        <GroupRangeControl label="Bottom" value={settings.paddingBottom ?? 48} min={0} max={240} onChange={(paddingBottom) => update({ paddingBottom })} />
      </div>
    </details>
  </>;
}

function NotFoundSectionSettings({ block, onChange, onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const numberControl = (name, label, fallback, min, max) => (
    <label className="admin-field" key={name}>
      <span>{label}</span>
      <span className="shopify-editor-group-control__number-input">
        <input type="number" min={min} max={max} step="1" value={settings[name] ?? fallback} onChange={(event) => {
          const value = Number(event.target.value);
          update({ [name]: Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback)) });
        }} />
        {name === 'gap' ? <span>px</span> : null}
      </span>
    </label>
  );

  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Width</span>
          <select value={settings.width || 'standard'} onChange={(event) => update({ width: event.target.value })}>
            <option value="narrow">Narrow</option><option value="standard">Page width</option><option value="wide">Wide</option><option value="full">Full width</option>
          </select>
        </label>
        <label className="admin-field"><span>Height</span>
          <select value={settings.height || 'small'} onChange={(event) => update({ height: event.target.value })}>
            <option value="auto">Auto</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="full-screen">Full screen</option>
          </select>
        </label>
        <label className="admin-field"><span>Alignment</span>
          <select value={settings.alignment || 'center'} onChange={(event) => update({ alignment: event.target.value })}>
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </label>
        <label className="admin-field"><span>Position</span>
          <select value={settings.position || 'center'} onChange={(event) => update({ position: event.target.value })}>
            <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
          </select>
        </label>
        {numberControl('gap', 'Gap', 16, 0, 160)}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} />
        {numberControl('paddingTop', 'Top padding', 80, 0, 240)}
        {numberControl('paddingBottom', 'Bottom padding', 80, 0, 240)}
      </div>
    </details>
  </>;
}

function PasswordSectionSettings({ block, onChange, onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const direction = settings.direction === 'horizontal' ? 'horizontal' : 'vertical';
  const backgroundMedia = ['image', 'video'].includes(settings.backgroundMedia) ? settings.backgroundMedia : 'none';
  const numberControl = (name, label, fallback, maximum = 200) => (
    <label className="admin-field" key={name}>
      <span>{label}</span>
      <span className="shopify-editor-group-control__number-input">
        <input type="number" min="0" max={maximum} step="1" value={settings[name] ?? fallback} onChange={(event) => {
          const value = Number(event.target.value);
          update({ [name]: Math.min(maximum, Math.max(0, Number.isFinite(value) ? value : fallback)) });
        }} />
        <span>px</span>
      </span>
    </label>
  );

  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Direction" value={direction} options={[["vertical", "Vertical"], ["horizontal", "Horizontal"]]} onChange={(value) => update({ direction: value })} />
        <GroupSegmentedControl label="Alignment" value={['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'center'} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(value) => update({ alignment: value })} />
        <label className="admin-field"><span>Position</span>
          <select value={['top', 'center', 'bottom', 'space-between'].includes(settings.position) ? settings.position : 'center'} onChange={(event) => update({ position: event.target.value })}>
            <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option><option value="space-between">Space between</option>
          </select>
        </label>
        <GroupRangeControl label="Gap" value={settings.gap ?? 12} min={0} max={160} onChange={(gap) => update({ gap })} />
        <label className="admin-field"><span>Width</span>
          <select value={settings.width === 'full' ? 'full' : 'page'} onChange={(event) => update({ width: event.target.value })}>
            <option value="page">Page width</option><option value="full">Full width</option>
          </select>
        </label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} label="Theme settings" value={settings.colorScheme || 'scheme1'} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} />
        <GroupSegmentedControl label="Background media" value={backgroundMedia} options={[["none", "None"], ["image", "Image"], ["video", "Video"]]} onChange={(value) => update({ backgroundMedia: value })} />
        {backgroundMedia === 'image' ? <div className="admin-field"><span>Background image</span><ImagePicker value={settings.backgroundImage || ''} onChange={(value, altText) => update({ backgroundImage: value, backgroundImageAlt: altText ?? '' })} /></div> : null}
        {backgroundMedia === 'video' ? <div className="admin-field"><span>Background video</span><VideoPicker value={settings.backgroundVideo || ''} onChange={(value) => update({ backgroundVideo: value })} /></div> : null}
        <GroupSegmentedControl label="Borders" value={settings.borderStyle === 'solid' ? 'solid' : 'none'} options={[["none", "None"], ["solid", "Solid"]]} onChange={(borderStyle) => update({ borderStyle })} />
        {numberControl('cornerRadius', 'Corner radius', 0)}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Padding</summary>
      <div className="shopify-editor-settings__group-body">
        {numberControl('paddingTop', 'Top', 0)}
        {numberControl('paddingRight', 'Right', 24)}
        {numberControl('paddingBottom', 'Bottom', 0)}
        {numberControl('paddingLeft', 'Left', 24)}
      </div>
    </details>
  </>;
}

function PasswordFooterSettings({ block, onChange, onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  return <>
    <ThemeColorSchemeSwatches blockId={block.id} label="Color scheme" value={settings.colorScheme || 'scheme1'} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} variant="preview-cards" />
  </>;
}

function FeaturedProductSettings({ block, onChange, productOptions = [], onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const numberControl = (name, label, fallback) => <label className="admin-field" key={name}>
    <span>{label}</span>
    <span className="shopify-editor-group-control__number-input">
      <input type="number" min="0" max="240" step="4" value={settings[name] ?? fallback} onChange={(event) => {
        const value = Number(event.target.value);
        update({ [name]: Math.min(240, Math.max(0, Number.isFinite(value) ? value : fallback)) });
      }} />
      <span>px</span>
    </span>
  </label>;
  const options = Array.isArray(productOptions) ? productOptions : [];
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Product</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Product</span>
          <select value={settings.productSlug || ''} onChange={(event) => update({ productSlug: event.target.value })}>
            <option value="">First published product{options[0]?.label ? ` (${options[0].label})` : ''}</option>
            {settings.productSlug && !options.some((option) => option.value === settings.productSlug) ? <option value={settings.productSlug}>Unavailable product ({settings.productSlug})</option> : null}
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {!options.length ? <span className="admin-field-help">No published products are available yet. The section will use the first published product when one is added.</span> : null}
        </label>
        <label className="admin-field"><span>Eyebrow</span><input value={settings.eyebrow || ''} maxLength={120} onChange={(event) => update({ eyebrow: event.target.value })} /></label>
        <label className="admin-field"><span>Heading override</span><input value={settings.heading || ''} maxLength={160} onChange={(event) => update({ heading: event.target.value })} /></label>
        <label className="admin-field"><span>Button label</span><input value={settings.buttonLabel ?? 'View product'} maxLength={80} onChange={(event) => update({ buttonLabel: event.target.value })} /></label>
        <label className="admin-check"><input type="checkbox" checked={settings.showDescription !== false} onChange={(event) => update({ showDescription: event.target.checked })} /><span>Show product description</span></label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Media position</span><select value={settings.layout || 'media-left'} onChange={(event) => update({ layout: event.target.value })}><option value="media-left">Left</option><option value="media-right">Right</option></select></label>
        <label className="admin-field"><span>Image ratio</span><select value={settings.imageRatio || 'portrait'} onChange={(event) => update({ imageRatio: event.target.value })}><option value="portrait">Portrait</option><option value="square">Square</option><option value="landscape">Landscape</option></select></label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme || 'ivory'} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} />
        {numberControl('paddingTop', 'Top padding', 64)}
        {numberControl('paddingBottom', 'Bottom padding', 64)}
      </div>
    </details>
  </>;
}

function ImageCompareSectionSettings({ block, onChange, onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const backgroundMedia = ['none', 'image', 'video'].includes(settings.backgroundMedia) ? settings.backgroundMedia : 'none';
  const height = ['auto', 'small', 'medium', 'large', 'full-screen', 'custom'].includes(settings.height) ? settings.height : 'auto';
  const overlayEnabled = Boolean(settings.overlayEnabled);
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Direction" value={settings.direction === 'horizontal' ? 'horizontal' : 'vertical'} options={[["vertical", "Vertical"], ["horizontal", "Horizontal"]]} onChange={(direction) => update({ direction })} />
        <label className="shopify-shared-editor__toggle"><input type="checkbox" role="switch" aria-checked={Boolean(settings.verticalOnMobile)} checked={Boolean(settings.verticalOnMobile)} onChange={(event) => update({ verticalOnMobile: event.target.checked })} /><span>Vertical on mobile</span></label>
        <GroupSegmentedControl label="Alignment" value={['left', 'center', 'right', 'space-between'].includes(settings.alignment) ? settings.alignment : 'space-between'} options={[["left", "Left"], ["center", "Center"], ["right", "Right"], ["space-between", "Space between"]]} onChange={(alignment) => update({ alignment })} />
        <label className="admin-field"><span>Position</span><select value={['top', 'center', 'bottom'].includes(settings.position) ? settings.position : 'center'} onChange={(event) => update({ position: event.target.value })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label>
        <GroupRangeControl label="Gap" value={settings.gap ?? 24} min={0} max={160} onChange={(gap) => update({ gap })} />
        <GroupSegmentedControl label="Width" value={settings.width === 'full' ? 'full' : 'page'} options={[["page", "Page"], ["full", "Full width"]]} onChange={(width) => update({ width })} />
        <label className="admin-field"><span>Height</span><select value={height} onChange={(event) => update({ height: event.target.value })}><option value="auto">Auto</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="full-screen">Full screen</option><option value="custom">Custom</option></select></label>
        {height === 'custom' ? <GroupRangeControl label="Custom height" value={settings.customHeight ?? 600} min={100} max={1600} onChange={(customHeight) => update({ customHeight })} /> : null}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme || 'scheme1'} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} variant="preview-cards" />
        <GroupSegmentedControl label="Background media" value={backgroundMedia} options={[["none", "None"], ["image", "Image"], ["video", "Video"]]} onChange={(backgroundMediaValue) => update({ backgroundMedia: backgroundMediaValue })} />
        {backgroundMedia === 'image' ? <div className="admin-field"><span>Background image</span><ImagePicker value={settings.backgroundImage || ''} onChange={(backgroundImage, backgroundImageAlt) => update({ backgroundImage, backgroundImageAlt: backgroundImageAlt ?? '' })} /></div> : null}
        {backgroundMedia === 'video' ? <div className="admin-field"><span>Background video</span><VideoPicker value={settings.backgroundVideo || ''} onChange={(backgroundVideo) => update({ backgroundVideo })} /></div> : null}
        <GroupSegmentedControl label="Borders" value={settings.borderStyle === 'solid' ? 'solid' : 'none'} options={[["none", "None"], ["solid", "Solid"]]} onChange={(borderStyle) => update({ borderStyle })} />
        <GroupRangeControl label="Corner radius" value={settings.cornerRadius ?? 0} min={0} max={200} onChange={(cornerRadius) => update({ cornerRadius })} />
        <label className="shopify-shared-editor__toggle"><input type="checkbox" role="switch" aria-checked={overlayEnabled} checked={overlayEnabled} onChange={(event) => update({ overlayEnabled: event.target.checked, overlayOpacity: event.target.checked ? (settings.overlayOpacity || 35) : 0 })} /><span>Background overlay</span></label>
        {overlayEnabled ? <GroupRangeControl label="Overlay opacity" value={settings.overlayOpacity ?? 35} min={0} max={100} unit="%" onChange={(overlayOpacity) => update({ overlayOpacity })} /> : null}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Padding</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupRangeControl label="Top" value={settings.paddingTop ?? 48} min={0} max={240} onChange={(paddingTop) => update({ paddingTop })} />
        <GroupRangeControl label="Bottom" value={settings.paddingBottom ?? 48} min={0} max={240} onChange={(paddingBottom) => update({ paddingBottom })} />
      </div>
    </details>
  </>;
}

function ComparisonSliderSettings({ block, onChange, themeColors = DEFAULT_THEME, onEditScheme }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const sizeControl = (label, modeKey, customKey, fallback = 'fill') => {
    const mode = ['fit', 'fill', 'custom'].includes(settings[modeKey]) ? settings[modeKey] : fallback;
    return <div className="shopify-editor-group-control__size-control" key={modeKey}>
      <GroupSegmentedControl label={label} value={mode} options={[["fit", "Fit"], ["fill", "Fill"], ["custom", "Custom"]]} onChange={(value) => update({ [modeKey]: value })} />
      {mode === 'custom' ? <GroupRangeControl label={`${label} custom width`} value={settings[customKey] ?? (modeKey === 'mobileWidthMode' ? 100 : 65)} min={10} max={100} unit="%" onChange={(value) => update({ [customKey]: value })} /> : null}
    </div>;
  };
  const numberSetting = (name, label, fallback, maximum = 120) => <GroupRangeControl key={name} label={label} value={settings[name] ?? fallback} min={0} max={maximum} onChange={(value) => update({ [name]: value })} />;
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Direction" value={settings.direction === 'vertical' ? 'vertical' : 'horizontal'} options={[["horizontal", "Horizontal"], ["vertical", "Vertical"]]} onChange={(direction) => update({ direction })} />
        <label className="admin-field"><span>Aspect ratio</span><select value={['auto', 'portrait', 'square', 'landscape'].includes(settings.aspectRatio) ? settings.aspectRatio : 'auto'} onChange={(event) => update({ aspectRatio: event.target.value })}><option value="auto">Auto</option><option value="portrait">Portrait</option><option value="square">Square</option><option value="landscape">Landscape</option></select></label>
        {sizeControl('Width', 'widthMode', 'customWidth')}
        {sizeControl('Mobile width', 'mobileWidthMode', 'mobileCustomWidth')}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="shopify-shared-editor__toggle"><input type="checkbox" role="switch" aria-checked={settings.textOnImages !== false} checked={Boolean(settings.textOnImages)} onChange={(event) => update({ textOnImages: event.target.checked })} /><span>Text on images</span></label>
        <label className="shopify-shared-editor__toggle"><input type="checkbox" role="switch" aria-checked={settings.inheritColorScheme !== false} checked={settings.inheritColorScheme !== false} onChange={(event) => update({ inheritColorScheme: event.target.checked })} /><span>Inherit color scheme</span></label>
        {settings.inheritColorScheme === false ? <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme || 'scheme1'} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} variant="preview-cards" /> : null}
        <GroupSegmentedControl label="Border" value={settings.borderStyle === 'solid' ? 'solid' : 'none'} options={[["none", "None"], ["solid", "Solid"]]} onChange={(borderStyle) => update({ borderStyle })} />
        {numberSetting('cornerRadius', 'Corner radius', 0, 100)}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Padding</summary>
      <div className="shopify-editor-settings__group-body">
        {numberSetting('paddingTop', 'Top', 0)}
        {numberSetting('paddingRight', 'Right', 0)}
        {numberSetting('paddingBottom', 'Bottom', 0)}
        {numberSetting('paddingLeft', 'Left', 0)}
      </div>
    </details>
  </>;
}

function FeaturedCollectionSettings({ block, onChange, collectionOptions = [], onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const providedOptions = Array.isArray(collectionOptions) ? collectionOptions : [];
  const options = providedOptions.length ? providedOptions : [{ value: 'all', label: 'Products' }];
  const selectedHandle = settings.collectionHandle || 'all';
  const hasSelectedHandle = options.some((option) => option.value === selectedHandle);
  const numberControl = (name, label, fallback, min, max, unit = '') => (
    <label className="admin-field" key={name}>
      <span>{label}</span>
      {unit ? <span className="shopify-editor-group-control__number-input">
        <input type="number" min={min} max={max} step="1" value={settings[name] ?? fallback} onChange={(event) => {
          const value = Number(event.target.value);
          update({ [name]: Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback)) });
        }} />
        <span>{unit}</span>
      </span> : <input type="number" min={min} max={max} step="1" value={settings[name] ?? fallback} onChange={(event) => {
        const value = Number(event.target.value);
        update({ [name]: Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback)) });
      }} />}
    </label>
  );

  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Collection</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Collection</span>
          <select value={selectedHandle} onChange={(event) => update({ collectionHandle: event.target.value })}>
            {!hasSelectedHandle ? <option value={selectedHandle}>Current collection</option> : null}
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="admin-field"><span>Heading</span>
          <input value={settings.heading || ''} onChange={(event) => update({ heading: event.target.value })} />
        </label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Type</span>
          <select value={settings.layout || 'grid'} onChange={(event) => update({ layout: event.target.value })}>
            <option value="grid">Grid</option><option value="carousel">Carousel</option><option value="editorial">Editorial</option>
          </select>
        </label>
        <label className="admin-field"><span>Width</span>
          <select value={settings.width || 'standard'} onChange={(event) => update({ width: event.target.value })}>
            <option value="standard">Page</option><option value="full">Full</option>
          </select>
        </label>
        <label className="admin-field"><span>Alignment</span>
          <select value={settings.alignment || 'left'} onChange={(event) => update({ alignment: event.target.value })}>
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </label>
        {numberControl('gap', 'Gap', 28, 0, 160, 'px')}
        <label className="admin-check"><input type="checkbox" checked={Boolean(settings.mobileCarousel)} onChange={(event) => update({ mobileCarousel: event.target.checked })} /><span>Enable carousel on mobile</span></label>
        {numberControl('productCount', 'Products to show', 4, 1, 24)}
        {numberControl('columns', 'Columns', 4, 1, 6)}
        {numberControl('mobileColumns', 'Columns on mobile', 2, 1, 2)}
        {numberControl('horizontalGap', 'Horizontal gap', 20, 0, 100)}
        {numberControl('verticalGap', 'Vertical gap', 28, 0, 120)}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} />
        {numberControl('paddingTop', 'Top padding', 48, 0, 240, 'px')}
        {numberControl('paddingBottom', 'Bottom padding', 64, 0, 240, 'px')}
      </div>
    </details>
    <details className="shopify-editor-settings__group">
      <summary>Theme Settings</summary>
      <div className="shopify-editor-settings__group-body">
        <p className="admin-field-help">Shared colors and theme-wide choices are managed in Theme settings.</p>
        {onEditScheme ? <button type="button" className="admin-button admin-button--ghost" onClick={onEditScheme}>Open Theme settings</button> : null}
      </div>
    </details>
  </>;
}

function CollectionListSectionSettings({ block, onChange, collectionOptions = [], onEditScheme, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const updateSettings = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const selectedRefs = Array.isArray(block.collectionRefs) ? block.collectionRefs : [];
  const [collectionToAdd, setCollectionToAdd] = useState('');
  const [showAllCollections, setShowAllCollections] = useState(false);
  const knownCollections = new Map(collectionOptions.map((option) => [option.value, option.label]));
  const addableOptions = collectionOptions.filter((option) => !selectedRefs.includes(option.value));
  const visibleCollectionRefs = selectedRefs.slice(0, showAllCollections ? Math.max(5, selectedRefs.length) : 3);
  const moveCollection = (index, offset) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= selectedRefs.length) return;
    const nextRefs = [...selectedRefs];
    [nextRefs[index], nextRefs[targetIndex]] = [nextRefs[targetIndex], nextRefs[index]];
    onChange({ ...block, collectionRefs: nextRefs });
  };
  const removeCollection = (collectionRef) => onChange({ ...block, collectionRefs: selectedRefs.filter((ref) => ref !== collectionRef) });

  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Collections</summary>
      <div className="shopify-editor-settings__group-body">
        <p className="admin-field-help">Choose published collections and arrange them in the order they should appear.</p>
        {selectedRefs.length ? <>
          <ol className="collection-list-section-editor__items">
          {visibleCollectionRefs.map((collectionRef) => {
            const index = selectedRefs.indexOf(collectionRef);
            return <li key={`${collectionRef}-${index}`}>
            <span>{knownCollections.get(collectionRef) || `${collectionRef} (unavailable)`}</span>
            <div>
              <button type="button" aria-label={`Move ${knownCollections.get(collectionRef) || collectionRef} up`} disabled={index === 0} onClick={() => moveCollection(index, -1)}>↑</button>
              <button type="button" aria-label={`Move ${knownCollections.get(collectionRef) || collectionRef} down`} disabled={index === selectedRefs.length - 1} onClick={() => moveCollection(index, 1)}>↓</button>
              <button type="button" aria-label={`Remove ${knownCollections.get(collectionRef) || collectionRef}`} onClick={() => removeCollection(collectionRef)}>Remove</button>
            </div>
          </li>;
          })}
          </ol>
          {selectedRefs.length > 3 ? <button type="button" className="collection-list-section-editor__show-more" aria-expanded={showAllCollections} onClick={() => setShowAllCollections((isExpanded) => !isExpanded)}>{showAllCollections ? 'Show less' : 'Show more'}</button> : null}
        </> : <p className="admin-field-help">No collections selected. Add one to show the section on the storefront.</p>}
        <div className="collection-list-section-editor__add">
          <label className="admin-field"><span>Add collection</span>
            <select value={collectionToAdd} onChange={(event) => setCollectionToAdd(event.target.value)}>
              <option value="">Select a published collection</option>
              {addableOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button type="button" className="admin-button admin-button--secondary" disabled={!collectionToAdd || selectedRefs.length >= 24} onClick={() => {
            if (!collectionToAdd || selectedRefs.includes(collectionToAdd)) return;
            onChange({ ...block, collectionRefs: [...selectedRefs, collectionToAdd] });
            setCollectionToAdd('');
          }}>Add</button>
        </div>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Cards layout type</span>
          <select value={settings.layout || 'grid'} onChange={(event) => updateSettings({ layout: event.target.value })}>
            <option value="grid">Grid</option><option value="carousel">Carousel</option><option value="bento">Bento</option><option value="editorial">Editorial</option>
          </select>
        </label>
        <label className="admin-field"><span>Width</span>
          <select value={settings.width || 'page'} onChange={(event) => updateSettings({ width: event.target.value })}>
            <option value="page">Page</option><option value="full">Full width</option>
          </select>
        </label>
        <GroupRangeControl label="Card gap" value={settings.cardGap ?? 12} min={0} max={64} onChange={(cardGap) => updateSettings({ cardGap })} />
        <GroupRangeControl label="Section gap" value={settings.sectionGap ?? 12} min={0} max={96} onChange={(sectionGap) => updateSettings({ sectionGap })} />
        <label className="shopify-shared-editor__toggle"><input type="checkbox" role="switch" checked={Boolean(settings.mobileCarousel)} onChange={(event) => updateSettings({ mobileCarousel: event.target.checked })} /><span>Enable carousel on mobile</span></label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme || 'scheme1'} onChange={(colorScheme) => updateSettings({ colorScheme })} onEditScheme={onEditScheme} themeColors={themeColors} />
        <GroupRangeControl label="Top padding" value={settings.paddingTop ?? 48} min={0} max={240} onChange={(paddingTop) => updateSettings({ paddingTop })} />
        <GroupRangeControl label="Bottom padding" value={settings.paddingBottom ?? 64} min={0} max={240} onChange={(paddingBottom) => updateSettings({ paddingBottom })} />
      </div>
    </details>
  </>;
}

function FeaturedCollectionProductCardSettings({ block, onChange, themeColors = DEFAULT_THEME }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const colorSchemeValue = settings.colorScheme || 'inherit';
  const colorScheme = colorSchemeValue === 'inherit' ? 'inherit' : resolveColorSchemeSelection(colorSchemeValue, 'scheme1').value;

  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Product source</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="shopify-shared-editor__toggle shopify-editor-group-control__toggle">
          <input type="checkbox" checked={settings.repeating !== false} onChange={(event) => update({ repeating: event.target.checked })} />
          <span>Repeating</span>
        </label>
        <label className="admin-field"><span>Product</span>
          <input readOnly value="Product from parent collection" />
          <span className="admin-field-help">Product blocks in this card use the current product from the selected collection.</span>
        </label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupRangeControl label="Vertical gap" value={settings.verticalGap ?? 12} min={0} max={120} onChange={(value) => update({ verticalGap: value })} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} value={colorScheme} onChange={(nextScheme) => update({ colorScheme: nextScheme })} themeColors={themeColors} includeInherit />
        <label className="admin-field"><span>Border</span>
          <select value={settings.borderStyle === 'solid' ? 'solid' : 'none'} onChange={(event) => update({ borderStyle: event.target.value })}>
            <option value="none">None</option><option value="solid">Solid</option>
          </select>
        </label>
        <GroupRangeControl label="Corner radius" value={settings.cornerRadius ?? 0} min={0} max={100} onChange={(value) => update({ cornerRadius: value })} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Padding</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupRangeControl label="Top" value={settings.paddingTop ?? 0} min={0} max={120} onChange={(value) => update({ paddingTop: value })} />
        <GroupRangeControl label="Right" value={settings.paddingRight ?? 0} min={0} max={120} onChange={(value) => update({ paddingRight: value })} />
        <GroupRangeControl label="Bottom" value={settings.paddingBottom ?? 0} min={0} max={120} onChange={(value) => update({ paddingBottom: value })} />
        <GroupRangeControl label="Left" value={settings.paddingLeft ?? 0} min={0} max={120} onChange={(value) => update({ paddingLeft: value })} />
      </div>
    </details>
  </>;
}

function FeaturedCollectionPaddingSettings({ settings, update, max = 120 }) {
  return <details className="shopify-editor-settings__group" open>
    <summary>Padding</summary>
    <div className="shopify-editor-settings__group-body">
      <GroupRangeControl label="Top" value={settings.paddingTop ?? 0} min={0} max={max} onChange={(value) => update({ paddingTop: value })} />
      <GroupRangeControl label="Right" value={settings.paddingRight ?? 0} min={0} max={max} onChange={(value) => update({ paddingRight: value })} />
      <GroupRangeControl label="Bottom" value={settings.paddingBottom ?? 0} min={0} max={max} onChange={(value) => update({ paddingBottom: value })} />
      <GroupRangeControl label="Left" value={settings.paddingLeft ?? 0} min={0} max={max} onChange={(value) => update({ paddingLeft: value })} />
    </div>
  </details>;
}

function FeaturedCollectionColorControl({ label = 'Color', value, onChange, kind = 'text' }) {
  const choices = kind === 'background'
    ? [['none', 'None'], ['ivory', 'Ivory'], ['paper', 'Paper'], ['green', 'Green'], ['mulberry', 'Mulberry']]
    : [['inherit', 'Inherit'], ['ink', 'Ink'], ['ivory', 'Ivory'], ['green', 'Green'], ['mulberry', 'Mulberry']];
  const selectedValue = choices.some(([color]) => color === value) ? value : kind === 'background' ? 'none' : 'inherit';
  return <label className="admin-field"><span>{label}</span>
    <select value={selectedValue} onChange={(event) => onChange(event.target.value)}>
      {choices.map(([color, text]) => <option key={color} value={color}>{text}</option>)}
    </select>
  </label>;
}

function FeaturedCollectionTypographyControl({ value, onChange }) {
  return <label className="admin-field"><span>Typography preset</span>
    <select value={['heading', 'subheading', 'body', 'caption'].includes(value) ? value : 'body'} onChange={(event) => onChange(event.target.value)}>
      <option value="heading">Heading</option><option value="subheading">Subheading</option><option value="body">Body</option><option value="caption">Caption</option>
    </select>
  </label>;
}

const BLOG_TYPOGRAPHY_OPTIONS = [
  ['default', 'Default'],
  ['paragraph', 'Paragraph'],
  ['heading1', 'Heading 1'],
  ['heading2', 'Heading 2'],
  ['heading3', 'Heading 3'],
  ['heading4', 'Heading 4'],
  ['heading5', 'Heading 5'],
  ['heading6', 'Heading 6'],
  ['custom', 'Custom'],
];

const HERO_TYPOGRAPHY_OPTIONS = [...BLOG_TYPOGRAPHY_OPTIONS, ['caption', 'Caption']];

function BlogPostChildSettings({ block, onChange }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const isTitle = block.type === 'blogPostTitle';
  const isDetails = block.type === 'blogPostDetails';
  const isDescription = block.type === 'blogPostDescription';
  const isImage = block.type === 'blogPostImage';
  const defaultTypography = isTitle ? 'heading3' : 'default';
  const typographyPreset = BLOG_TYPOGRAPHY_OPTIONS.some(([value]) => value === settings.typographyPreset)
    ? settings.typographyPreset
    : defaultTypography;
  const renderTypography = () => <>
    <label className="admin-field"><span>Typography preset</span>
      <select value={typographyPreset} onChange={(event) => update({ typographyPreset: event.target.value })}>
        {BLOG_TYPOGRAPHY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    {typographyPreset === 'custom' ? <GroupRangeControl label="Custom font size" value={settings.customFontSize ?? 16} min={10} max={72} onChange={(value) => update({ customFontSize: value })} /> : null}
  </>;
  const renderPadding = (includeHorizontal = false) => <details className="shopify-editor-settings__group" open>
    <summary>Padding</summary>
    <div className="shopify-editor-settings__group-body">
      <GroupRangeControl label="Top" value={settings.paddingTop ?? (isDescription ? 16 : 0)} min={0} max={120} onChange={(value) => update({ paddingTop: value })} />
      {includeHorizontal ? <GroupRangeControl label="Right" value={settings.paddingRight ?? 0} min={0} max={120} onChange={(value) => update({ paddingRight: value })} /> : null}
      <GroupRangeControl label="Bottom" value={settings.paddingBottom ?? (isTitle ? 10 : 0)} min={0} max={120} onChange={(value) => update({ paddingBottom: value })} />
      {includeHorizontal ? <GroupRangeControl label="Left" value={settings.paddingLeft ?? 0} min={0} max={120} onChange={(value) => update({ paddingLeft: value })} /> : null}
    </div>
  </details>;

  if (isImage) return <details className="shopify-editor-settings__group" open>
    <summary>Media</summary>
    <div className="shopify-editor-settings__group-body">
      <p className="admin-field-help">Visible when the blog post has an image.</p>
      <label className="admin-field"><span>Height</span>
        <select value={['small', 'medium', 'large'].includes(settings.height) ? settings.height : 'large'} onChange={(event) => update({ height: event.target.value })}>
          <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
        </select>
      </label>
      <label className="admin-field"><span>Border</span>
        <select value={settings.borderStyle === 'solid' ? 'solid' : 'none'} onChange={(event) => update({ borderStyle: event.target.value })}>
          <option value="none">None</option><option value="solid">Solid</option>
        </select>
      </label>
      <GroupRangeControl label="Corner radius" value={settings.cornerRadius ?? 4} min={0} max={100} onChange={(value) => update({ cornerRadius: value })} />
    </div>
  </details>;

  return <>
    {isDetails ? <details className="shopify-editor-settings__group" open>
      <summary>Content</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-check"><input type="checkbox" checked={Boolean(settings.showDate)} onChange={(event) => update({ showDate: event.target.checked })} /><span>Show date</span></label>
        <label className="admin-check"><input type="checkbox" checked={Boolean(settings.showAuthor)} onChange={(event) => update({ showAuthor: event.target.checked })} /><span>Show author</span></label>
      </div>
    </details> : null}
    <details className="shopify-editor-settings__group" open>
      <summary>Typography</summary>
      <div className="shopify-editor-settings__group-body">
        {renderTypography()}
        {isTitle ? <label className="admin-field"><span>Color</span>
          <select value={['text', 'heading', 'link'].includes(settings.color) ? settings.color : 'heading'} onChange={(event) => update({ color: event.target.value })}>
            <option value="text">Text</option><option value="heading">Heading</option><option value="link">Link</option>
          </select>
        </label> : null}
      </div>
    </details>
    {renderPadding(isTitle)}
  </>;
}

function plainRichTextDocument(text) {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) }],
  };
}

const HERO_DYNAMIC_SOURCE_FIELDS = {
  product: [
    { value: 'product.title', label: 'Title', help: 'Current product title', kind: 'text' },
    { value: 'product.description', label: 'Description', help: 'Current product description', kind: 'text' },
    { value: 'product.featured_image', label: 'Featured image', help: 'First image in the current product media', kind: 'image' },
  ],
  collection: [
    { value: 'collection.title', label: 'Title', help: 'Current collection title', kind: 'text' },
    { value: 'collection.description', label: 'Description', help: 'Current collection description', kind: 'text' },
    { value: 'collection.image', label: 'Image', help: 'Current collection image', kind: 'image' },
  ],
};

const FIELD_DYNAMIC_SOURCE_FIELDS = {
  product: [
    ...HERO_DYNAMIC_SOURCE_FIELDS.product,
    { value: 'product.url', label: 'URL', help: 'Current product URL', kind: 'link' },
  ],
  collection: [
    ...HERO_DYNAMIC_SOURCE_FIELDS.collection,
    { value: 'collection.url', label: 'URL', help: 'Current collection URL', kind: 'link' },
  ],
};

function HeroDynamicSourcePicker({ resourceType, value = '', onChange, label, kind = 'text', sourceScope = 'hero' }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const sourceCatalog = sourceScope === 'field' ? FIELD_DYNAMIC_SOURCE_FIELDS : HERO_DYNAMIC_SOURCE_FIELDS;
  const sourceFields = (sourceCatalog[resourceType] || []).filter((source) => source.kind === kind);
  const selectedSource = sourceFields.find((source) => source.value === value);
  const hasConnection = Boolean(value);
  const resourceLabel = resourceType === 'product' ? 'Product' : 'Collection';
  const closeMenu = () => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector('button')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const dismissOutsidePointer = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('pointerdown', dismissOutsidePointer);
    return () => document.removeEventListener('pointerdown', dismissOutsidePointer);
  }, [isOpen]);
  if (!sourceFields.length) return null;

  const triggerLabel = selectedSource
    ? `Change ${label || 'dynamic source'} connection, currently ${resourceLabel} ${selectedSource.label}`
    : hasConnection
      ? `Change ${label || 'dynamic source'} connection`
      : `Connect ${label || 'dynamic source'}`;
  const sourceButton = <button
    ref={triggerRef}
    type="button"
    className={`blog-title-richtext__source-button${hasConnection ? ' is-connected' : ''}`}
    aria-label={sourceScope === 'field' ? triggerLabel : selectedSource ? `Change dynamic source, connected to ${resourceLabel} ${selectedSource.label}` : hasConnection ? 'Change dynamic source, currently connected' : 'Connect dynamic source'}
    aria-expanded={isOpen}
    aria-haspopup="dialog"
    title={sourceScope === 'field' ? (selectedSource ? `${label}: connected to ${resourceLabel} · ${selectedSource.label}` : hasConnection ? `${label}: connected dynamic source` : `Connect ${label} to a dynamic source`) : selectedSource ? `Connected to ${resourceLabel} · ${selectedSource.label}` : hasConnection ? 'Connected dynamic source' : 'Connect dynamic source'}
    onClick={() => setIsOpen((open) => !open)}
    onKeyDown={(event) => { if (event.key === 'Escape' && isOpen) { event.preventDefault(); closeMenu(); } }}
  >
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true"><path d="M5 3.5h10v5H5zM5 11.5h10v5H5zM8 8.5v3M12 8.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8" cy="6" r=".6" fill="currentColor" /><circle cx="12" cy="14" r=".6" fill="currentColor" /></svg>
  </button>;
  const sourceMenu = isOpen ? <div ref={dialogRef} className="blog-title-richtext__source-menu" role="dialog" aria-label={`Select ${label || 'dynamic source'}`} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(); } }}>
    <strong>Dynamic source</strong>
    <span className="blog-title-richtext__source-group">{resourceLabel}</span>
    {sourceFields.map((source) => <button key={source.value} type="button" aria-pressed={value === source.value} onClick={() => { onChange(source.value); closeMenu(); }}>
      <span>{source.label}</span><small>{source.help}</small>{value === source.value ? <span aria-hidden="true">✓</span> : null}
    </button>)}
    {hasConnection ? <button type="button" className="blog-title-richtext__disconnect" onClick={() => { onChange(''); closeMenu(); }}>Remove connection</button> : null}
  </div> : null;
  const connectedHelp = hasConnection && sourceScope === 'hero' ? <span className="admin-field-help">{selectedSource ? `Connected to ${resourceLabel} · ${selectedSource.label}.` : 'A dynamic source is connected.'} Remove the connection to use the saved custom value.</span> : null;

  if (sourceScope === 'field') return <span className="field-dynamic-source" ref={rootRef}>{sourceButton}{sourceMenu}</span>;
  return <div className="blog-title-richtext" ref={rootRef}>
    <div className="blog-title-richtext__label-row">
      {sourceScope === 'hero' ? <span className="blog-title-richtext__label">{label || 'Dynamic source'}</span> : null}
      {sourceButton}{sourceMenu}
    </div>
    {connectedHelp}
  </div>;
}

function heroDynamicSource(block, field) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const sources = settings.dynamicSources && typeof settings.dynamicSources === 'object' && !Array.isArray(settings.dynamicSources) ? settings.dynamicSources : {};
  return typeof sources[field] === 'string' ? sources[field] : '';
}

function withHeroDynamicSource(block, field, source) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const sources = settings.dynamicSources && typeof settings.dynamicSources === 'object' && !Array.isArray(settings.dynamicSources) ? settings.dynamicSources : {};
  const dynamicSources = { ...sources };
  if (source) dynamicSources[field] = source;
  else delete dynamicSources[field];
  return { ...block, settings: { ...settings, dynamicSources } };
}

function supportsFieldDynamicSources(block, resourceType) {
  if (!['product', 'collection'].includes(resourceType)) return false;
  if (['heroEyebrow', 'heroHeading', 'heroText', 'heroButton'].includes(block.type) || block.type === 'heroVideo' || block.type === 'heroImage') return false;
  if (block.static || block.type.startsWith('collectionList') || block.type.startsWith('featuredCollection') || block.type.startsWith('productInformation')) return false;
  return true;
}

function BlogTitleSettings({ block, onChange, resourceTitle = '' }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const isConnectedToBlogTitle = block.dynamicSource === 'blog.title';
  const textDocument = useMemo(() => {
    if (isConnectedToBlogTitle) return plainRichTextDocument(resourceTitle || 'Blog title');
    if (typeof settings.titleRichText === 'string') {
      try {
        return sanitizeRichDoc(JSON.parse(settings.titleRichText));
      } catch {
        // Fall back to the legacy plain-text title when a saved rich-text value is malformed.
      }
    }
    return plainRichTextDocument(block.heading || '');
  }, [block.heading, isConnectedToBlogTitle, resourceTitle, settings.titleRichText]);
  const typographyPreset = BLOG_TYPOGRAPHY_OPTIONS.some(([value]) => value === settings.typographyPreset) ? settings.typographyPreset : 'heading1';
  const backgroundColor = /^#[\da-f]{6}$/i.test(settings.backgroundColor || '') ? settings.backgroundColor : '#fff6df';
  const updateRichText = (nextDocument) => {
    const sanitizedDocument = sanitizeRichDoc(nextDocument);
    onChange({
      ...block,
      heading: docToText(sanitizedDocument).slice(0, 240),
      settings: { ...settings, titleRichText: JSON.stringify(sanitizedDocument) },
    });
  };

  return <>
    <div className="blog-title-richtext">
      <div className="blog-title-richtext__label-row">
        <span className="blog-title-richtext__label">Text</span>
        <button
          type="button"
          className={`blog-title-richtext__source-button${isConnectedToBlogTitle ? ' is-connected' : ''}`}
          aria-label={isConnectedToBlogTitle ? 'Change dynamic source, connected to Blog title' : 'Connect dynamic source'}
          aria-expanded={sourcePickerOpen}
          aria-haspopup="dialog"
          title={isConnectedToBlogTitle ? 'Connected to Blog · Title' : 'Connect dynamic source'}
          onClick={() => setSourcePickerOpen((open) => !open)}
          onKeyDown={(event) => { if (event.key === 'Escape') setSourcePickerOpen(false); }}
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true"><path d="M5 3.5h10v5H5zM5 11.5h10v5H5zM8 8.5v3M12 8.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8" cy="6" r=".6" fill="currentColor" /><circle cx="12" cy="14" r=".6" fill="currentColor" /></svg>
        </button>
        {sourcePickerOpen ? <div className="blog-title-richtext__source-menu" role="dialog" aria-label="Select dynamic source">
          <strong>Dynamic source</strong>
          <span className="blog-title-richtext__source-group">Blog</span>
          <button type="button" aria-pressed={isConnectedToBlogTitle} onClick={() => {
            onChange({ ...block, dynamicSource: 'blog.title' });
            setSourcePickerOpen(false);
          }}>
            <span>Title</span><small>{resourceTitle || 'Current blog title'}</small>{isConnectedToBlogTitle ? <span aria-hidden="true">✓</span> : null}
          </button>
          {isConnectedToBlogTitle ? <button type="button" className="blog-title-richtext__disconnect" onClick={() => {
            onChange({ ...block, dynamicSource: '' });
            setSourcePickerOpen(false);
          }}>Remove connection</button> : null}
        </div> : null}
      </div>
      <RichTextEditor value={textDocument} onChange={updateRichText} label="Blog title text" compact inlineOnly editable={!isConnectedToBlogTitle} maxCharacters={240} />
      {isConnectedToBlogTitle ? <span className="admin-field-help">Connected to Blog · Title. Remove the connection to edit custom text.</span> : null}
    </div>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Width" value={settings.width === 'fill' ? 'fill' : 'fit'} options={[["fit", "Fit"], ["fill", "Fill"]]} onChange={(width) => update({ width })} />
        <label className="admin-field"><span>Max width</span>
          <select value={['narrow', 'normal', 'none'].includes(settings.maxWidth) ? settings.maxWidth : 'normal'} onChange={(event) => update({ maxWidth: event.target.value })}>
            <option value="narrow">Narrow</option><option value="normal">Normal</option><option value="none">None</option>
          </select>
        </label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Typography</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Typography preset</span>
          <select value={typographyPreset} onChange={(event) => update({ typographyPreset: event.target.value })}>
            {BLOG_TYPOGRAPHY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {typographyPreset === 'custom' ? <GroupRangeControl label="Custom font size" value={settings.customFontSize ?? 16} min={10} max={96} onChange={(value) => update({ customFontSize: value })} /> : null}
        <label className="admin-field"><span>Color</span>
          <select value={['text', 'heading', 'link'].includes(settings.color) ? settings.color : 'heading'} onChange={(event) => update({ color: event.target.value })}>
            <option value="text">Text</option><option value="heading">Heading</option><option value="link">Link</option>
          </select>
        </label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-check"><input type="checkbox" checked={Boolean(settings.backgroundEnabled)} onChange={(event) => update({ backgroundEnabled: event.target.checked })} /><span>Background</span></label>
        {settings.backgroundEnabled ? <label className="admin-field"><span>Background color</span><input type="color" value={backgroundColor} onChange={(event) => update({ backgroundColor: event.target.value })} /></label> : null}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Padding</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupRangeControl label="Top" value={settings.paddingTop ?? 48} min={0} max={240} onChange={(value) => update({ paddingTop: value })} />
        <GroupRangeControl label="Right" value={settings.paddingRight ?? 0} min={0} max={240} onChange={(value) => update({ paddingRight: value })} />
        <GroupRangeControl label="Bottom" value={settings.paddingBottom ?? 48} min={0} max={240} onChange={(value) => update({ paddingBottom: value })} />
        <GroupRangeControl label="Left" value={settings.paddingLeft ?? 0} min={0} max={240} onChange={(value) => update({ paddingLeft: value })} />
      </div>
    </details>
  </>;
}

function HeroContentTextSettings({ block, onChange, resourceType }) {
  const isEyebrow = block.type === 'heroEyebrow';
  const contentField = isEyebrow ? 'eyebrow' : 'body';
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const defaults = {
    width: isEyebrow ? 'fit' : 'fill',
    maxWidth: 'default',
    typographyPreset: 'default',
    color: 'text',
    backgroundEnabled: false,
    backgroundColor: '#fff6df',
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  };
  const effectiveSettings = { ...defaults, ...settings };
  const dynamicSource = heroDynamicSource(block, contentField);
  const plainTextValue = block[contentField] || '';
  const serializedRichText = settings.contentRichText;
  const typographyPreset = HERO_TYPOGRAPHY_OPTIONS.some(([value]) => value === effectiveSettings.typographyPreset)
    ? effectiveSettings.typographyPreset
    : defaults.typographyPreset;
  const textDocument = useMemo(() => {
    if (dynamicSource) return plainRichTextDocument(`Connected ${dynamicSource.replace('.', ' · ')}`);
    if (typeof serializedRichText === 'string') {
      try {
        return sanitizeRichDoc(JSON.parse(serializedRichText));
      } catch {
        // Keep the existing plain copy when a saved rich-text value is malformed.
      }
    }
    return plainRichTextDocument(plainTextValue);
  }, [plainTextValue, dynamicSource, serializedRichText]);
  const updateSettings = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  const updateRichText = (nextDocument) => {
    const sanitizedDocument = sanitizeRichDoc(nextDocument);
    if (JSON.stringify(sanitizedDocument) === JSON.stringify(textDocument)) return;
    onChange({
      ...block,
      [contentField]: docToText(sanitizedDocument).slice(0, 1000),
      settings: { ...settings, contentRichText: JSON.stringify(sanitizedDocument) },
    });
  };
  const backgroundColor = /^#[\da-f]{6}$/i.test(effectiveSettings.backgroundColor) ? effectiveSettings.backgroundColor : '#fff6df';

  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Content</summary>
      <div className="shopify-editor-settings__group-body">
        <div className="shopify-editor-richtext-block">
          <span className="shopify-editor-richtext-block__label">Text</span>
          <RichTextEditor value={textDocument} onChange={updateRichText} label="Hero text content" compact inlineOnly={isEyebrow} maxCharacters={1000} editable={!dynamicSource} />
          {dynamicSource ? <span className="admin-field-help">Your saved custom text returns when you remove the connection.</span> : null}
        </div>
        <HeroDynamicSourcePicker resourceType={resourceType} value={dynamicSource} label={isEyebrow ? 'Eyebrow' : 'Text'} onChange={(nextSource) => onChange(withHeroDynamicSource(block, contentField, nextSource))} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Width" value={effectiveSettings.width === 'fill' ? 'fill' : 'fit'} options={[["fit", "Fit"], ["fill", "Fill"]]} onChange={(width) => updateSettings({ width })} />
        <GroupSegmentedControl label="Max width" value={['default', 'narrow', 'normal', 'none'].includes(effectiveSettings.maxWidth) ? effectiveSettings.maxWidth : defaults.maxWidth} options={[["default", "Original"], ["narrow", "Narrow"], ["normal", "Normal"], ["none", "None"]]} onChange={(maxWidth) => updateSettings({ maxWidth })} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Typography</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Typography preset</span>
          <select value={typographyPreset} onChange={(event) => updateSettings({ typographyPreset: event.target.value })}>
            {HERO_TYPOGRAPHY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {typographyPreset === 'custom' ? <GroupRangeControl label="Custom font size" value={effectiveSettings.customFontSize ?? (isEyebrow ? 12 : 18)} min={10} max={96} onChange={(value) => updateSettings({ customFontSize: value })} /> : null}
        <GroupSegmentedControl label="Color" value={['text', 'heading', 'link'].includes(effectiveSettings.color) ? effectiveSettings.color : 'text'} options={[["text", "Text"], ["heading", "Heading"], ["link", "Link"]]} onChange={(color) => updateSettings({ color })} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="shopify-shared-editor__toggle shopify-editor-group-control__toggle"><input type="checkbox" role="switch" aria-checked={Boolean(effectiveSettings.backgroundEnabled)} checked={Boolean(effectiveSettings.backgroundEnabled)} onChange={(event) => updateSettings({ backgroundEnabled: event.target.checked })} /><span>Background</span></label>
        {effectiveSettings.backgroundEnabled ? <label className="admin-field"><span>Background color</span><input type="color" value={backgroundColor} onChange={(event) => updateSettings({ backgroundColor: event.target.value })} /></label> : null}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Padding</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupRangeControl label="Top" value={effectiveSettings.paddingTop} min={0} max={240} onChange={(value) => updateSettings({ paddingTop: value })} />
        <GroupRangeControl label="Right" value={effectiveSettings.paddingRight} min={0} max={240} onChange={(value) => updateSettings({ paddingRight: value })} />
        <GroupRangeControl label="Bottom" value={effectiveSettings.paddingBottom} min={0} max={240} onChange={(value) => updateSettings({ paddingBottom: value })} />
        <GroupRangeControl label="Left" value={effectiveSettings.paddingLeft} min={0} max={240} onChange={(value) => updateSettings({ paddingLeft: value })} />
      </div>
    </details>
  </>;
}

function FeaturedCollectionProductTitleSettings({ block, onChange }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Width" value={settings.width === 'fit' ? 'fit' : 'fill'} options={[["fit", "Fit"], ["fill", "Fill"]]} onChange={(value) => update({ width: value })} />
        <GroupRangeControl label="Max width" value={settings.maxWidth ?? 0} min={0} max={1200} onChange={(value) => update({ maxWidth: value })} />
        <p className="admin-field-help">Set max width to 0 for no limit.</p>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Typography</summary>
      <div className="shopify-editor-settings__group-body">
        <FeaturedCollectionTypographyControl value={settings.typographyPreset} onChange={(value) => update({ typographyPreset: value })} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <FeaturedCollectionColorControl label="Color" value={settings.color} onChange={(value, field = 'color') => update({ [field]: value })} />
        <FeaturedCollectionColorControl kind="background" label="Background" value={settings.background} onChange={(value) => update({ background: value })} />
      </div>
    </details>
    <FeaturedCollectionPaddingSettings settings={settings} update={update} />
  </>;
}

function FeaturedCollectionPriceSettings({ block, onChange }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Price display</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-check"><input type="checkbox" checked={settings.showSaleFirst !== false} onChange={(event) => update({ showSaleFirst: event.target.checked })} /><span>Show sale price first</span></label>
        <label className="admin-check"><input type="checkbox" checked={Boolean(settings.showInstallmentPrice)} onChange={(event) => update({ showInstallmentPrice: event.target.checked })} /><span>Show installment price</span></label>
        <label className="admin-check"><input type="checkbox" checked={Boolean(settings.showTaxInformation)} onChange={(event) => update({ showTaxInformation: event.target.checked })} /><span>Show tax information</span></label>
        <p className="admin-field-help">Sale, installment, and tax details appear only when the product data provides them.</p>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <FeaturedCollectionTypographyControl value={settings.typographyPreset} onChange={(value) => update({ typographyPreset: value })} />
        <GroupSegmentedControl label="Width" value={settings.width === 'fill' ? 'fill' : 'fit'} options={[["fit", "Fit"], ["fill", "Fill"]]} onChange={(value) => update({ width: value })} />
        <GroupSegmentedControl label="Alignment" value={['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left'} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(value) => update({ alignment: value })} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <FeaturedCollectionColorControl value={settings.color} onChange={(value) => update({ color: value })} />
      </div>
    </details>
    <FeaturedCollectionPaddingSettings settings={settings} update={update} />
  </>;
}

function FeaturedCollectionSwatchesSettings({ block, onChange }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Desktop alignment" value={['left', 'center', 'right'].includes(settings.desktopAlignment) ? settings.desktopAlignment : 'left'} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(value) => update({ desktopAlignment: value })} />
        <GroupSegmentedControl label="Mobile alignment" value={['left', 'center', 'right'].includes(settings.mobileAlignment) ? settings.mobileAlignment : 'left'} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(value) => update({ mobileAlignment: value })} />
      </div>
    </details>
    <FeaturedCollectionPaddingSettings settings={settings} update={update} />
  </>;
}

function FeaturedCollectionSkuSettings({ block, onChange }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Content</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-check"><input type="checkbox" checked={settings.showLabel !== false} onChange={(event) => update({ showLabel: event.target.checked })} /><span>Show SKU label</span></label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <FeaturedCollectionTypographyControl value={settings.typographyPreset} onChange={(value) => update({ typographyPreset: value })} />
        <GroupSegmentedControl label="Width" value={settings.width === 'fill' ? 'fill' : 'fit'} options={[["fit", "Fit"], ["fill", "Fill"]]} onChange={(value) => update({ width: value })} />
        <GroupSegmentedControl label="Alignment" value={['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left'} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(value) => update({ alignment: value })} />
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <FeaturedCollectionColorControl label="Color" value={settings.color} onChange={(value, field = 'color') => update({ [field]: value })} />
        <FeaturedCollectionColorControl kind="background" label="Background" value={settings.background} onChange={(value) => update({ background: value })} />
      </div>
    </details>
    <FeaturedCollectionPaddingSettings settings={settings} update={update} />
  </>;
}

function FeaturedCollectionMediaSettings({ block, onChange }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const update = (nextSettings) => onChange({ ...block, settings: { ...settings, ...nextSettings } });
  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Media</summary>
      <div className="shopify-editor-settings__group-body">
        <label className="admin-field"><span>Image ratio</span>
          <select value={settings.aspectRatio || 'auto'} onChange={(event) => update({ aspectRatio: event.target.value })}>
            <option value="auto">Auto</option><option value="portrait">Portrait</option><option value="square">Square</option><option value="landscape">Landscape</option>
          </select>
        </label>
        <GroupSegmentedControl label="Borders" value={settings.borderStyle === 'solid' ? 'solid' : 'none'} options={[["none", "None"], ["solid", "Solid"]]} onChange={(value) => update({ borderStyle: value })} />
        <GroupRangeControl label="Corner radius" value={settings.cornerRadius ?? 0} min={0} max={100} onChange={(value) => update({ cornerRadius: value })} />
        <label className="admin-check"><input type="checkbox" checked={settings.showSecondaryImage !== false} onChange={(event) => update({ showSecondaryImage: event.target.checked })} /><span>Show second image on hover</span></label>
        <label className="admin-check"><input type="checkbox" checked={settings.showViewLink !== false} onChange={(event) => update({ showViewLink: event.target.checked })} /><span>Show “View piece” link</span></label>
        <p className="admin-field-help">Images come from each product in the selected collection.</p>
      </div>
    </details>
    <FeaturedCollectionPaddingSettings settings={settings} update={update} />
  </>;
}

function HeroMediaSettings({ block, onChange, resourceType }) {
  const media = getHeroMediaConfiguration(block);
  const update = (patch) => onChange(updateHeroMediaConfiguration(block, patch));
  const updateMedia2 = (patch) => update({ media2: { ...media.media2, ...patch } });
  const dynamicImageSource = (field, label) => <HeroDynamicSourcePicker
    resourceType={resourceType}
    value={heroDynamicSource(block, field)}
    label={label}
    kind="image"
    onChange={(source) => onChange(withHeroDynamicSource(block, field, source))}
  />;
  const imageGuide = mediaGuide('heroImage', 'image');
  const phoneImageGuide = mediaGuide('heroImage', 'mobileImage');
  const videoGuide = mediaGuide('heroVideo', 'video');
  const posterGuide = mediaGuide('heroVideo', 'image');
  const phoneVideoGuide = mediaGuide('heroVideo', 'mobileVideo');
  const phonePosterGuide = mediaGuide('heroVideo', 'mobileImage');

  return (
    <div className="hero-media-settings">
      <div className="hero-media-settings__slot">
        <strong>Media 1</strong>
        <GroupSegmentedControl label="Type" value={media.type} options={[["image", "Image"], ["video", "Video"]]} onChange={(value) => update({ type: value })} />
        {media.type === 'image' ? (
          <>
            {dynamicImageSource('media1Image', 'Desktop image')}
            <FieldControl name="image" label="Desktop image" value={media.image} guide={imageGuide} compactMedia validationPath="settings.media1Image" onChange={(value, altText) => update({ image: value, ...(altText !== undefined ? { imageAlt: altText } : {}) })} />
          </>
        ) : (
          <FieldControl name="video" label="Desktop video" value={media.video} guide={videoGuide} compactMedia validationPath="settings.media1Video" onChange={(value) => update({ video: value })} />
        )}
      </div>

      <div className="hero-media-settings__slot">
        <strong>Media 2</strong>
        <GroupSegmentedControl label="Type" value={media.media2.type} options={[["image", "Image"], ["video", "Video"]]} onChange={(value) => updateMedia2({ type: value })} />
        {media.media2.type === 'image' ? (
          <>
            {dynamicImageSource('media2Image', 'Media 2 image')}
            <FieldControl name="image" label="Media 2 image" value={media.media2.image} guide={imageGuide} compactMedia validationPath="settings.media2Image" onChange={(value, altText) => updateMedia2({ image: value, ...(altText !== undefined ? { imageAlt: altText } : {}) })} />
          </>
        ) : (
          <FieldControl name="video" label="Media 2 video" value={media.media2.video} guide={videoGuide} compactMedia validationPath="settings.media2Video" onChange={(value) => updateMedia2({ video: value })} />
        )}
      </div>

      <div className="hero-media-settings__mobile">
        <strong>Mobile media</strong>
        <label className="shopify-shared-editor__toggle hero-media-settings__toggle">
          <input type="checkbox" role="switch" aria-checked={media.stackMediaOnMobile} checked={media.stackMediaOnMobile} onChange={(event) => update({ stackMediaOnMobile: event.target.checked })} />
          <span>Stack media</span>
        </label>
        <label className="shopify-shared-editor__toggle hero-media-settings__toggle">
          <input type="checkbox" role="switch" aria-checked={media.showDifferentOnMobile} checked={media.showDifferentOnMobile} onChange={(event) => update({ showDifferentOnMobile: event.target.checked })} />
          <span>Show different media on mobile</span>
        </label>
        {media.showDifferentOnMobile ? <>
          {media.type === 'image' ? (
            <>
              {dynamicImageSource('media1MobileImage', 'Media 1 phone image')}
              <FieldControl name="image" label="Media 1 phone image (optional)" value={media.mobileImage} guide={phoneImageGuide} compactMedia validationPath="settings.media1MobileImage" onChange={(value) => update({ mobileImage: value })} />
            </>
          ) : (
            <FieldControl name="video" label="Media 1 phone video (optional)" value={media.mobileVideo} guide={phoneVideoGuide} compactMedia validationPath="settings.media1MobileVideo" onChange={(value) => update({ mobileVideo: value })} />
          )}
          {media.media2.type === 'image' ? (
            <>
              {dynamicImageSource('media2MobileImage', 'Media 2 phone image')}
              <FieldControl name="image" label="Media 2 phone image (optional)" value={media.media2.mobileImage} guide={phoneImageGuide} compactMedia validationPath="settings.media2MobileImage" onChange={(value) => updateMedia2({ mobileImage: value })} />
            </>
          ) : (
            <FieldControl name="video" label="Media 2 phone video (optional)" value={media.media2.mobileVideo} guide={phoneVideoGuide} compactMedia validationPath="settings.media2MobileVideo" onChange={(value) => updateMedia2({ mobileVideo: value })} />
          )}
        </> : null}
      </div>

      <details className="hero-media-settings__advanced">
        <summary>Advanced media options</summary>
        <div className="hero-media-settings__advanced-body">
          {media.type === 'video' ? (
            <>
              {dynamicImageSource('media1Poster', 'Media 1 poster image')}
              <FieldControl name="image" label="Media 1 poster image" value={media.poster} guide={posterGuide} compactMedia validationPath="settings.media1Poster" onChange={(value) => update({ poster: value })} />
            </>
          ) : <>
            <FieldControl name="imageAlt" label="Media 1 image alt text" value={media.imageAlt} validationPath="settings.media1ImageAlt" onChange={(value) => update({ imageAlt: value })} />
            <FieldControl name="imagePosition" label="Media 1 image focus" value={media.imagePosition} validationPath="settings.media1ImagePosition" onChange={(value) => update({ imagePosition: value })} />
            {media.showDifferentOnMobile ? <FieldControl name="imagePosition" label="Media 1 phone image focus" value={media.mobileImagePosition} validationPath="settings.media1MobileImagePosition" onChange={(value) => update({ mobileImagePosition: value })} /> : null}
          </>}
          {media.media2.type === 'video' ? (
            <>
              {dynamicImageSource('media2Poster', 'Media 2 poster image')}
              <FieldControl name="image" label="Media 2 poster image" value={media.media2.poster} guide={posterGuide} compactMedia validationPath="settings.media2Poster" onChange={(value) => updateMedia2({ poster: value })} />
            </>
          ) : <>
            <FieldControl name="imageAlt" label="Media 2 image alt text" value={media.media2.imageAlt} validationPath="settings.media2ImageAlt" onChange={(value) => updateMedia2({ imageAlt: value })} />
            <FieldControl name="imagePosition" label="Media 2 image focus" value={media.media2.imagePosition} validationPath="settings.media2ImagePosition" onChange={(value) => updateMedia2({ imagePosition: value })} />
            {media.showDifferentOnMobile ? <FieldControl name="imagePosition" label="Media 2 phone image focus" value={media.media2.mobileImagePosition} validationPath="settings.media2MobileImagePosition" onChange={(value) => updateMedia2({ mobileImagePosition: value })} /> : null}
          </>}
          {media.type === 'video' && media.showDifferentOnMobile ? <>
            {dynamicImageSource('media1MobilePoster', 'Media 1 phone poster image')}
            <FieldControl name="image" label="Media 1 phone poster image" value={media.mobilePoster} guide={phonePosterGuide} compactMedia validationPath="settings.media1MobilePoster" onChange={(value) => update({ mobilePoster: value })} />
          </> : null}
          {media.media2.type === 'video' && media.showDifferentOnMobile ? <>
            {dynamicImageSource('media2MobilePoster', 'Media 2 phone poster image')}
            <FieldControl name="image" label="Media 2 phone poster image" value={media.media2.mobilePoster} guide={phonePosterGuide} compactMedia validationPath="settings.media2MobilePoster" onChange={(value) => updateMedia2({ mobilePoster: value })} />
          </> : null}
        </div>
      </details>
    </div>
  );
}

function HeroSectionSettings({ block, onChange, onOpenThemeSettings, themeColors }) {
  const savedSettings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const settings = { ...getHeroSectionDefaults(block.type), ...savedSettings };
  const paddingPreset = savedSettings.paddingPreset || (savedSettings.paddingTop !== undefined || savedSettings.paddingBottom !== undefined ? 'custom' : 'original');
  const mediaType = getHeroMediaConfiguration(block).type;
  const update = (patch) => onChange({ ...block, settings: { ...savedSettings, ...patch } });
  const value = (key, fallback) => settings[key] ?? fallback;
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [overlayColorOpen, setOverlayColorOpen] = useState(false);
  const sectionLinkIsDynamic = block.dynamicSource === 'resource.url';
  const overlayColor = /^#[\da-f]{6}$/i.test(settings.overlayColor || '') ? settings.overlayColor : '#000000';

  return <>
    <details className="shopify-editor-settings__group" open>
      <summary>Section link</summary>
      <div className="shopify-editor-settings__group-body">
        <div className="hero-section-link-setting">
          <div className="hero-section-link-setting__label"><span>Link</span><button type="button" className={`blog-title-richtext__source-button${sectionLinkIsDynamic ? ' is-connected' : ''}`} aria-label={sectionLinkIsDynamic ? 'Change dynamic source, connected to Current page URL' : 'Connect dynamic source'} aria-expanded={sourcePickerOpen} aria-haspopup="dialog" title={sectionLinkIsDynamic ? 'Connected to Current page · URL' : 'Connect dynamic source'} onClick={() => setSourcePickerOpen((open) => !open)} onKeyDown={(event) => { if (event.key === 'Escape') setSourcePickerOpen(false); }}><svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true"><path d="M5 3.5h10v5H5zM5 11.5h10v5H5zM8 8.5v3M12 8.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8" cy="6" r=".6" fill="currentColor" /><circle cx="12" cy="14" r=".6" fill="currentColor" /></svg></button></div>
          {sectionLinkIsDynamic ? <div className="hero-section-link-setting__dynamic-value">Current page URL</div> : <LinkPicker value={settings.sectionLink || ''} onChange={(sectionLink) => update({ sectionLink })} />}
          {sourcePickerOpen ? <div className="blog-title-richtext__source-menu hero-section-link-setting__source-menu" role="dialog" aria-label="Select dynamic source"><strong>Dynamic source</strong><span className="blog-title-richtext__source-group">Page</span><button type="button" aria-pressed={sectionLinkIsDynamic} onClick={() => { onChange({ ...block, dynamicSource: 'resource.url' }); setSourcePickerOpen(false); }}><span>URL</span><small>Current page URL</small>{sectionLinkIsDynamic ? <span aria-hidden="true">✓</span> : null}</button>{sectionLinkIsDynamic ? <button type="button" className="blog-title-richtext__disconnect" onClick={() => { onChange({ ...block, dynamicSource: '' }); setSourcePickerOpen(false); }}>Remove connection</button> : null}</div> : null}
          {sectionLinkIsDynamic ? <span className="admin-field-help">Connected to Page · URL. Remove the connection to choose a custom link.</span> : null}
        </div>
        <label className="admin-check"><input type="checkbox" checked={Boolean(settings.sectionLinkNewTab)} onChange={(event) => update({ sectionLinkNewTab: event.target.checked })} /><span>Open link in new tab</span></label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Layout</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Direction" value={value('direction', 'vertical')} options={[["vertical", "Vertical"], ["horizontal", "Horizontal"]]} onChange={(direction) => update({ direction })} />
        <GroupSegmentedControl label="Alignment" value={value('alignment', 'left')} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(alignment) => update({ alignment })} />
        <label className="admin-field"><span>Position</span><select value={value('position', 'center')} onChange={(event) => update({ position: event.target.value })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option><option value="space-between">Space between</option></select></label>
        <GroupRangeControl label="Gap" value={value('gap', 32)} min={0} max={160} onChange={(gap) => update({ gap })} />
        <GroupSegmentedControl label="Width" value={value('width', 'page')} options={[["page", "Page"], ["full", "Full width"]]} onChange={(width) => update({ width })} />
        <label className="admin-field"><span>Height</span><select value={value('height', 'auto')} onChange={(event) => update({ height: event.target.value })}><option value="auto">Auto</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="full-screen">Full screen</option><option value="custom">Custom</option></select></label>
        {settings.height === 'custom' ? <GroupRangeControl label="Custom height" value={value('customHeight', 600)} min={100} max={1600} onChange={(customHeight) => update({ customHeight })} /> : null}
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Appearance</summary>
      <div className="shopify-editor-settings__group-body">
        <ThemeColorSchemeSwatches blockId={block.id} value={settings.colorScheme} fallback="scheme5" includeInherit inheritLabel="Original palette" themeColors={themeColors} onChange={(colorScheme) => update({ colorScheme })} onEditScheme={onOpenThemeSettings} />
        <label className="shopify-shared-editor__toggle"><input type="checkbox" role="switch" aria-checked={Boolean(settings.overlayEnabled)} checked={Boolean(settings.overlayEnabled)} onChange={(event) => update({ overlayEnabled: event.target.checked })} /><span>Media overlay</span></label>
        {settings.overlayEnabled ? <>
          <GroupRangeControl label="Overlay opacity" value={settings.overlayOpacity ?? 35} min={0} max={100} unit="%" onChange={(overlayOpacity) => update({ overlayOpacity })} /><div className="hero-overlay-color"><span>Overlay color</span><button type="button" className="hero-overlay-color__value" aria-expanded={overlayColorOpen} onClick={() => setOverlayColorOpen((open) => !open)}><span className="hero-overlay-color__swatch" style={{ backgroundColor: overlayColor }} /><code>{overlayColor.toUpperCase()}</code><span aria-hidden="true">⌄</span></button>{overlayColorOpen ? <div className="hero-overlay-color__popover" role="dialog" aria-label="Choose overlay color"><input type="color" value={overlayColor} aria-label="Overlay color picker" onChange={(event) => update({ overlayColor: event.target.value })} /><label><span>Hex</span><input value={overlayColor} maxLength={7} onChange={(event) => { if (/^#[\da-f]{0,6}$/i.test(event.target.value)) update({ overlayColor: event.target.value }); }} /></label><button type="button" onClick={() => setOverlayColorOpen(false)}>Done</button></div> : null}</div>
          <GroupSegmentedControl label="Overlay style" value={value('overlayStyle', 'solid')} options={[["solid", "Solid"], ["gradient", "Gradient"]]} onChange={(overlayStyle) => update({ overlayStyle })} />
          {settings.overlayStyle === 'gradient' ? <GroupSegmentedControl label="Gradient direction" value={value('overlayDirection', 'down')} options={[["up", "Up"], ["down", "Down"]]} onChange={(overlayDirection) => update({ overlayDirection })} /> : null}
        </> : null}
        <label className="shopify-shared-editor__toggle"><input type="checkbox" role="switch" aria-checked={Boolean(settings.blurredReflection)} checked={Boolean(settings.blurredReflection)} onChange={(event) => update({ blurredReflection: event.target.checked })} /><span>Blurred reflection{mediaType === 'video' ? <small className="hero-appearance-help">Applies to images only</small> : null}</span></label>
      </div>
    </details>
    <details className="shopify-editor-settings__group" open>
      <summary>Padding</summary>
      <div className="shopify-editor-settings__group-body">
        <GroupSegmentedControl label="Spacing" value={paddingPreset} options={[["original", "Original"], ["custom", "Custom"]]} onChange={(paddingPreset) => update({ paddingPreset, ...(paddingPreset === 'custom' ? { paddingTop: settings.paddingTop, paddingBottom: settings.paddingBottom } : {}) })} />
        {paddingPreset === 'custom' ? <><GroupRangeControl label="Top" value={value('paddingTop', 0)} min={0} max={240} onChange={(paddingTop) => update({ paddingTop })} />
        <GroupRangeControl label="Bottom" value={value('paddingBottom', 0)} min={0} max={240} onChange={(paddingBottom) => update({ paddingBottom })} /></> : <p className="admin-field-help">Original spacing adapts to the screen size.</p>}
      </div>
    </details>
  </>;
}

export function BlockSettingsPanel({ block, onChange, canEditCode = false, selectedCardId = null, depth = 0, showNestedBlocks = true, nestedBlockTypes = null, collectionOptions = [], productOptions = [], onOpenThemeSettings, themeColors = DEFAULT_THEME, resourceTitle = '', resourceType = '' }) {
  const config = BLOCK_TYPES[block.type];
  if (!config) return null;
  const isHeroMediaBlock = block.type === 'heroVideo' || block.type === 'heroImage';
  const heroMediaFields = ['image', 'imageAlt', 'imagePosition', 'mobileImage', 'mobileImagePosition', 'video', 'mobileVideo'];
  const heroLinkFields = [];
  const isHeroContentChild = ['heroEyebrow', 'heroHeading', 'heroText', 'heroButton'].includes(block.type);
  const isHeroRichTextChild = block.type === 'heroEyebrow' || block.type === 'heroText';
  const hasCanonicalHeroContent = isHeroMediaBlock && Number(block.settings?.heroContentSchemaVersion) >= HERO_CONTENT_BLOCK_SCHEMA_VERSION;
  const legacyHeroContentFields = ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref', 'secondaryLinkLabel', 'secondaryLinkHref'];
  const hasNestedCollectionHeader = block.type === 'collectionListSection' && Array.isArray(block.blocks) && block.blocks.some((child) => child?.type === 'collectionListHeader');
  const mediaFields = config.fields.filter((field) => ['image', 'video'].includes(FIELD_DEFS[field]?.kind) && !(isHeroMediaBlock && heroMediaFields.includes(field)));
  const contentFields = block.type === 'blogTitle' || isHeroRichTextChild || hasNestedCollectionHeader ? [] : config.fields.filter((field) => !mediaFields.includes(field) && field !== 'groupGap' && !(isHeroMediaBlock && heroMediaFields.includes(field)) && !heroLinkFields.includes(field) && !(hasCanonicalHeroContent && legacyHeroContentFields.includes(field)));
  const hasFieldDynamicSources = supportsFieldDynamicSources(block, resourceType);
  const hasDedicatedSectionSettings = isHeroContentChild || block.type === 'featuredProduct' || block.type === 'imageCompare' || block.type === 'comparisonSlider' || block.type === 'blogPosts' || block.type === 'blogTitle' || block.type === 'notFound' || block.type === 'passwordSection' || block.type === 'passwordLogo' || block.type === 'passwordText' || block.type === 'passwordFooter' || block.type.startsWith('collectionList') || block.type.startsWith('featuredCollection') || Boolean(config.unavailableReason) || Boolean(block.static && block.type !== 'collectionListImage');
  const renderFields = (fields) => fields.map((field) => {
    const fieldKind = FIELD_DEFS[field]?.kind || 'text';
    const supportsSourceKind = ['text', 'textarea', 'link', 'image'].includes(fieldKind);
    const source = hasFieldDynamicSources && supportsSourceKind ? heroDynamicSource(block, field) : '';
    const sourcePicker = supportsSourceKind && hasFieldDynamicSources ? <HeroDynamicSourcePicker sourceScope="field" resourceType={resourceType} value={source} label={config.labels?.[field] || FIELD_DEFS[field]?.label || field} kind={fieldKind === 'image' ? 'image' : fieldKind === 'link' ? 'link' : 'text'} onChange={(nextSource) => onChange(withHeroDynamicSource(block, field, nextSource))} /> : null;
    return <FieldControl key={field} name={field} label={config.labels?.[field]} value={getPath(block, field)} guide={mediaGuide(block.type, field)} validationPath={field} sourcePicker={sourcePicker} readOnly={config.ownerOnly && !canEditCode} onChange={(value, altText) => {
        const updatedBlock = setPath(block, field, value);
        const altField = field === 'image1' ? 'image1Alt' : field === 'image2' ? 'image2Alt' : field === 'image' ? 'imageAlt' : null;
        if (altField && config.fields.includes(altField)) updatedBlock[altField] = altText ?? '';
        onChange(updatedBlock);
      }} />;
  });
  return (
    <div className="admin-block__body shopify-editor-settings__body">
      {block.type === 'imageCompare' ? <ImageCompareSectionSettings block={block} onChange={onChange} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : null}
      {block.type === 'comparisonSlider' ? <ComparisonSliderSettings block={block} onChange={onChange} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : null}
      {isHeroMediaBlock ? <>
        <HeroMediaSettings block={block} onChange={onChange} resourceType={resourceType} />
        <HeroSectionSettings block={block} onChange={onChange} onOpenThemeSettings={onOpenThemeSettings} themeColors={themeColors} />
      </> : null}
      {isHeroRichTextChild ? <HeroContentTextSettings block={block} onChange={onChange} resourceType={resourceType} /> : block.type === 'featuredProduct' ? <FeaturedProductSettings block={block} onChange={onChange} productOptions={productOptions} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : block.type === 'blogPosts' ? <BlogPostsSectionSettings block={block} onChange={onChange} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : block.type === 'blogTitle' ? <BlogTitleSettings block={block} onChange={onChange} resourceTitle={resourceTitle} /> : block.type.startsWith('blogPost') && block.type !== 'blogPost' ? <BlogPostChildSettings block={block} onChange={onChange} /> : block.type === 'passwordSection' ? <PasswordSectionSettings block={block} onChange={onChange} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : block.type === 'passwordLogo' ? <p className="admin-field-help">Choose an image from media, or leave it empty to use the store logo.</p> : block.type === 'passwordText' ? <label className="admin-field"><span>Text style</span><select value={block.settings?.style === 'heading' ? 'heading' : 'body'} onChange={(event) => onChange({ ...block, settings: { ...(block.settings || {}), style: event.target.value } })}><option value="heading">Heading</option><option value="body">Body</option></select></label> : block.type === 'passwordFooter' ? <PasswordFooterSettings block={block} onChange={onChange} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : block.static && block.type.startsWith('blogPost') ? <p className="admin-field-help">This block is part of the blog template and repeats for each published post.</p> : block.type === 'collectionListCard' ? <p className="admin-field-help">This card repeats for every selected collection. Its image and title child blocks control the repeated card content.</p> : block.type === 'collectionListImage' ? <p className="admin-field-help">This image block is fixed in the collection card. Leave the image empty to use each collection’s own image.</p> : block.type === 'group' || block.type === 'featuredCollectionGroup' ? <GroupSettingsPanel block={block} onChange={onChange} themeColors={themeColors} onEditScheme={onOpenThemeSettings} /> : block.type === 'notFound' ? <NotFoundSectionSettings block={block} onChange={onChange} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : block.type === 'collectionListSection' ? <CollectionListSectionSettings block={block} onChange={onChange} collectionOptions={collectionOptions} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : block.type === 'featuredCollection' ? <FeaturedCollectionSettings block={block} onChange={onChange} collectionOptions={collectionOptions} onEditScheme={onOpenThemeSettings} themeColors={themeColors} /> : block.type === 'featuredCollectionProductCard' ? <FeaturedCollectionProductCardSettings block={block} onChange={onChange} themeColors={themeColors} /> : block.type === 'featuredCollectionMedia' ? <FeaturedCollectionMediaSettings block={block} onChange={onChange} /> : block.type === 'featuredCollectionProductTitle' ? <FeaturedCollectionProductTitleSettings block={block} onChange={onChange} /> : block.type === 'featuredCollectionPrice' ? <FeaturedCollectionPriceSettings block={block} onChange={onChange} /> : block.type === 'featuredCollectionSwatches' ? <FeaturedCollectionSwatchesSettings block={block} onChange={onChange} /> : block.type === 'featuredCollectionSku' ? <FeaturedCollectionSkuSettings block={block} onChange={onChange} /> : config.unavailableReason ? <p className="admin-field-help">{config.unavailableReason}</p> : config.layouts || config.tones || config.fields.includes('groupGap') ? (
        <details className="shopify-editor-settings__group" open>
          <summary>Layout</summary>
          <div className="shopify-editor-settings__group-body">
            {config.layouts ? (
              <label className="admin-field"><span>{config.labels?.layout || 'Layout'}</span>
                <select value={block.layout || config.layouts[0][0]} onChange={(event) => onChange({ ...block, layout: event.target.value })}>
                  {config.layouts.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                </select>
              </label>
            ) : null}
            {config.tones ? (
              <label className="admin-field"><span>Background color</span>
                <select value={block.tone || ''} onChange={(event) => onChange({ ...block, tone: event.target.value })}>
                  <option value="">Default</option>
                  {config.tones.map((tone) => <option key={tone} value={tone}>{TONES[tone]}</option>)}
                </select>
              </label>
            ) : null}
            {config.fields.includes('groupGap') ? renderFields(['groupGap']) : null}
          </div>
        </details>
      ) : null}
      {contentFields.length || block.type === 'customHtml' || block.type === 'customLiquid' || block.type === 'instagram' ? <details className="shopify-editor-settings__group" open>
        <summary>Content</summary>
        <div className="shopify-editor-settings__group-body">
          {block.type === 'heroButton' ? <label className="admin-field"><span>Button style</span><select value={block.settings?.variant === 'secondary' ? 'secondary' : 'primary'} onChange={(event) => onChange({ ...block, settings: { ...(block.settings || {}), variant: event.target.value } })}><option value="primary">Primary</option><option value="secondary">Secondary</option></select></label> : null}
          {block.type === 'customHtml' ? (
            canEditCode ? (
              <label className="admin-field">
                <span>Start from a template</span>
                <select value="" onChange={(event) => {
                  const template = HTML_TEMPLATES.find((item) => item.id === event.target.value);
                  if (!template) return;
                  if ((block.html || block.css) && !window.confirm(`Replace this block’s HTML and CSS with the “${template.label}” template?`)) return;
                  onChange({ ...block, html: template.html, css: template.css });
                }}>
                  <option value="">Choose a template…</option>
                  {HTML_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
                </select>
                <span className="admin-field-help">Changes show in the preview as you type. Scripts, event handlers (onclick…), and unsafe links are removed when the page is shown. Use var(--mulberry), var(--ink), var(--ivory) to match the theme colors.</span>
              </label>
            ) : <p className="admin-form-message">Only an owner can change custom HTML. You can still move or duplicate this block.</p>
          ) : null}
          {block.type === 'heroHeading' ? <HeroDynamicSourcePicker resourceType={resourceType} value={heroDynamicSource(block, 'heading')} label="Heading" onChange={(source) => onChange(withHeroDynamicSource(block, 'heading', source))} /> : null}
          {renderFields(contentFields)}
          {block.type === 'customLiquid' ? <p className="admin-field-help">Only public fields from this {resourceType} are available: {resourceType === 'product' ? <><code>product.title</code>, <code>product.description</code>, <code>product.handle</code>, <code>product.url</code>, and <code>product.featured_image</code>.</> : <><code>collection.title</code>, <code>collection.description</code>, <code>collection.handle</code>, <code>collection.url</code>, and <code>collection.image</code>.</>} Liquid output is escaped by default and sanitized before display. Includes and raw output are disabled. Maximum source length: 12,000 characters.</p> : null}
          {block.type === 'instagram' ? <p className="admin-field-help">Posts, reels, and the heading for this section are managed on the Instagram page. <a href="/admin/instagram" target="_blank" rel="noreferrer" className="admin-text-link">Manage Instagram posts ↗</a></p> : null}
          {!config.fields.length && block.type !== 'instagram' ? <p className="admin-field-help">This section has no settings. You can move or remove it.</p> : null}
        </div>
      </details> : null}
      {mediaFields.length ? <details className="shopify-editor-settings__group" open>
        <summary>Media</summary>
        <div className="shopify-editor-settings__group-body">{renderFields(mediaFields)}</div>
      </details> : null}
      {config.cards ? <details className="shopify-editor-settings__group" open>
        <summary>{config.cards.label}s</summary>
        <div className="shopify-editor-settings__group-body">{block.type === 'productInformation'
          ? <ProductInformationBlocksEditor block={block} onChange={onChange} />
          : block.type === 'searchHeader'
            ? <SearchNestedBlocksEditor block={block} onChange={onChange} group="header" />
            : block.type === 'searchResults'
              ? <SearchNestedBlocksEditor block={block} onChange={onChange} group="results" />
              : <CardsEditor block={block} config={config.cards} onChange={onChange} selectedCardId={selectedCardId} />}</div>
      </details> : null}
      {showNestedBlocks && block.type !== 'featuredCollection' && block.type !== 'customLiquid' ? <details className="shopify-editor-settings__group" open>
        <summary>Blocks</summary>
        <div className="shopify-editor-settings__group-body">
          <NestedBlocksEditor block={block} onChange={onChange} canEditCode={canEditCode} depth={depth} selectedCardId={selectedCardId} allowedTypes={nestedBlockTypes} collectionOptions={collectionOptions} themeColors={themeColors} onOpenThemeSettings={onOpenThemeSettings} resourceTitle={resourceTitle} resourceType={resourceType} />
        </div>
      </details> : null}
      {!hasDedicatedSectionSettings ? <BlockSettingsJson settings={block.settings} onChange={(settings) => onChange({ ...block, settings })} /> : null}
      {!hasDedicatedSectionSettings ? <SectionDesign design={block.design} onChange={(design) => onChange({ ...block, design })} /> : null}
      {depth === 0 && resourceType !== 'checkout' && block.type !== 'checkout' ? <details className="shopify-editor-settings__group">
        <summary>Custom CSS</summary>
        <div className="shopify-editor-settings__group-body">
          {canEditCode ? <>
            <CodeField title="Custom CSS" value={block.settings?.customCss || ''} language="css" maxLength={500} lightSurface onChange={(customCss) => onChange({ ...block, settings: { ...(block.settings || {}), customCss } })} />
            <p className="admin-field-help">Add CSS for this section. Use selectors such as <code>h2</code> or <code>.button</code>. Up to 500 characters. Only Shopify CDN URLs and media, container, layer, and supports rules are allowed.</p>
            <span className="admin-field-help">{String(block.settings?.customCss || '').length}/500</span>
          </> : <p className="admin-field-help">Only a store owner can edit section CSS.</p>}
        </div>
      </details> : null}
    </div>
  );
}

function AddBlockButton({ onAdd, label = 'Add block', canEditCode = false, allowedTypes = null }) {
  const [open, setOpen] = useState(false);
  const choices = (allowedTypes ? allowedTypes.map((type) => [type, BLOCK_TYPES[type]]) : Object.entries(BLOCK_TYPES))
    .filter(([type, config]) => config && (allowedTypes ? allowedTypes.includes(type) : !config.childOnly && !config.rootOnly) && (canEditCode || !config.ownerOnly));
  return (
    <div className={`admin-add-block${open ? ' is-open' : ''}`}>
      <button type="button" className="admin-add-block__toggle" onClick={() => setOpen((value) => !value)}>{open ? 'Close' : `+ ${label}`}</button>
      {open ? (
        <div className="admin-add-block__menu">
          {choices.map(([type, config]) => (
            <button type="button" key={type} disabled={Boolean(config.unavailableReason)} style={config.unavailableReason ? { opacity: 0.55, cursor: 'not-allowed' } : undefined} onClick={() => { if (config.unavailableReason) return; onAdd(type); setOpen(false); }}>
              <strong>{config.label}</strong>
              <span>{config.unavailableReason || config.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BlockCard({ block, index, total, handle, expanded, onToggle, onChange, onMove, onDuplicate, onDelete, canEditCode = false, themeColors = DEFAULT_THEME, onOpenThemeSettings, resourceTitle = '', resourceType = '', productOptions = [] }) {
  const config = BLOCK_TYPES[block.type];
  if (!config) return null;
  const isStaticPasswordFooter = block.type === 'passwordFooter';
  const isUniqueBlock = Boolean(config.unique);
  return (
    <section className={`admin-block${expanded ? ' is-expanded' : ''}`} data-block-editor-id={block.id}>
      <div className="admin-block__head">
        {isStaticPasswordFooter ? <span aria-hidden="true" /> : <span {...handle}>⋮⋮</span>}
        <button type="button" className="admin-block__title" onClick={onToggle} aria-expanded={expanded}>
          <span className="admin-block__type">{config.label}</span>
          <span className="admin-block__summary">{blockSummary(block) || config.description}</span>
        </button>
        <div className="admin-block__tools">
          {isStaticPasswordFooter ? <button type="button" aria-pressed={block.enabled !== false} onClick={() => onChange({ ...block, enabled: block.enabled === false })}>{block.enabled === false ? 'Show' : 'Hide'}</button> : <>
            <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} aria-label="Move block up">↑</button>
            <button type="button" onClick={() => onMove(index + 1)} disabled={index === total - 1} aria-label="Move block down">↓</button>
            {!isUniqueBlock ? <button type="button" onClick={onDuplicate}>Duplicate</button> : null}
            <button type="button" onClick={onDelete}>Delete</button>
          </>}
        </div>
      </div>
      {expanded ? (
        <BlockSettingsPanel block={block} onChange={onChange} canEditCode={canEditCode} themeColors={themeColors} productOptions={productOptions} onOpenThemeSettings={onOpenThemeSettings} resourceTitle={resourceTitle} resourceType={resourceType} />
      ) : null}
    </section>
  );
}

export default function BlockEditor({ blocks, onChange, onFocusBlock, selectedBlockId = null, validationIssue = null, canEditCode = false, themeColors = DEFAULT_THEME, onOpenThemeSettings, resourceTitle = '', resourceType = '', productOptions = [], allowedBlockTypes = null }) {
  const [expandedId, setExpandedId] = useState(null);
  const availableRootBlockTypes = allowedBlockTypes?.filter((type) => !BLOCK_TYPES[type]?.unique || !blocks.some((block) => block.type === type)) || null;
  const canAddRootBlock = !allowedBlockTypes || availableRootBlockTypes.length > 0;

  useEffect(() => {
    if (!selectedBlockId) return;
    const frame = requestAnimationFrame(() => {
      setExpandedId(selectedBlockId);
      requestAnimationFrame(() => {
        const blockElement = document.querySelector(`[data-block-editor-id="${CSS.escape(selectedBlockId)}"]`);
        blockElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (validationIssue?.fieldPath) {
          const fieldContainer = blockElement?.querySelector(`[data-validation-path="${CSS.escape(validationIssue.fieldPath)}"]`);
          const focusTarget = fieldContainer?.matches('input, textarea, select, button') ? fieldContainer : fieldContainer?.querySelector('input, textarea, select, button');
          focusTarget?.focus?.({ preventScroll: true });
          fieldContainer?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedBlockId, validationIssue]);

  const toggle = (id) => {
    setExpandedId((current) => (current === id ? null : id));
    onFocusBlock(id);
  };
  const insertAt = (position, type) => {
    const block = createBlock(type);
    const next = [...blocks];
    next.splice(position, 0, block);
    onChange(next);
    setExpandedId(block.id);
    onFocusBlock(block.id);
  };
  const duplicate = (index) => {
    const copy = duplicateBlockTree(blocks[index]);
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(next);
    setExpandedId(copy.id);
    onFocusBlock(copy.id);
  };
  const remove = (index) => {
    const config = BLOCK_TYPES[blocks[index].type];
    if (!window.confirm(`Delete the “${config?.label || 'block'}” block? You can undo by not saving.`)) return;
    onChange(blocks.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-block-editor">
      {canAddRootBlock ? <AddBlockButton onAdd={(type) => insertAt(0, type)} label="Add block at the top" canEditCode={canEditCode} allowedTypes={availableRootBlockTypes} /> : null}
      <SortableList
        items={blocks}
        onReorder={(from, to) => { onChange(moveItem(blocks, from, to)); onFocusBlock(blocks[from].id); }}
        renderItem={(block, index, handle) => (
          <>
            <BlockCard
              block={block}
              index={index}
              total={blocks.length}
              handle={handle}
              expanded={expandedId === block.id}
              onToggle={() => toggle(block.id)}
              onChange={(updated) => onChange(blocks.map((item, i) => (i === index ? updated : item)))}
              onMove={(target) => { onChange(moveItem(blocks, index, target)); onFocusBlock(block.id); }}
              onDuplicate={() => duplicate(index)}
              onDelete={() => remove(index)}
              canEditCode={canEditCode}
              themeColors={themeColors}
              onOpenThemeSettings={onOpenThemeSettings}
              resourceTitle={resourceTitle}
              resourceType={resourceType}
              productOptions={productOptions}
            />
            {canAddRootBlock ? <AddBlockButton onAdd={(type) => insertAt(index + 1, type)} label="Add block here" canEditCode={canEditCode} allowedTypes={availableRootBlockTypes} /> : null}
          </>
        )}
      />
    </div>
  );
}
