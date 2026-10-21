// @ts-nocheck
'use client';

export default function SectionDesign({ design = {}, onChange }) {
  const value = { width: 'default', spacing: 'default', align: 'default', background: 'default', headingSize: 'default', ...design };
  const choices = [
    ['width', 'Content width', [['default', 'Page default'], ['narrow', 'Narrow'], ['standard', 'Standard'], ['wide', 'Wide'], ['full', 'Full width']]],
    ['spacing', 'Section spacing', [['default', 'Page default'], ['compact', 'Compact'], ['standard', 'Standard'], ['spacious', 'Spacious']]],
    ['align', 'Text alignment', [['default', 'Page default'], ['left', 'Left'], ['center', 'Center'], ['right', 'Right']]],
    ['background', 'Background', [['default', 'Page default'], ['ivory', 'Ivory'], ['paper', 'Paper'], ['olive', 'Green'], ['mulberry', 'Mulberry']]],
    ['headingSize', 'Heading size', [['default', 'Page default'], ['small', 'Small'], ['standard', 'Standard'], ['large', 'Large']]],
  ];
  return <details className="admin-section-design"><summary>Design this section</summary><p>These design controls update the page preview immediately.</p><div className="admin-field-row">{choices.map(([key, label, options]) => <label className="admin-field" key={key}><span>{label}</span><select value={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.value })}>{options.map(([option, text]) => <option value={option} key={option}>{text}</option>)}</select></label>)}</div></details>;
}
