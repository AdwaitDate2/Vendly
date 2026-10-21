import Link from 'next/link';
import { searchAdminWorkspace } from '@/lib/admin-search';

function Group({ title, count, children }) {
  return <section className="admin-card admin-search-group"><div className="admin-card__heading"><div><span className="admin-eyebrow">Workspace search</span><h2>{title}</h2></div><span className="admin-card__hint">{count} result{count === 1 ? '' : 's'}</span></div>{children}</section>;
}

function Empty({ text }) {
  return <p className="admin-search-empty">{text}</p>;
}

export default async function AdminSearchPage({ searchParams }) {
  const params = await searchParams;
  const result = await searchAdminWorkspace(params?.q || params?.query || '');
  const hasResults = result.products.length || result.collections.length || result.content.length || result.inquiries.length;
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">Command centre</span><h1>Search.</h1><p>Find products, collections, content, and inquiries from one permission-protected workspace search.</p></div></div>
      <form action="/admin/search" className="admin-list-search admin-search-form"><span aria-hidden="true">⌕</span><input name="q" defaultValue={result.query} placeholder="Search your workspace" autoFocus /><button type="submit">Search</button></form>
      {!result.query ? <div className="admin-card admin-empty admin-empty--page"><span>⌕</span><h2>Search the workspace</h2><p>Try a product name, SKU, collection, content key, or inquiry contact.</p></div> : !hasResults ? <div className="admin-card admin-empty admin-empty--page"><span>⌕</span><h2>No matches yet</h2><p>Try a shorter phrase or search a different resource.</p></div> : <div className="admin-search-grid">
        <Group title="Products" count={result.products.length}>{result.products.length ? <ul className="admin-search-results">{result.products.map((product) => <li key={product.id}><Link href={`/admin/products/${product.id}`}><strong>{product.shortTitle || product.title}</strong><small>{product.slug} · {product.status}</small></Link></li>)}</ul> : <Empty text="No product matches." />}</Group>
        <Group title="Collections" count={result.collections.length}>{result.collections.length ? <ul className="admin-search-results">{result.collections.map((collection) => <li key={collection.id}><Link href={`/admin/collections/${collection.id}`}><strong>{collection.name}</strong><small>{collection.slug} · {collection.status}</small></Link></li>)}</ul> : <Empty text="No collection matches." />}</Group>
        <Group title="Content" count={result.content.length}>{result.content.length ? <ul className="admin-search-results">{result.content.map((entry) => <li key={entry.key}><Link href={`/admin/content/${entry.key}`}><strong>{entry.title}</strong><small>{entry.key} · {entry.status}</small></Link></li>)}</ul> : <Empty text="No content matches." />}</Group>
        <Group title="Inquiries" count={result.inquiries.length}>{result.inquiries.length ? <ul className="admin-search-results">{result.inquiries.map((inquiry) => <li key={inquiry.id}><Link href={`/admin/inquiries/${inquiry.id}`}><strong>{inquiry.name}</strong><small>{inquiry.email} · {inquiry.requestType} · {inquiry.status}</small></Link></li>)}</ul> : <Empty text="No inquiry matches." />}</Group>
      </div>}
    </div>
  );
}
