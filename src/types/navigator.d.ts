// Extension des types Navigator pour les PWA
interface Navigator {
  standalone?: boolean;
}

// Extension des types Window pour les PWA
interface Window {
  navigator: Navigator;
}
