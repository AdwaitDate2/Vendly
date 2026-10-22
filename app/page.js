import './landing/landing.css';
import { LandingFirstViewport } from './landing/landing-components';

export const metadata = {
  title: 'Vendly — Build your business website',
  description: 'Choose a website project, shape its pages, and publish when it is ready.',
};

export default function HomePage() {
  return <LandingFirstViewport />;
}
