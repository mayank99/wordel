import { render } from 'preact';
import { Game } from './Game';
import { useTheme } from './utils/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import './index.css';

const App = () => {
  useRegisterSW();
  useTheme();

  return <Game />;
};

render(<App />, document.getElementById('app')!);
