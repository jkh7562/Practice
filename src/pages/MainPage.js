import { Link } from 'react-router-dom';

const MainPage = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-blue-600 mb-8">GIS Dashboard</h1>
            <div className="flex gap-4">
                <Link to="/openlayers" className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition">
                    OpenLayers Map
                </Link>
                <Link to="/cesium" className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition">
                    Cesium 3D Globe
                </Link>
            </div>
        </div>
    );
}

export default MainPage;