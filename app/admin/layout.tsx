import './navigation-scroll.css';

export const metadata = {
  title: 'Vendly',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <div className="admin-route-root">{children}</div>;
}

