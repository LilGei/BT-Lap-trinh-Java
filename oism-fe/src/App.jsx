import { RouterProvider } from 'react-router-dom';
import { router } from '@/presentation/router/router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;