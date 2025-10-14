import 'expo-dev-client';
import { registerRootComponent } from 'expo';
import { AppProviders } from './app/providers/AppProviders';

function App() {
  return <AppProviders />;
}

registerRootComponent(App);
