import { Suspense, lazy } from 'react';
import { createBrowserRouter } from "react-router-dom";

const Loading = <div>Loading....</div>;

const MainPage = lazy(() => import('../pages/MainPage'));
const OpenLayersPage = lazy(() => import('../pages/OpenLayersPage'));
const CesiumPage = lazy(() => import('../pages/CesiumPage'));


const root = createBrowserRouter([
    { path: "", element: <Suspense fallback={Loading}><MainPage/></Suspense> },
    { path: "openlayers", element: <Suspense fallback={Loading}><OpenLayersPage/></Suspense> },
    { path: "cesium", element: <Suspense fallback={Loading}><CesiumPage/></Suspense> }
]);

export default root;