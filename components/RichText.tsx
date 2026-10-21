import { Fragment } from 'react';

function renderInline(text) {
  return String(text || '').split('\n').map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 ? <br /> : null}
      {line.split(/(\*[^*\n]+\*)/g).map((part, index) => (
        part.length > 2 && part.startsWith('*') && part.endsWith('*') ? <em key={index}>{part.slice(1, -1)}</em> : part
      ))}
    </Fragment>
  ));
}

export function paragraphsOf(text) {
  return String(text || '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

/** Single-line or line-broken text, e.g. headings. */
export function Inline({ text }) {
  return <>{renderInline(text)}</>;
}

/** One <p> per paragraph (paragraphs are separated by a blank line). */
export function Paragraphs({ text, className }) {
  return paragraphsOf(text).map((paragraph, index) => <p key={index} className={className}>{renderInline(paragraph)}</p>);
}

/** All paragraphs inside a single element, separated by a blank line break. */
export function JoinedParagraphs({ text }) {
  return paragraphsOf(text).map((paragraph, index) => (
    <Fragment key={index}>
      {index > 0 ? <><br /><br /></> : null}
      {renderInline(paragraph)}
    </Fragment>
  ));
}
